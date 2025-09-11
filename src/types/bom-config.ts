// BOM Configuration Types
export interface FieldDefinition {
  id: string;
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
  source: 'SpecSync' | 'SET' | 'CETv22' | 'BlueDolphin' | 'ADO' | 'BOM' | 'Calculated';
  category: string;
  description?: string;
  isAvailable: boolean;
  sampleValue?: any;
  isRequired?: boolean;
  isCalculated?: boolean;
  calculationFormula?: string;
  dependencies?: string[]; // Field IDs this field depends on
}

export interface FieldCategory {
  id: string;
  name: string;
  description?: string;
  source: FieldDefinition['source'];
  fields: FieldDefinition[];
  isExpanded?: boolean;
}

export interface BOMConfiguration {
  id: string;
  name: string;
  description?: string;
  selectedFields: string[]; // Field IDs
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
  version: string;
}

export interface BOMExportTemplate {
  id: string;
  name: string;
  description?: string;
  fieldIds: string[];
  isBuiltIn?: boolean;
  category?: string;
}

export interface FieldDiscoveryResult {
  fields: FieldDefinition[];
  categories: FieldCategory[];
  lastUpdated: string;
  sources: {
    [key in FieldDefinition['source']]: {
      isAvailable: boolean;
      fieldCount: number;
      lastChecked: string;
    };
  };
}

export interface BOMConfigState {
  availableFields: FieldDefinition[];
  categories: FieldCategory[];
  selectedFields: string[];
  configurations: BOMConfiguration[];
  activeConfiguration: string | null;
  isDiscovering: boolean;
  lastDiscovery: string | null;
  exportTemplates: BOMExportTemplate[];
}

// Built-in export templates
export const BUILT_IN_TEMPLATES: BOMExportTemplate[] = [
  {
    id: 'basic',
    name: 'Basic BOM',
    description: 'Essential fields for basic BOM export',
    fieldIds: [
      'id', 'tmfDomain', 'capability', 'requirement', 'cutEffort', 
      'priority', 'status', 'source', 'totalServiceCost'
    ],
    isBuiltIn: true,
    category: 'Standard'
  },
  {
    id: 'detailed',
    name: 'Detailed BOM',
    description: 'Comprehensive BOM with all available fields',
    fieldIds: [], // Will be populated dynamically
    isBuiltIn: true,
    category: 'Standard'
  },
  {
    id: 'effort-focused',
    name: 'Effort Analysis',
    description: 'Focus on effort and resource breakdown',
    fieldIds: [
      'id', 'tmfDomain', 'capability', 'requirement', 'cutEffort',
      'complexityMultiplier', 'complexityAdjustedEffort', 'resourceBreakdown',
      'businessAnalyst', 'solutionArchitect', 'developer', 'qaEngineer'
    ],
    isBuiltIn: true,
    category: 'Analysis'
  },
  {
    id: 'service-delivery',
    name: 'Service Delivery',
    description: 'Service delivery and cost analysis',
    fieldIds: [
      'id', 'tmfDomain', 'capability', 'requirement', 'serviceDeliveryServices',
      'totalServiceCost', 'includedServices', 'priority', 'status'
    ],
    isBuiltIn: true,
    category: 'Service'
  }
];

// Field categories for organization
export const FIELD_CATEGORIES: Omit<FieldCategory, 'fields'>[] = [
  {
    id: 'basic-info',
    name: 'Basic Information',
    description: 'Core identification and classification fields',
    source: 'BOM'
  },
  {
    id: 'specsync',
    name: 'SpecSync Requirements',
    description: 'Fields from SpecSync import data',
    source: 'SpecSync'
  },
  {
    id: 'set-estimation',
    name: 'SET Estimation',
    description: 'Effort estimation and work package data',
    source: 'SET'
  },
  {
    id: 'cetv22-resources',
    name: 'CETv22 Resources',
    description: 'Resource planning and job profile data',
    source: 'CETv22'
  },
  {
    id: 'blue-dolphin',
    name: 'Blue Dolphin',
    description: 'Enterprise architecture and object data',
    source: 'BlueDolphin'
  },
  {
    id: 'ado-integration',
    name: 'ADO Integration',
    description: 'Azure DevOps work item and tag data',
    source: 'ADO'
  },
  {
    id: 'calculated',
    name: 'Calculated Fields',
    description: 'Derived and computed fields',
    source: 'Calculated'
  }
];
