import { FieldDefinition, BOMConfiguration } from '@/types/bom-config';
import { BOMItem } from '@/types';
import { fieldDiscovery } from './field-discovery';

/**
 * Dynamic BOM Export Generator
 * Generates CSV exports based on selected field configuration
 */
export class BOMExportGenerator {
  private static instance: BOMExportGenerator;
  private fieldDefinitions: FieldDefinition[] = [];

  static getInstance(): BOMExportGenerator {
    if (!BOMExportGenerator.instance) {
      BOMExportGenerator.instance = new BOMExportGenerator();
    }
    return BOMExportGenerator.instance;
  }

  /**
   * Initialize field definitions
   */
  async initialize(): Promise<void> {
    try {
      const discoveryResult = await fieldDiscovery.discoverFields();
      this.fieldDefinitions = discoveryResult.fields;
    } catch (error) {
      console.error('Failed to initialize field definitions:', error);
      throw error;
    }
  }

  /**
   * Get selected field configuration
   */
  private getSelectedFieldConfiguration(): string[] {
    try {
      if (typeof window !== 'undefined') {
        // Try to get active configuration
        const configurations = localStorage.getItem('bom-configurations');
        if (configurations) {
          const configs: BOMConfiguration[] = JSON.parse(configurations);
          const activeConfig = configs.find(c => c.isDefault) || configs[0];
          if (activeConfig) {
            return activeConfig.selectedFields;
          }
        }

        // Fallback to default fields if no configuration found
        return this.getDefaultFieldIds();
      }
      return this.getDefaultFieldIds();
    } catch (error) {
      console.warn('Failed to load field configuration, using defaults:', error);
      return this.getDefaultFieldIds();
    }
  }

  /**
   * Get default field IDs for backward compatibility
   */
  private getDefaultFieldIds(): string[] {
    return [
      'id', 'tmfDomain', 'capability', 'requirement', 'applicationComponent', 
      'useCase', 'cutEffort', 'priority', 'status', 'source', 'totalServiceCost'
    ];
  }

  /**
   * Generate CSV headers based on selected fields
   */
  generateHeaders(selectedFieldIds?: string[]): string[] {
    const fieldIds = selectedFieldIds || this.getSelectedFieldConfiguration();
    const headers: string[] = [];

    fieldIds.forEach(fieldId => {
      const field = this.fieldDefinitions.find(f => f.id === fieldId);
      if (field) {
        headers.push(field.displayName);
      } else {
        // Fallback for fields not found in definitions
        headers.push(this.getFallbackHeaderName(fieldId));
      }
    });

    return headers;
  }

