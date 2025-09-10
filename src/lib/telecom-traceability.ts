import type { ComplexitySelection } from '@/types/complexity';
import { DEFAULT_COMPLEXITY_CONFIG } from '@/types/complexity';
import { computeComplexity } from '@/lib/complexity-scoring';

export interface TraceabilityMatrix {
  selection: ComplexitySelection;
  overallMultiplier: number;
  etomProcesses: string[];
  odaFunctionalBlocks: string[];
  archimate: {
    businessProcesses: string[];
    applicationServices: string[];
    applicationComponents: string[];
  };
  ado: {
    tags: string[];
    fields: Record<string, string | number | boolean>;
  };
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr.filter(Boolean)));
}

// Lightweight telecom mappings (extensible later). Keys reference selection IDs
const ETOM_MAP: Record<string, string[]> = {
  'product-mix:mobile': ['Selling', 'Order Handling', 'Service Configuration & Activation'],
  'product-mix:fixed-line': ['Selling', 'Order Handling', 'Service Configuration & Activation'],
  'product-mix:fiber': ['Selling', 'Order Handling', 'Service Configuration & Activation', 'Problem Handling'],
  'product-mix:digital-services': ['Selling', 'Problem Handling'],
  'product-mix:devices': ['Selling', 'Order Handling'],
  'product-mix:add-ons': ['Selling', 'Order Handling'],
  'channel:retail': ['Selling'],
  'channel:call-centre': ['Problem Handling', 'Customer Relationship Management'],
  'channel:digital': ['Selling', 'Problem Handling'],
  'channel:omni': ['Selling', 'Problem Handling', 'Customer Relationship Management'],
  'access-technology:4g-5g': ['Service Configuration & Activation'],
  'access-technology:fiber': ['Service Configuration & Activation', 'Resource Trouble Management'],
  'access-technology:satellite': ['Service Configuration & Activation', 'Problem Handling'],
  'access-technology:dsl': ['Service Configuration & Activation'],
};

const ODA_MAP: Record<string, string[]> = {
  'product-mix:mobile': ['Customer Management', 'Product & Offer Management', 'Order Management'],
  'product-mix:fiber': ['Customer Management', 'Service Orchestration', 'Resource Management'],
  'product-mix:digital-services': ['Customer Management', 'Party Management', 'Billing & Revenue'],
  'channel:retail': ['Customer Management'],
  'channel:digital': ['Customer Management', 'Party Management'],
  'access-technology:4g-5g': ['Service Orchestration', 'Resource Management'],
  'access-technology:fiber': ['Service Orchestration', 'Resource Management'],
};

const ARCHIMATE_MAP_BP: Record<string, string[]> = {
  'product-mix:mobile': ['Order Handling', 'Customer Onboarding'],
  'product-mix:fiber': ['Order Handling', 'Installation Scheduling'],
  'channel:retail': ['Retail Sales'],
  'channel:digital': ['Digital Self-Service'],
};

const ARCHIMATE_MAP_AS: Record<string, string[]> = {
  'product-mix:mobile': ['Order Management Service', 'Customer Profile Service'],
  'product-mix:fiber': ['Provisioning Service', 'Workforce Scheduling Service'],
  'channel:digital': ['Web Channel Service'],
};

const ARCHIMATE_MAP_AC: Record<string, string[]> = {
  'product-mix:mobile': ['CRM', 'Catalog', 'Order Management (OM)'],
  'product-mix:fiber': ['CRM', 'Provisioning Engine', 'Field Service'],
  'access-technology:4g-5g': ['Network Exposure / 5G Core Integrations'],
  'access-technology:fiber': ['OSS Provisioning Gateway'],
};

export function generateTraceabilityFromSelection(
  selection: ComplexitySelection,
): TraceabilityMatrix {
  const result = computeComplexity(selection, DEFAULT_COMPLEXITY_CONFIG);

  const keys: string[] = [
    `customer-type:${selection.customerTypeId}`,
    ...selection.productMixIds.map((id) => `product-mix:${id}`),
    ...selection.channelIds.map((id) => `channel:${id}`),
    ...selection.accessTechnologyIds.map((id) => `access-technology:${id}`),
    `deployment:${selection.deploymentId}`,
  ];

  const etom = unique(keys.flatMap((k) => ETOM_MAP[k] || []));
  const oda = unique(keys.flatMap((k) => ODA_MAP[k] || []));
  const archiBP = unique(keys.flatMap((k) => ARCHIMATE_MAP_BP[k] || []));
  const archiAS = unique(keys.flatMap((k) => ARCHIMATE_MAP_AS[k] || []));
  const archiAC = unique(keys.flatMap((k) => ARCHIMATE_MAP_AC[k] || []));

  const tags = unique([
    `Complexity:${result.overallMultiplier}`,
    ...selection.productMixIds.map((v) => `Product:${v}`),
    ...selection.channelIds.map((v) => `Channel:${v}`),
    ...selection.accessTechnologyIds.map((v) => `Access:${v}`),
    `Customer:${selection.customerTypeId}`,
    `Deployment:${selection.deploymentId}`,
  ]);

  const fields: Record<string, string | number | boolean> = {
    'Custom.ComplexityMultiplier': result.overallMultiplier,
    'Custom.CustomerType': selection.customerTypeId,
    'Custom.ProductMix': selection.productMixIds.join(';'),
    'Custom.AccessTech': selection.accessTechnologyIds.join(';'),
    'Custom.Channel': selection.channelIds.join(';'),
    'Custom.Deployment': selection.deploymentId,
  };

  return {
    selection,
    overallMultiplier: result.overallMultiplier,
    etomProcesses: etom,
    odaFunctionalBlocks: oda,
    archimate: {
      businessProcesses: archiBP,
      applicationServices: archiAS,
      applicationComponents: archiAC,
    },
    ado: { tags, fields },
  };
}

export function serializeTraceabilityToCSV(matrix: TraceabilityMatrix): string {
  const rows: string[][] = [];
  rows.push(['Section', 'Name']);
  matrix.etomProcesses.forEach((p) => rows.push(['eTOM Process', p]));
  matrix.odaFunctionalBlocks.forEach((b) => rows.push(['ODA Functional Block', b]));
  matrix.archimate.businessProcesses.forEach((n) => rows.push(['ArchiMate Business Process', n]));
  matrix.archimate.applicationServices.forEach((n) => rows.push(['ArchiMate Application Service', n]));
  matrix.archimate.applicationComponents.forEach((n) => rows.push(['ArchiMate Application Component', n]));
  rows.push(['Complexity Multiplier', String(matrix.overallMultiplier)]);
  return rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
}


