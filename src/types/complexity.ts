import { z } from 'zod';

// Stages used for stage-based multipliers
export const COMPLEXITY_STAGES = [
	'presales',
	'solutioning',
	'design',
	'build',
	'test',
	'cutover',
	'operations',
] as const;

export type ComplexityStage = (typeof COMPLEXITY_STAGES)[number];

export interface ComplexityOption {
	id: string;
	label: string;
	description?: string;
	multiplier: number; // e.g., 1.15 = +15%
	tags?: string[];
}

export type ComplexityCategory =
	| 'customer-type'
	| 'product-mix'
	| 'access-technology'
	| 'channel'
	| 'nfr'
	| 'integration'
	| 'deployment'
	| 'delivery-services';

export type NfrKey = 'performance' | 'scalability' | 'security' | 'availability';

export interface NfrLevel extends ComplexityOption {
	level: 'baseline' | 'moderate' | 'high' | 'extreme';
}

export type NfrOptions = Record<NfrKey, NfrLevel[]>;

export type DeliveryServiceMultiplier = Record<string, number>;

export interface IntegrationConfig {
	basePerApiPercent: number; // 0.10 => +10% per integration point
	legacyCompatibilityMultiplier: number; // 1.15 => +15% if legacy compatibility needed
	cap?: number; // Optional overall cap
}

export interface ComplexityConfig {
	categories: {
		'customer-type': ComplexityOption[];
		'product-mix': ComplexityOption[];
		'access-technology': ComplexityOption[];
		channel: ComplexityOption[];
		deployment: ComplexityOption[];
	};
	nfr: NfrOptions;
	integration: IntegrationConfig;
	deliveryServices: DeliveryServiceMultiplier;
	stageBaseline: Record<ComplexityStage, number>;
}

// Schemas
export const ComplexityOptionSchema = z.object({
	id: z.string(),
	label: z.string(),
	description: z.string().optional(),
	multiplier: z.number().positive(),
	tags: z.array(z.string()).optional(),
});

export const NfrLevelSchema = ComplexityOptionSchema.extend({
	level: z.enum(['baseline', 'moderate', 'high', 'extreme']),
});

export const IntegrationConfigSchema = z.object({
	basePerApiPercent: z.number().min(0),
	legacyCompatibilityMultiplier: z.number().min(1),
	cap: z.number().min(1).optional(),
});

const StageEnum = z.enum([
	'presales',
	'solutioning',
	'design',
	'build',
	'test',
	'cutover',
	'operations',
]);

export const ComplexityConfigSchema = z.object({
	categories: z.object({
		'customer-type': z.array(ComplexityOptionSchema).min(1),
		'product-mix': z.array(ComplexityOptionSchema).min(1),
		'access-technology': z.array(ComplexityOptionSchema).min(1),
		channel: z.array(ComplexityOptionSchema).min(1),
		deployment: z.array(ComplexityOptionSchema).min(1),
	}),
	nfr: z.custom<NfrOptions>(),
	integration: IntegrationConfigSchema,
	deliveryServices: z.record(z.string(), z.number().min(1)),
	stageBaseline: z.record(StageEnum, z.number().min(0.01)),
});

