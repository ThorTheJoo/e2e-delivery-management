import { FieldDefinition, FieldCategory, FieldDiscoveryResult, FIELD_CATEGORIES } from '@/types/bom-config';
import { SpecSyncItem } from '@/types';
import { BlueDolphinObjectEnhanced } from '@/types/blue-dolphin';

/**
 * Field Discovery Engine
 * Automatically discovers available fields from all data sources
 */
export class FieldDiscoveryEngine {
  private static instance: FieldDiscoveryEngine;
  private discoveryCache: Map<string, FieldDiscoveryResult> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  static getInstance(): FieldDiscoveryEngine {
    if (!FieldDiscoveryEngine.instance) {
      FieldDiscoveryEngine.instance = new FieldDiscoveryEngine();
    }
    return FieldDiscoveryEngine.instance;
  }

  /**
   * Discover all available fields from current data sources
   */
  async discoverFields(): Promise<FieldDiscoveryResult> {
    const cacheKey = 'all-fields';
    const cached = this.discoveryCache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.lastUpdated)) {
      return cached;
    }

      const fields: FieldDefinition[] = [];
      const sources = {
      SpecSync: { isAvailable: false, fieldCount: 0, lastChecked: new Date().toISOString() },
      SET: { isAvailable: false, fieldCount: 0, lastChecked: new Date().toISOString() },
      CETv22: { isAvailable: false, fieldCount: 0, lastChecked: new Date().toISOString() },
      BlueDolphin: { isAvailable: false, fieldCount: 0, lastChecked: new Date().toISOString() },
      ADO: { isAvailable: false, fieldCount: 0, lastChecked: new Date().toISOString() },
      BOM: { isAvailable: true, fieldCount: 0, lastChecked: new Date().toISOString() },
      Calculated: { isAvailable: true, fieldCount: 0, lastChecked: new Date().toISOString() }
    };

    try {
      // Discover BOM fields
      const bomFields = this.discoverBOMFields();
      fields.push(...bomFields);
      sources.BOM.fieldCount = bomFields.length;

      // Discover SpecSync fields
      const specSyncFields = await this.discoverSpecSyncFields();
      fields.push(...specSyncFields);
      sources.SpecSync.isAvailable = specSyncFields.length > 0;
      sources.SpecSync.fieldCount = specSyncFields.length;

      // Discover SET fields
      const setFields = await this.discoverSETFields();
      fields.push(...setFields);
      sources.SET.isAvailable = setFields.length > 0;
      sources.SET.fieldCount = setFields.length;

      // Discover CETv22 fields
      const cetv22Fields = await this.discoverCETv22Fields();
      fields.push(...cetv22Fields);
      sources.CETv22.isAvailable = cetv22Fields.length > 0;
      sources.CETv22.fieldCount = cetv22Fields.length;

      // Discover Blue Dolphin fields
      const blueDolphinFields = await this.discoverBlueDolphinFields();
      fields.push(...blueDolphinFields);
      sources.BlueDolphin.isAvailable = blueDolphinFields.length > 0;
      sources.BlueDolphin.fieldCount = blueDolphinFields.length;

      // Discover ADO fields
      const adoFields = await this.discoverADOFields();
      fields.push(...adoFields);
      sources.ADO.isAvailable = adoFields.length > 0;
      sources.ADO.fieldCount = adoFields.length;

      // Discover calculated fields
      const calculatedFields = this.discoverCalculatedFields();
      fields.push(...calculatedFields);
      sources.Calculated.fieldCount = calculatedFields.length;

      // Organize fields into categories
      const organizedCategories = this.organizeFieldsIntoCategories(fields);

      const result: FieldDiscoveryResult = {
        fields,
        categories: organizedCategories,
        lastUpdated: new Date().toISOString(),
        sources
      };

      this.discoveryCache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Field discovery failed:', error);
      throw new Error(`Field discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Discover BOM-specific fields
   */
  private discoverBOMFields(): FieldDefinition[] {
    return [
      {
        id: 'id',
        name: 'id',
        displayName: 'ID',
        type: 'string',
        source: 'BOM',
        category: 'basic-info',
        description: 'Unique identifier for BOM item',
        isAvailable: true,
        isRequired: true
      },
      {
        id: 'tmfDomain',
        name: 'tmfDomain',
        displayName: 'TMF Domain',
        type: 'string',
        source: 'BOM',
        category: 'basic-info',
        description: 'TMF ODA domain classification',
        isAvailable: true,
        isRequired: true
      },
      {
        id: 'capability',
        name: 'capability',
        displayName: 'Capability',
        type: 'string',
        source: 'BOM',
        category: 'basic-info',
        description: 'TMF capability name',
        isAvailable: true
      },
      {
        id: 'requirement',
        name: 'requirement',
        displayName: 'Requirement',
        type: 'string',
        source: 'BOM',
        category: 'basic-info',
        description: 'Requirement description or function name',
        isAvailable: true
      },
      {
        id: 'applicationComponent',
        name: 'applicationComponent',
        displayName: 'Application Component',
        type: 'string',
        source: 'BOM',
        category: 'basic-info',
        description: 'Associated application component',
        isAvailable: true
      },
      {
        id: 'useCase',
        name: 'useCase',
        displayName: 'Use Case',
        type: 'string',
        source: 'BOM',
        category: 'basic-info',
        description: 'Associated use case',
        isAvailable: true
      },
      {
        id: 'cutEffort',
        name: 'cutEffort',
        displayName: 'CUT Effort (Mandays)',
        type: 'number',
        source: 'BOM',
        category: 'basic-info',
        description: 'Code and Unit Test effort in mandays',
        isAvailable: true
      },
      {
        id: 'resourceDomain',
        name: 'resourceDomain',
        displayName: 'Resource Domain',
        type: 'string',
        source: 'BOM',
        category: 'basic-info',
        description: 'Resource domain classification',
        isAvailable: true
      },
      {
        id: 'priority',
        name: 'priority',
        displayName: 'Priority',
        type: 'string',
        source: 'BOM',
        category: 'basic-info',
        description: 'Item priority level',
        isAvailable: true
      },
      {
        id: 'status',
        name: 'status',
        displayName: 'Status',
        type: 'string',
        source: 'BOM',
        category: 'basic-info',
        description: 'Current status of the item',
        isAvailable: true
      },
      {
        id: 'source',
        name: 'source',
        displayName: 'Source',
        type: 'string',
        source: 'BOM',
        category: 'basic-info',
        description: 'Data source (SpecSync, SET, CETv22, Manual)',
        isAvailable: true
      },
      {
        id: 'createdAt',
        name: 'createdAt',
        displayName: 'Created At',
        type: 'date',
        source: 'BOM',
        category: 'basic-info',
        description: 'Creation timestamp',
        isAvailable: true
      },
      {
        id: 'updatedAt',
        name: 'updatedAt',
        displayName: 'Updated At',
        type: 'date',
        source: 'BOM',
        category: 'basic-info',
        description: 'Last update timestamp',
        isAvailable: true
      }
    ];
  }

  /**
   * Discover SpecSync fields from current data
   */
  private async discoverSpecSyncFields(): Promise<FieldDefinition[]> {
    try {
      // Try to get current SpecSync data to discover available fields
      const specSyncData = this.getSpecSyncData();
      if (!specSyncData || !specSyncData.items || specSyncData.items.length === 0) {
        return [];
      }

      const sampleItem = specSyncData.items[0];
      const fields: FieldDefinition[] = [];

      // Map SpecSync item fields
      const specSyncFieldMap = [
        { key: 'requirementId', displayName: 'Requirement ID', type: 'string' as const },
        { key: 'rephrasedRequirementId', displayName: 'Rephrased Requirement ID', type: 'string' as const },
        { key: 'domain', displayName: 'Domain', type: 'string' as const },
        { key: 'vertical', displayName: 'Vertical', type: 'string' as const },
        { key: 'functionName', displayName: 'Function Name', type: 'string' as const },
        { key: 'afLevel2', displayName: 'AF Level 2', type: 'string' as const },
        { key: 'capability', displayName: 'Capability', type: 'string' as const },
        { key: 'referenceCapability', displayName: 'Reference Capability', type: 'string' as const },
        { key: 'usecase1', displayName: 'Use Case 1', type: 'string' as const },
        { key: 'description', displayName: 'Description', type: 'string' as const },
        { key: 'priority', displayName: 'Priority', type: 'string' as const },
        { key: 'status', displayName: 'Status', type: 'string' as const }
      ];

      specSyncFieldMap.forEach(({ key, displayName, type }) => {
        if (key in sampleItem) {
          fields.push({
            id: `specsync_${key}`,
            name: key,
            displayName: `SpecSync ${displayName}`,
            type,
            source: 'SpecSync',
            category: 'specsync',
            description: `SpecSync field: ${displayName}`,
            isAvailable: true,
            sampleValue: sampleItem[key as keyof SpecSyncItem]
          });
        }
      });

      return fields;
    } catch (error) {
      console.warn('Failed to discover SpecSync fields:', error);
      return [];
    }
  }

  /**
   * Discover SET fields from current data
   */
  private async discoverSETFields(): Promise<FieldDefinition[]> {
    try {
      // Try to get current SET data
      const setData = this.getSETData();
      if (!setData) {
        return [];
      }

      const fields: FieldDefinition[] = [
        {
          id: 'set_domainEfforts',
          name: 'domainEfforts',
          displayName: 'SET Domain Efforts',
          type: 'object',
          source: 'SET',
          category: 'set-estimation',
          description: 'Domain effort breakdown from SET data',
          isAvailable: true
        },
        {
          id: 'set_matchedWorkPackages',
          name: 'matchedWorkPackages',
          displayName: 'SET Matched Work Packages',
          type: 'object',
          source: 'SET',
          category: 'set-estimation',
          description: 'Work packages matched from SET data',
          isAvailable: true
        }
      ];

      return fields;
    } catch (error) {
      console.warn('Failed to discover SET fields:', error);
      return [];
    }
  }

  /**
   * Discover CETv22 fields from current data
   */
  private async discoverCETv22Fields(): Promise<FieldDefinition[]> {
    try {
      // Try to get current CETv22 data
      const cetv22Data = this.getCETv22Data();
      if (!cetv22Data) {
        return [];
      }

      const fields: FieldDefinition[] = [
        {
          id: 'cetv22_customerName',
          name: 'customerName',
          displayName: 'CETv22 Customer Name',
          type: 'string',
          source: 'CETv22',
          category: 'cetv22-resources',
          description: 'Customer name from CETv22 analysis',
          isAvailable: true
        },
        {
          id: 'cetv22_projectName',
          name: 'projectName',
          displayName: 'CETv22 Project Name',
          type: 'string',
          source: 'CETv22',
          category: 'cetv22-resources',
          description: 'Project name from CETv22 analysis',
          isAvailable: true
        },
        {
          id: 'cetv22_phases',
          name: 'phases',
          displayName: 'CETv22 Phases',
          type: 'array',
          source: 'CETv22',
          category: 'cetv22-resources',
          description: 'Project phases from CETv22 analysis',
          isAvailable: true
        },
        {
          id: 'cetv22_jobProfiles',
          name: 'jobProfiles',
          displayName: 'CETv22 Job Profiles',
          type: 'array',
          source: 'CETv22',
          category: 'cetv22-resources',
          description: 'Job profiles from CETv22 analysis',
          isAvailable: true
        },
        {
          id: 'cetv22_resourceDemands',
          name: 'resourceDemands',
          displayName: 'CETv22 Resource Demands',
          type: 'object',
          source: 'CETv22',
          category: 'cetv22-resources',
          description: 'Resource demands from CETv22 analysis',
          isAvailable: true
        }
      ];

      return fields;
    } catch (error) {
      console.warn('Failed to discover CETv22 fields:', error);
      return [];
    }
  }

  /**
   * Discover Blue Dolphin fields from current data
   */
  private async discoverBlueDolphinFields(): Promise<FieldDefinition[]> {
    try {
      // Try to get current Blue Dolphin data
      const blueDolphinData = this.getBlueDolphinData();
      if (!blueDolphinData || blueDolphinData.length === 0) {
        return [];
      }

      const sampleObject = blueDolphinData[0];
      const fields: FieldDefinition[] = [];

      // Map common Blue Dolphin fields
      const blueDolphinFieldMap = [
        { key: 'ID', displayName: 'Object ID', type: 'string' as const },
        { key: 'Title', displayName: 'Title', type: 'string' as const },
        { key: 'Definition', displayName: 'Definition', type: 'string' as const },
        { key: 'Status', displayName: 'Status', type: 'string' as const },
        { key: 'Workspace', displayName: 'Workspace', type: 'string' as const },
        { key: 'ArchimateType', displayName: 'ArchiMate Type', type: 'string' as const },
        { key: 'Category', displayName: 'Category', type: 'string' as const },
        { key: 'ObjectLifecycleState', displayName: 'Lifecycle State', type: 'string' as const }
      ];

      blueDolphinFieldMap.forEach(({ key, displayName, type }) => {
        if (key in sampleObject) {
          fields.push({
            id: `bluedolphin_${key.toLowerCase()}`,
            name: key,
            displayName: `Blue Dolphin ${displayName}`,
            type,
            source: 'BlueDolphin',
            category: 'blue-dolphin',
            description: `Blue Dolphin field: ${displayName}`,
            isAvailable: true,
            sampleValue: sampleObject[key as keyof BlueDolphinObjectEnhanced]
          });
        }
      });

      return fields;
    } catch (error) {
      console.warn('Failed to discover Blue Dolphin fields:', error);
      return [];
    }
  }

  /**
   * Discover ADO fields from current data
   */
  private async discoverADOFields(): Promise<FieldDefinition[]> {
    try {
      // ADO fields are typically derived from work items and tags
      const fields: FieldDefinition[] = [
        {
          id: 'ado_workItemId',
          name: 'workItemId',
          displayName: 'ADO Work Item ID',
          type: 'string',
          source: 'ADO',
          category: 'ado-integration',
          description: 'Azure DevOps work item ID',
          isAvailable: true
        },
        {
          id: 'ado_title',
          name: 'title',
          displayName: 'ADO Title',
          type: 'string',
          source: 'ADO',
          category: 'ado-integration',
          description: 'Work item title from ADO',
          isAvailable: true
        },
        {
          id: 'ado_tags',
          name: 'tags',
          displayName: 'ADO Tags',
          type: 'array',
          source: 'ADO',
          category: 'ado-integration',
          description: 'Tags associated with ADO work item',
          isAvailable: true
        },
        {
          id: 'ado_state',
          name: 'state',
          displayName: 'ADO State',
          type: 'string',
          source: 'ADO',
          category: 'ado-integration',
          description: 'Work item state in ADO',
          isAvailable: true
        }
      ];

      return fields;
    } catch (error) {
      console.warn('Failed to discover ADO fields:', error);
      return [];
    }
  }

  /**
   * Discover calculated/derived fields
   */
  private discoverCalculatedFields(): FieldDefinition[] {
    return [
      {
        id: 'complexityMultiplier',
        name: 'complexityMultiplier',
        displayName: 'Complexity Multiplier',
        type: 'number',
        source: 'Calculated',
        category: 'calculated',
        description: 'Calculated complexity multiplier based on selection',
        isAvailable: true,
        isCalculated: true,
        calculationFormula: 'Based on complexity matrix selection'
      },
      {
        id: 'complexityAdjustedEffort',
        name: 'complexityAdjustedEffort',
        displayName: 'Complexity-Adjusted Effort',
        type: 'number',
        source: 'Calculated',
        category: 'calculated',
        description: 'CUT effort adjusted by complexity multiplier',
        isAvailable: true,
        isCalculated: true,
        calculationFormula: 'cutEffort * complexityMultiplier',
        dependencies: ['cutEffort', 'complexityMultiplier']
      },
      {
        id: 'totalServiceCost',
        name: 'totalServiceCost',
        displayName: 'Total Service Cost',
        type: 'number',
        source: 'Calculated',
        category: 'calculated',
        description: 'Total cost of all included service delivery services',
        isAvailable: true,
        isCalculated: true,
        calculationFormula: 'Sum of all included service delivery service costs'
      },
      {
        id: 'includedServices',
        name: 'includedServices',
        displayName: 'Included Services',
        type: 'string',
        source: 'Calculated',
        category: 'calculated',
        description: 'Comma-separated list of included service delivery services',
        isAvailable: true,
        isCalculated: true,
        calculationFormula: 'Join of all included service delivery service names'
      }
    ];
  }

  /**
   * Organize fields into categories
   */
  private organizeFieldsIntoCategories(fields: FieldDefinition[]): FieldCategory[] {
    const categoryMap = new Map<string, FieldDefinition[]>();
    
    // Group fields by category
    fields.forEach(field => {
      if (!categoryMap.has(field.category)) {
        categoryMap.set(field.category, []);
      }
      categoryMap.get(field.category)!.push(field);
    });

    // Create category objects
    return FIELD_CATEGORIES.map(categoryTemplate => ({
      ...categoryTemplate,
      fields: categoryMap.get(categoryTemplate.id) || [],
      isExpanded: categoryTemplate.id === 'basic-info' // Expand basic info by default
    }));
  }

  /**
   * Get current SpecSync data
   */
  private getSpecSyncData(): any {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem('specsync-data');
        return data ? JSON.parse(data) : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get current SET data
   */
  private getSETData(): any {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem('set-data');
        return data ? JSON.parse(data) : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get current CETv22 data
   */
  private getCETv22Data(): any {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem('cetv22-data');
        return data ? JSON.parse(data) : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get current Blue Dolphin data
   */
  private getBlueDolphinData(): any[] {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem('blue-dolphin-objects');
        return data ? JSON.parse(data) : [];
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(lastUpdated: string): boolean {
    const lastUpdateTime = new Date(lastUpdated).getTime();
    const now = Date.now();
    return (now - lastUpdateTime) < this.cacheTimeout;
  }

  /**
   * Clear discovery cache
   */
  clearCache(): void {
    this.discoveryCache.clear();
  }

  /**
   * Force refresh of field discovery
   */
  async refreshFields(): Promise<FieldDiscoveryResult> {
    this.clearCache();
    return this.discoverFields();
  }
}

// Export singleton instance
export const fieldDiscovery = FieldDiscoveryEngine.getInstance();
