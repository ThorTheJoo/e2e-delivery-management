import { BOMConfiguration, BOMExportTemplate, BUILT_IN_TEMPLATES } from '@/types/bom-config';

/**
 * BOM Configuration Storage Manager
 * Handles persistence of BOM configurations and templates
 */
export class BOMConfigStorage {
  private static instance: BOMConfigStorage;
  private readonly STORAGE_KEY = 'bom-configurations';
  private readonly TEMPLATES_KEY = 'bom-export-templates';
  private readonly ACTIVE_CONFIG_KEY = 'bom-active-configuration';

  static getInstance(): BOMConfigStorage {
    if (!BOMConfigStorage.instance) {
      BOMConfigStorage.instance = new BOMConfigStorage();
    }
    return BOMConfigStorage.instance;
  }

  /**
   * Save BOM configuration
   */
  saveConfiguration(config: BOMConfiguration): void {
    try {
      const configurations = this.getAllConfigurations();
      const existingIndex = configurations.findIndex(c => c.id === config.id);
      
      if (existingIndex >= 0) {
        configurations[existingIndex] = {
          ...config,
          updatedAt: new Date().toISOString()
        };
      } else {
        configurations.push(config);
      }

      this.saveToStorage(this.STORAGE_KEY, configurations);
    } catch (error) {
      console.error('Failed to save BOM configuration:', error);
      throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all saved configurations
   */
  getAllConfigurations(): BOMConfiguration[] {
    try {
      const stored = this.getFromStorage(this.STORAGE_KEY);
      return stored || [];
    } catch (error) {
      console.error('Failed to load BOM configurations:', error);
      return [];
    }
  }

  /**
   * Get configuration by ID
   */
  getConfiguration(id: string): BOMConfiguration | null {
    const configurations = this.getAllConfigurations();
    return configurations.find(c => c.id === id) || null;
  }

  /**
   * Get default configuration
   */
  getDefaultConfiguration(): BOMConfiguration | null {
    const configurations = this.getAllConfigurations();
    return configurations.find(c => c.isDefault) || configurations[0] || null;
  }

  /**
   * Delete configuration
   */
  deleteConfiguration(id: string): boolean {
    try {
      const configurations = this.getAllConfigurations();
      const filtered = configurations.filter(c => c.id !== id);
      
      if (filtered.length === configurations.length) {
        return false; // Configuration not found
      }

      this.saveToStorage(this.STORAGE_KEY, filtered);
      
      // Clear active configuration if it was deleted
      const activeConfig = this.getActiveConfiguration();
      if (activeConfig && activeConfig.id === id) {
        this.clearActiveConfiguration();
      }

      return true;
    } catch (error) {
      console.error('Failed to delete BOM configuration:', error);
      return false;
    }
  }

  /**
   * Set active configuration
   */
  setActiveConfiguration(configId: string): void {
    try {
      const config = this.getConfiguration(configId);
      if (config) {
        this.saveToStorage(this.ACTIVE_CONFIG_KEY, configId);
      }
    } catch (error) {
      console.error('Failed to set active configuration:', error);
    }
  }

  /**
   * Get active configuration
   */
  getActiveConfiguration(): BOMConfiguration | null {
    try {
      const activeId = this.getFromStorage(this.ACTIVE_CONFIG_KEY);
      if (activeId) {
        return this.getConfiguration(activeId);
      }
      return this.getDefaultConfiguration();
    } catch (error) {
      console.error('Failed to get active configuration:', error);
      return this.getDefaultConfiguration();
    }
  }

  /**
   * Clear active configuration
   */
  clearActiveConfiguration(): void {
    try {
      this.removeFromStorage(this.ACTIVE_CONFIG_KEY);
    } catch (error) {
      console.error('Failed to clear active configuration:', error);
    }
  }

  /**
   * Set configuration as default
   */
  setDefaultConfiguration(configId: string): void {
    try {
      const configurations = this.getAllConfigurations();
      const updated = configurations.map(config => ({
        ...config,
        isDefault: config.id === configId
      }));

      this.saveToStorage(this.STORAGE_KEY, updated);
    } catch (error) {
      console.error('Failed to set default configuration:', error);
    }
  }

  /**
   * Create default configuration if none exists
   */
  createDefaultConfiguration(): BOMConfiguration {
    const defaultConfig: BOMConfiguration = {
      id: 'default-config',
      name: 'Default Configuration',
      description: 'Default BOM export configuration with essential fields',
      selectedFields: [
        'id', 'tmfDomain', 'capability', 'requirement', 'applicationComponent',
        'useCase', 'cutEffort', 'priority', 'status', 'source', 'totalServiceCost'
      ],
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0'
    };

    this.saveConfiguration(defaultConfig);
    return defaultConfig;
  }

  /**
   * Get all export templates (built-in + custom)
   */
  getAllTemplates(): BOMExportTemplate[] {
    try {
      const customTemplates = this.getFromStorage(this.TEMPLATES_KEY) || [];
      return [...BUILT_IN_TEMPLATES, ...customTemplates];
    } catch (error) {
      console.error('Failed to load export templates:', error);
      return BUILT_IN_TEMPLATES;
    }
  }

  /**
   * Save custom export template
   */
  saveTemplate(template: BOMExportTemplate): void {
    try {
      const templates = this.getCustomTemplates();
      const existingIndex = templates.findIndex(t => t.id === template.id);
      
      if (existingIndex >= 0) {
        templates[existingIndex] = template;
      } else {
        templates.push(template);
      }

      this.saveToStorage(this.TEMPLATES_KEY, templates);
    } catch (error) {
      console.error('Failed to save export template:', error);
      throw new Error(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get custom export templates
   */
  getCustomTemplates(): BOMExportTemplate[] {
    try {
      return this.getFromStorage(this.TEMPLATES_KEY) || [];
    } catch (error) {
      console.error('Failed to load custom templates:', error);
      return [];
    }
  }

  /**
   * Delete custom export template
   */
  deleteTemplate(templateId: string): boolean {
    try {
      const templates = this.getCustomTemplates();
      const filtered = templates.filter(t => t.id !== templateId);
      
      if (filtered.length === templates.length) {
        return false; // Template not found
      }

      this.saveToStorage(this.TEMPLATES_KEY, filtered);
      return true;
    } catch (error) {
      console.error('Failed to delete export template:', error);
      return false;
    }
  }

  /**
   * Export configurations to JSON
   */
  exportConfigurations(): string {
    try {
      const data = {
        configurations: this.getAllConfigurations(),
        templates: this.getCustomTemplates(),
        activeConfiguration: this.getFromStorage(this.ACTIVE_CONFIG_KEY),
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export configurations:', error);
      throw new Error(`Failed to export configurations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import configurations from JSON
   */
  importConfigurations(jsonData: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.configurations || !Array.isArray(data.configurations)) {
        throw new Error('Invalid configuration format');
      }

      // Validate configurations
      for (const config of data.configurations) {
        if (!config.id || !config.name || !Array.isArray(config.selectedFields)) {
          throw new Error('Invalid configuration structure');
        }
      }

      // Save configurations
      this.saveToStorage(this.STORAGE_KEY, data.configurations);

      // Save custom templates if present
      if (data.templates && Array.isArray(data.templates)) {
        this.saveToStorage(this.TEMPLATES_KEY, data.templates);
      }

      // Set active configuration if present
      if (data.activeConfiguration) {
        this.setActiveConfiguration(data.activeConfiguration);
      }

      return {
        success: true,
        message: `Successfully imported ${data.configurations.length} configurations`
      };
    } catch (error) {
      console.error('Failed to import configurations:', error);
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Clear all configurations and templates
   */
  clearAll(): void {
    try {
      this.removeFromStorage(this.STORAGE_KEY);
      this.removeFromStorage(this.TEMPLATES_KEY);
      this.removeFromStorage(this.ACTIVE_CONFIG_KEY);
    } catch (error) {
      console.error('Failed to clear all configurations:', error);
    }
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): {
    configurationCount: number;
    templateCount: number;
    customTemplateCount: number;
    hasActiveConfiguration: boolean;
    lastUpdated: string | null;
  } {
    try {
      const configurations = this.getAllConfigurations();
      const templates = this.getAllTemplates();
      const customTemplates = this.getCustomTemplates();
      const activeConfig = this.getActiveConfiguration();

      return {
        configurationCount: configurations.length,
        templateCount: templates.length,
        customTemplateCount: customTemplates.length,
        hasActiveConfiguration: !!activeConfig,
        lastUpdated: configurations.length > 0 
          ? Math.max(...configurations.map(c => new Date(c.updatedAt).getTime()))
            .toString()
          : null
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        configurationCount: 0,
        templateCount: BUILT_IN_TEMPLATES.length,
        customTemplateCount: 0,
        hasActiveConfiguration: false,
        lastUpdated: null
      };
    }
  }

  /**
   * Generic storage methods
   */
  private saveToStorage(key: string, data: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  private getFromStorage(key: string): any {
    if (typeof window !== 'undefined') {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
    return null;
  }

  private removeFromStorage(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
}

// Export singleton instance
export const bomConfigStorage = BOMConfigStorage.getInstance();