// Default configuration aligned to telecom BSS scoping
export const DEFAULT_COMPLEXITY_CONFIG: ComplexityConfig = {
	categories: {
		'customer-type': [
			{ id: 'consumer', label: 'Consumer', multiplier: 1.05, tags: ['low'] },
			{ id: 'usmb', label: 'Unmanaged SMB', multiplier: 1.1 },
			{ id: 'msmb', label: 'Managed SMB', multiplier: 1.15 },
			{ id: 'government', label: 'Government', multiplier: 1.25 },
			{ id: 'enterprise', label: 'Enterprise / Wholesale', multiplier: 1.3, tags: ['high'] },
		],
		'product-mix': [
			{ id: 'mobile', label: 'Mobile', multiplier: 1.08 },
			{ id: 'fixed-line', label: 'Fixed Line', multiplier: 1.1 },
			{ id: 'fiber', label: 'Fiber / Bundles', multiplier: 1.25 },
			{ id: 'digital-services', label: 'Digital Services', multiplier: 1.15 },
			{ id: 'devices', label: 'Devices & Accessories', multiplier: 1.05 },
			{ id: 'add-ons', label: 'Add-Ons', multiplier: 1.05 },
		],
		'access-technology': [
			{ id: '4g-5g', label: '4G / 5G', multiplier: 1.08 },
			{ id: 'fiber', label: 'Fiber', multiplier: 1.18 },
			{ id: 'satellite', label: 'Satellite', multiplier: 1.2 },
			{ id: 'dsl', label: 'DSL', multiplier: 1.1 },
		],
		channel: [
			{ id: 'retail', label: 'Retail', multiplier: 1.05 },
			{ id: 'call-centre', label: 'Call Centre', multiplier: 1.1 },
			{ id: 'digital', label: 'Digital', multiplier: 1.2 },
			{ id: 'omni', label: 'Multi-Channel / Omni', multiplier: 1.2 },
		],
		deployment: [
			{ id: 'cloud', label: 'Cloud', multiplier: 1.08 },
			{ id: 'on-prem', label: 'On-Premises', multiplier: 1.2 },
			{ id: 'hybrid', label: 'Hybrid', multiplier: 1.25 },
		],
	},
	nfr: {
		performance: [
			{ id: 'perf-baseline', label: 'Baseline', multiplier: 1.0, level: 'baseline' },
			{ id: 'perf-moderate', label: 'Activation < 15 min', multiplier: 1.05, level: 'moderate' },
			{ id: 'perf-high', label: 'Activation < 5 min', multiplier: 1.15, level: 'high' },
			{ id: 'perf-extreme', label: 'Activation < 1 min', multiplier: 1.25, level: 'extreme' },
		],
		scalability: [
			{ id: 'scal-baseline', label: 'Baseline', multiplier: 1.0, level: 'baseline' },
			{ id: 'scal-moderate', label: 'Up to 10k tx/day', multiplier: 1.05, level: 'moderate' },
			{ id: 'scal-high', label: 'Up to 100k tx/day', multiplier: 1.1, level: 'high' },
			{ id: 'scal-extreme', label: '1M+ tx/day', multiplier: 1.2, level: 'extreme' },
		],
		security: [
			{ id: 'sec-baseline', label: 'Baseline', multiplier: 1.0, level: 'baseline' },
			{ id: 'sec-moderate', label: 'GDPR or ISO27001', multiplier: 1.12, level: 'moderate' },
			{ id: 'sec-high', label: 'GDPR + PCI-DSS', multiplier: 1.15, level: 'high' },
			{ id: 'sec-extreme', label: 'Regulated (e.g., Gov/Defense)', multiplier: 1.25, level: 'extreme' },
		],
		availability: [
			{ id: 'avail-baseline', label: '99.5%', multiplier: 1.0, level: 'baseline' },
			{ id: 'avail-high', label: '99.9%', multiplier: 1.1, level: 'high' },
			{ id: 'avail-extreme', label: '99.99%', multiplier: 1.2, level: 'extreme' },
			{ id: 'avail-ultra', label: 'Active-Active 99.995%', multiplier: 1.25, level: 'extreme' },
		],
	},
	integration: {
		basePerApiPercent: 0.1,
		legacyCompatibilityMultiplier: 1.15,
		cap: 2,
	},
	deliveryServices: {
		Development: 1.15,
		Test: 1.15,
		Migration: 1.25,
		Training: 1.1,
		Integration: 1.2,
		Architecture: 1.1,
		Design: 1.1,
		'Platform Engineering': 1.15,
		'Platform Architecture': 1.15,
		Environments: 1.1,
		'Release Deployment': 1.1,
		'Production Cutover': 1.2,
		Warranty: 1.1,
		Hypercare: 1.15,
		'Project Management': 1.1,
		'Program Management': 1.1,
		'Stakeholder Management': 1.05,
		Governance: 1.1,
		Build: 1.1,
		Release: 1.1,
	},
	stageBaseline: {
		presales: 1,
		solutioning: 1,
		design: 1,
		build: 1,
		test: 1,
		cutover: 1,
		operations: 1,
	},
};

export interface ComplexitySelection {
	customerTypeIds: string[]; // multi
	productMixIds: string[]; // multi
	accessTechnologyIds: string[]; // multi
	channelIds: string[]; // multi
	deploymentId: string; // single
	nfrSelections: Partial<Record<NfrKey, string>>;
	integration: {
		apiCount: number;
		requiresLegacyCompatibility: boolean;
	};
	deliveryServicesEnabled?: string[];
}

const NfrSelectionsSchema = z.object({
	performance: z.string().optional(),
	scalability: z.string().optional(),
	security: z.string().optional(),
	availability: z.string().optional(),
});

export const ComplexitySelectionSchema = z.object({
	customerTypeIds: z.array(z.string()).min(0),
	productMixIds: z.array(z.string()).min(0),
	accessTechnologyIds: z.array(z.string()).min(0),
	channelIds: z.array(z.string()).min(0),
	deploymentId: z.string(),
	nfrSelections: NfrSelectionsSchema.default({}),
	integration: z.object({
		apiCount: z.number().int().min(0),
		requiresLegacyCompatibility: z.boolean(),
	}),
	deliveryServicesEnabled: z.array(z.string()).optional(),
});

// Validate default config at module load (dev safeguard)
(() => {
	const parsed = ComplexityConfigSchema.safeParse(DEFAULT_COMPLEXITY_CONFIG);
	if (!parsed.success) {
		// eslint-disable-next-line no-console
		console.error('Invalid DEFAULT_COMPLEXITY_CONFIG', parsed.error.flatten());
	}
})();