  /**
   * Get fallback header name for unknown fields
   */
  private getFallbackHeaderName(fieldId: string): string {
    const fallbackMap: Record<string, string> = {
      'id': 'ID',
      'tmfDomain': 'TMF Domain',
      'capability': 'Capability',
      'requirement': 'Requirement',
      'applicationComponent': 'Application Component',
      'useCase': 'Use Case',
      'cutEffort': 'CUT Effort (Mandays)',
      'complexityMultiplier': 'Complexity Multiplier',
      'complexityAdjustedEffort': 'Complexity-Adjusted Effort (Mandays)',
      'priority': 'Priority',
      'status': 'Status',
      'source': 'Source',
      'totalServiceCost': 'Total Service Cost',
      'includedServices': 'Included Services',
      'createdAt': 'Created At',
      'updatedAt': 'Updated At'
    };

    return fallbackMap[fieldId] || fieldId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  /**
   * Generate CSV row data for a BOM item
   */
  generateRowData(item: BOMItem, selectedFieldIds?: string[]): string[] {
    const fieldIds = selectedFieldIds || this.getSelectedFieldConfiguration();
    const rowData: string[] = [];

    fieldIds.forEach(fieldId => {
      const value = this.extractFieldValue(item, fieldId);
      rowData.push(this.formatValueForCSV(value));
    });

    return rowData;
  }

  /**
   * Extract field value from BOM item
   */
  private extractFieldValue(item: BOMItem, fieldId: string): any {
    // Handle basic BOM fields
    if (fieldId in item) {
      return item[fieldId as keyof BOMItem];
    }

    // Handle calculated fields
    switch (fieldId) {
      case 'complexityMultiplier':
        return this.getComplexityMultiplier();
      
      case 'complexityAdjustedEffort':
        return this.calculateComplexityAdjustedEffort(item);
      
      case 'totalServiceCost':
        return this.calculateTotalServiceCost(item);
      
      case 'includedServices':
        return this.getIncludedServices(item);
      
      // Handle SpecSync fields
      case 'specsync_requirementId':
        return this.getSpecSyncField(item, 'requirementId');
      
      case 'specsync_domain':
        return this.getSpecSyncField(item, 'domain');
      
      case 'specsync_functionName':
        return this.getSpecSyncField(item, 'functionName');
      
      case 'specsync_capability':
        return this.getSpecSyncField(item, 'capability');
      
      case 'specsync_usecase1':
        return this.getSpecSyncField(item, 'usecase1');
      
      // Handle resource breakdown fields
      case 'businessAnalyst':
        return item.resourceBreakdown?.businessAnalyst || 0;
      
      case 'solutionArchitect':
        return item.resourceBreakdown?.solutionArchitect || 0;
      
      case 'developer':
        return item.resourceBreakdown?.developer || 0;
      
      case 'qaEngineer':
        return item.resourceBreakdown?.qaEngineer || 0;
      
      case 'projectManager':
        return item.resourceBreakdown?.projectManager || 0;
      
      case 'totalEffort':
        return item.resourceBreakdown?.totalEffort || 0;
      
      default:
        return '';
    }
  }

  /**
   * Get complexity multiplier from localStorage
   */
  private getComplexityMultiplier(): number {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('complexity-selection');
        if (raw) {
          const ignored = JSON.parse(raw);
          void ignored;
          // Calculate multiplier based on complexity selection
          // This is a simplified version - you might want to implement the full complexity calculation
          return 1.0; // Placeholder
        }
      }
    } catch (error) {
      console.warn('Failed to get complexity multiplier:', error);
    }
    return 1.0;
  }

  /**
   * Calculate complexity-adjusted effort
   */
  private calculateComplexityAdjustedEffort(item: BOMItem): number {
    const baseEffort = item.cutEffort || 0;
    const multiplier = this.getComplexityMultiplier();
    return baseEffort * multiplier;
  }

  /**
   * Calculate total service cost
   */
  private calculateTotalServiceCost(item: BOMItem): number {
    if (!item.serviceDeliveryServices) return 0;
    
    return item.serviceDeliveryServices
      .filter(service => service.isIncluded)
      .reduce((total, service) => total + service.cost, 0);
  }

  /**
   * Get included services as comma-separated string
   */
  private getIncludedServices(item: BOMItem): string {
    if (!item.serviceDeliveryServices) return '';
    
    return item.serviceDeliveryServices
      .filter(service => service.isIncluded)
      .map(service => service.name)
      .join(', ');
  }

  /**
   * Get SpecSync field value (placeholder - would need actual SpecSync data)
   */
  private getSpecSyncField(_item: BOMItem, _fieldName: string): string {
    // This would need to be connected to actual SpecSync data
    // For now, return empty string
    return '';
  }

  /**
   * Format value for CSV export
   */
  private formatValueForCSV(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (Array.isArray(value)) {
      return value.join('; ');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Generate complete CSV content
   */
  generateCSVContent(items: BOMItem[], selectedFieldIds?: string[]): string {
    const headers = this.generateHeaders(selectedFieldIds);
    const rows = items.map(item => this.generateRowData(item, selectedFieldIds));
    
    const csvLines = [headers.join(','), ...rows.map(row => row.join(','))];
    return csvLines.join('\n');
  }

  /**
   * Download CSV file
   */
  downloadCSV(items: BOMItem[], filename: string = 'bom-export.csv', selectedFieldIds?: string[]): void {
    const csvContent = this.generateCSVContent(items, selectedFieldIds);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Get field definitions for a specific source
   */
  getFieldsBySource(source: string): FieldDefinition[] {
    return this.fieldDefinitions.filter(field => field.source === source);
  }

  /**
   * Get all available field definitions
   */
  getAllFields(): FieldDefinition[] {
    return this.fieldDefinitions;
  }

  /**
   * Validate field selection
   */
  validateFieldSelection(fieldIds: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const availableFieldIds = this.fieldDefinitions.map(f => f.id);

    fieldIds.forEach(fieldId => {
      if (!availableFieldIds.includes(fieldId)) {
        errors.push(`Field '${fieldId}' is not available`);
      }
    });

    // Check for required fields
    const requiredFields = this.fieldDefinitions.filter(f => f.isRequired);
    requiredFields.forEach(field => {
      if (!fieldIds.includes(field.id)) {
        errors.push(`Required field '${field.displayName}' is missing`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const bomExportGenerator = BOMExportGenerator.getInstance();
