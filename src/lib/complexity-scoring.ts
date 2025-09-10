import {
  DEFAULT_COMPLEXITY_CONFIG,
  type ComplexityConfig,
  type ComplexitySelection,
  type ComplexityStage,
  type NfrKey,
} from '../types/complexity';

export interface ComplexityBreakdownItem {
  key: string;
  label: string;
  multiplier: number;
}

export interface ComplexityResult {
  // Multipliers per major category
  categories: Record<
    'customer-type' | 'product-mix' | 'access-technology' | 'channel' | 'deployment',
    ComplexityBreakdownItem
  >;
  nfr: Record<NfrKey, ComplexityBreakdownItem | null>;
  integration: ComplexityBreakdownItem;

  // Aggregates
  overallMultiplier: number; // excludes delivery services
  stageMultipliers: Record<ComplexityStage, number>;

  // Service-specific (apply when calculating service efforts)
  deliveryServiceMultipliers: Record<string, number>;
}

function getOptionMultiplier(
  options: { id: string; label: string; multiplier: number }[],
  id: string,
): ComplexityBreakdownItem {
  const found = options.find((o) => o.id === id);
  if (!found) {
    return { key: id, label: id, multiplier: 1 };
  }
  return { key: found.id, label: found.label, multiplier: found.multiplier };
}

function computeNfrMultiplier(
  config: ComplexityConfig,
  selections: ComplexitySelection,
): { nfr: Record<NfrKey, ComplexityBreakdownItem | null>; aggregate: number } {
  let aggregate = 1;
  const nfr: Record<NfrKey, ComplexityBreakdownItem | null> = {
    performance: null,
    scalability: null,
    security: null,
    availability: null,
  };

  (Object.keys(nfr) as NfrKey[]).forEach((key) => {
    const selectedId = selections.nfrSelections?.[key];
    if (!selectedId) return;
    const levels = config.nfr[key] || [];
    const found = levels.find((l) => l.id === selectedId);
    if (found) {
      nfr[key] = { key: found.id, label: found.label, multiplier: found.multiplier };
      aggregate *= found.multiplier;
    }
  });

  return { nfr, aggregate };
}

function computeIntegrationMultiplier(
  config: ComplexityConfig,
  apiCount: number,
  requiresLegacyCompatibility: boolean,
): ComplexityBreakdownItem {
  const base = 1 + apiCount * config.integration.basePerApiPercent;
  const legacy = requiresLegacyCompatibility
    ? base * config.integration.legacyCompatibilityMultiplier
    : base;
  const capped = config.integration.cap ? Math.min(legacy, config.integration.cap) : legacy;
  return {
    key: 'integration',
    label: `Integrations (${apiCount} API${apiCount === 1 ? '' : 's'}${
      requiresLegacyCompatibility ? ', legacy' : ''
    })`,
    multiplier: Number(capped.toFixed(4)),
  };
}

export function computeComplexity(
  selections: ComplexitySelection,
  config: ComplexityConfig = DEFAULT_COMPLEXITY_CONFIG,
): ComplexityResult {
  // Multi-select categories combine multiplicatively across selected options
  const productMixMultiplier = selections.productMixIds.reduce((acc, id) => {
    return acc * getOptionMultiplier(config.categories['product-mix'], id).multiplier;
  }, 1);
  const accessTechMultiplier = selections.accessTechnologyIds.reduce((acc, id) => {
    return acc * getOptionMultiplier(config.categories['access-technology'], id).multiplier;
  }, 1);
  const channelMultiplier = selections.channelIds.reduce((acc, id) => {
    return acc * getOptionMultiplier(config.categories.channel, id).multiplier;
  }, 1);

  const customerMultiplier = selections.customerTypeIds.reduce((acc, id) => {
    return acc * getOptionMultiplier(config.categories['customer-type'], id).multiplier;
  }, 1);

  const categories = {
    'customer-type': { key: 'customer-type', label: 'Customer Type', multiplier: Number(customerMultiplier.toFixed(4)) },
    'product-mix': { key: 'product-mix', label: 'Product Mix', multiplier: Number(productMixMultiplier.toFixed(4)) },
    'access-technology': {
      key: 'access-technology',
      label: 'Access Technology',
      multiplier: Number(accessTechMultiplier.toFixed(4)),
    },
    channel: { key: 'channel', label: 'Channel', multiplier: Number(channelMultiplier.toFixed(4)) },
    deployment: getOptionMultiplier(config.categories.deployment, selections.deploymentId),
  } as ComplexityResult['categories'];

  const nfrAgg = computeNfrMultiplier(config, selections);
  const integration = computeIntegrationMultiplier(
    config,
    selections.integration.apiCount,
    selections.integration.requiresLegacyCompatibility,
  );

  // Product of category multipliers (excluding delivery services)
  const categoryProduct = Object.values(categories).reduce(
    (acc, item) => acc * (item?.multiplier ?? 1),
    1,
  );
  const overallMultiplier = Number((categoryProduct * nfrAgg.aggregate * integration.multiplier).toFixed(4));

  // Stage multipliers are baseline-scaled
  const stageMultipliers = Object.fromEntries(
    Object.entries(config.stageBaseline).map(([stage, base]) => [
      stage,
      Number((base * overallMultiplier).toFixed(4)),
    ]),
  ) as Record<ComplexityStage, number>;

  // Per-service multipliers (not baked into overall)
  const deliveryServiceMultipliers: Record<string, number> = {};
  const active = selections.deliveryServicesEnabled || Object.keys(config.deliveryServices);
  active.forEach((s) => {
    if (config.deliveryServices[s]) deliveryServiceMultipliers[s] = config.deliveryServices[s];
  });

  return {
    categories,
    nfr: nfrAgg.nfr,
    integration,
    overallMultiplier,
    stageMultipliers,
    deliveryServiceMultipliers,
  };
}

export function formatComplexitySummary(result: ComplexityResult): string {
  const cat = Object.values(result.categories)
    .map((i) => `${i.label}: x${i.multiplier}`)
    .join(', ');

  const nfr = (Object.values(result.nfr).filter(Boolean) as ComplexityBreakdownItem[])
    .map((i) => `${i.label}: x${i.multiplier}`)
    .join(', ');

  const stages = Object.entries(result.stageMultipliers)
    .map(([k, v]) => `${k}=x${v}`)
    .join(', ');

  return `Categories[${cat}] | NFR[${nfr}] | Integration=${result.integration.multiplier} | Overall=${result.overallMultiplier} | Stages[${stages}]`;
}


