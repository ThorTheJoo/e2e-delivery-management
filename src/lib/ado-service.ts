import { 
  ADOConfiguration, 
  ADOWorkItem, 
  ADOWorkItemMapping, 
  ADOValidationResult, 
  ADOExportStatus,
  ADOPreviewData,
  ADOApiResponse,
  ADOWorkItemResponse,
  ADOProject,
  ADOWorkItemTypeName,
  ADOAreaPath,
  ADOIterationPath,
  ADOAuthStatus,
  ADOIntegrationLogEntry,
  ADONotification
} from '@/types/ado';
import { Project, TMFOdaDomain, SpecSyncItem } from '@/types';

// ADO Service Class
export class ADOService {
  private configuration: ADOConfiguration | null = null;
  private authStatus: ADOAuthStatus | null = null;
  private logs: ADOIntegrationLogEntry[] = [];
  private notifications: ADONotification[] = [];

  constructor() {
    this.loadConfiguration();
    this.log('info', 'ADO Service initialized');
  }

  // Configuration Management
  async loadConfiguration(): Promise<ADOConfiguration | null> {
    try {
      const savedConfig = localStorage.getItem('ado-configuration');
      if (savedConfig) {
        this.configuration = JSON.parse(savedConfig);
        this.log('info', 'Configuration loaded from storage');
        return this.configuration;
      }
    } catch (error) {
      this.log('error', 'Failed to load configuration', error);
    }
    return null;
  }

  async saveConfiguration(config: ADOConfiguration): Promise<void> {
    try {
      this.configuration = config;
      localStorage.setItem('ado-configuration', JSON.stringify(config));
      this.log('info', 'Configuration saved successfully');
      
      // Test connection if authentication is provided
      if (config.authentication.token) {
        await this.testConnection();
      }
    } catch (error) {
      this.log('error', 'Failed to save configuration', error);
      throw error;
    }
  }

  getConfiguration(): ADOConfiguration | null {
    return this.configuration;
  }

  // Authentication and Connection Testing
  async testConnection(): Promise<boolean> {
    if (!this.configuration) {
      this.log('error', 'No configuration available for connection test');
      return false;
    }

    try {
      this.log('info', 'Testing ADO connection...');
      
      const response = await this.makeApiCall('/_apis/projects?api-version=7.1');
      
      if (response.ok) {
        const data: ADOApiResponse<ADOProject> = await response.json();
        const project = data.value.find(p => p.name === this.configuration!.project);
        
        if (project) {
          this.authStatus = {
            isAuthenticated: true,
            organization: this.configuration.organization,
            project: this.configuration.project,
            user: 'Authenticated User', // Would get from API in real implementation
            permissions: ['Read', 'Write'], // Would get from API in real implementation
            lastChecked: new Date().toISOString()
          };
          
          this.log('info', 'ADO connection test successful');
          this.addNotification('success', 'Connection Successful', 'Successfully connected to Azure DevOps');
          return true;
        } else {
          this.log('error', `Project '${this.configuration.project}' not found`);
          this.addNotification('error', 'Connection Failed', `Project '${this.configuration.project}' not found`);
          return false;
        }
      } else {
        this.log('error', 'ADO connection test failed', { status: response.status, statusText: response.statusText });
        this.addNotification('error', 'Connection Failed', 'Failed to connect to Azure DevOps');
        return false;
      }
    } catch (error) {
      this.log('error', 'ADO connection test failed', error);
      this.addNotification('error', 'Connection Failed', 'Failed to connect to Azure DevOps');
      return false;
    }
  }

  getAuthStatus(): ADOAuthStatus | null {
    return this.authStatus;
  }

  // Work Item Generation
  generateWorkItemMappings(
    project: Project,
    domains: TMFOdaDomain[],
    specSyncItems: SpecSyncItem[]
  ): ADOWorkItemMapping[] {
    this.log('info', 'Generating work item mappings', { 
      projectId: project.id, 
      domainCount: domains.length, 
      requirementCount: specSyncItems.length 
    });

    const mappings: ADOWorkItemMapping[] = [];

    try {
      // 1. Generate Epic from Project
      const epicMapping = this.generateEpicFromProject(project, domains);
      mappings.push(epicMapping);

      // 2. Generate Features from TMF Domains
      domains.forEach(domain => {
        const featureMapping = this.generateFeatureFromDomain(domain);
        mappings.push(featureMapping);
      });

      // 3. Generate User Stories from TMF Capabilities
      domains.forEach(domain => {
        domain.capabilities.forEach(capability => {
          const userStoryMapping = this.generateUserStoryFromCapability(capability, domain);
          mappings.push(userStoryMapping);
        });
      });

      // 4. Generate Tasks from SpecSync Requirements
      specSyncItems.forEach(item => {
        const taskMapping = this.generateTaskFromSpecSyncItem(item, domains);
        if (taskMapping) {
          mappings.push(taskMapping);
        }
      });

      this.log('info', 'Work item mappings generated successfully', { 
        totalMappings: mappings.length,
        breakdown: {
          epics: mappings.filter(m => m.targetType === 'epic').length,
          features: mappings.filter(m => m.targetType === 'feature').length,
          userStories: mappings.filter(m => m.targetType === 'userstory').length,
          tasks: mappings.filter(m => m.targetType === 'task').length
        }
      });

    } catch (error) {
      this.log('error', 'Failed to generate work item mappings', error);
    }

    return mappings;
  }

  private generateEpicFromProject(project: Project, domains: TMFOdaDomain[]): ADOWorkItemMapping {
    return {
      sourceType: 'project',
      sourceId: project.id,
      sourceName: project.name,
      targetType: 'epic',
      targetTitle: `${project.name} - BSS Transformation`,
      targetDescription: `End-to-end BSS transformation for ${project.customer} covering ${domains.length} TMF domains`,
      targetFields: {
        'System.Title': `${project.name} - BSS Transformation`,
        'System.Description': `Comprehensive BSS transformation initiative for ${project.customer} covering ${domains.length} TMF domains`,
        'Microsoft.VSTS.Common.BusinessValue': 1000,
        'Microsoft.VSTS.Common.Risk': 'Medium',
        'System.AreaPath': this.configuration?.areaPath || 'Project',
        'System.IterationPath': this.configuration?.iterationPath || 'Current',
        'System.Tags': `BSS-Transformation;Epic;${project.customer};TMF-ODA`,
        'Custom.ProjectId': project.id,
        'Custom.Customer': project.customer,
        'Custom.Duration': project.duration,
        'Custom.TeamSize': project.teamSize
      },
      relationships: [],
      estimatedEffort: this.calculateTotalEffort(domains),
      storyPoints: 0,
      priority: 'High',
      tags: ['BSS-Transformation', 'Epic', project.customer, 'TMF-ODA']
    };
  }

  private generateFeatureFromDomain(domain: TMFOdaDomain): ADOWorkItemMapping {
    return {
      sourceType: 'domain',
      sourceId: domain.id,
      sourceName: domain.name,
      targetType: 'feature',
      targetTitle: domain.name,
      targetDescription: domain.description,
      targetFields: {
        'System.Title': domain.name,
        'System.Description': domain.description,
        'Microsoft.VSTS.Common.BusinessValue': 800,
        'Microsoft.VSTS.Common.AcceptanceCriteria': `${domain.name} domain capabilities fully implemented and integrated`,
        'System.AreaPath': this.configuration?.areaPath || 'Project',
        'System.IterationPath': this.configuration?.iterationPath || 'Current',
        'System.Tags': `TMF-Domain;${domain.name};Feature`,
        'Custom.DomainId': domain.id,
        'Custom.CapabilityCount': domain.capabilities.length,
        'Custom.TMFLevel': 'Domain'
      },
      relationships: [`Epic:${domain.name}`],
      estimatedEffort: this.calculateDomainEffort(domain),
      storyPoints: this.calculateStoryPoints(domain.capabilities.length),
      priority: 'High',
      tags: ['TMF-Domain', domain.name, 'Feature']
    };
  }

  private generateUserStoryFromCapability(capability: any, domain: TMFOdaDomain): ADOWorkItemMapping {
    return {
      sourceType: 'capability',
      sourceId: capability.id,
      sourceName: capability.name,
      targetType: 'userstory',
      targetTitle: capability.name,
      targetDescription: capability.description,
      targetFields: {
        'System.Title': capability.name,
        'System.Description': capability.description,
        'Microsoft.VSTS.Common.StoryPoints': this.calculateStoryPoints(1),
        'Microsoft.VSTS.Common.AcceptanceCriteria': `${capability.name} capability delivered and tested according to TMF specifications`,
        'System.AreaPath': this.configuration?.areaPath || 'Project',
        'System.IterationPath': this.configuration?.iterationPath || 'Current',
        'System.Tags': `TMF-Capability;${capability.name};UserStory`,
        'Custom.CapabilityId': capability.id,
        'Custom.DomainId': domain.id,
        'Custom.TMFLevel': 'Capability'
      },
      relationships: [`Feature:${domain.name}`],
      estimatedEffort: this.calculateCapabilityEffort(capability),
      storyPoints: this.calculateStoryPoints(1),
      priority: 'Medium',
      tags: ['TMF-Capability', capability.name, 'UserStory']
    };
  }

  private generateTaskFromSpecSyncItem(item: SpecSyncItem, domains: TMFOdaDomain[]): ADOWorkItemMapping | null {
    // Find matching capability based on function name or capability field
    const matchingCapability = this.findMatchingCapability(item, domains);
    if (!matchingCapability) {
      this.log('warning', 'No matching capability found for SpecSync item', { itemId: item.id, functionName: item.functionName });
      return null;
    }

    return {
      sourceType: 'requirement',
      sourceId: item.id,
      sourceName: item.rephrasedRequirementId,
      targetType: 'task',
      targetTitle: `${item.rephrasedRequirementId} - ${item.functionName}`,
      targetDescription: item.usecase1 || item.description || `Implement ${item.functionName} functionality`,
      targetFields: {
        'System.Title': `${item.rephrasedRequirementId} - ${item.functionName}`,
        'System.Description': item.usecase1 || item.description || `Implement ${item.functionName} functionality`,
        'Microsoft.VSTS.Scheduling.RemainingWork': this.calculateRemainingWork(item),
        'Microsoft.VSTS.Scheduling.Activity': this.determineActivity(item),
        'System.AreaPath': this.configuration?.areaPath || 'Project',
        'System.IterationPath': this.configuration?.iterationPath || 'Current',
        'System.Tags': `SpecSync;${item.domain};${item.functionName};Task`,
        'Custom.RequirementId': item.requirementId,
        'Custom.RephrasedRequirementId': item.rephrasedRequirementId,
        'Custom.Domain': item.domain,
        'Custom.FunctionName': item.functionName,
        'Custom.Capability': item.capability,
        'Custom.Usecase': item.usecase1,
        'Custom.Priority': item.priority || 'Medium',
        'Custom.Status': item.status || 'New'
      },
      relationships: [`UserStory:${matchingCapability.name}`],
      estimatedEffort: this.calculateTaskEffort(item),
      storyPoints: 0,
      priority: item.priority || 'Medium',
      tags: ['SpecSync', item.domain, item.functionName, 'Task']
    };
  }

  // Helper Methods
  private calculateTotalEffort(domains: TMFOdaDomain[]): number {
    return domains.reduce((total, domain) => total + this.calculateDomainEffort(domain), 0);
  }

  private calculateDomainEffort(domain: TMFOdaDomain): number {
    return domain.capabilities.reduce((total, capability) => total + this.calculateCapabilityEffort(capability), 0);
  }

  private calculateCapabilityEffort(capability: any): number {
    // Default effort calculation - can be enhanced with actual effort data
    return 5; // 5 days per capability
  }

  private calculateTaskEffort(item: SpecSyncItem): number {
    // Default effort calculation based on priority
    const effortMap: Record<string, number> = {
      'High': 3,
      'Medium': 2,
      'Low': 1
    };
    return effortMap[item.priority || 'Medium'] || 2;
  }

  private calculateStoryPoints(count: number): number {
    // Simple story point calculation
    return Math.max(1, Math.floor(count * 3));
  }

  private calculateRemainingWork(item: SpecSyncItem): number {
    return this.calculateTaskEffort(item);
  }

  private determineActivity(item: SpecSyncItem): string {
    // Determine activity based on function name or domain
    if (item.functionName.toLowerCase().includes('test')) return 'Testing';
    if (item.functionName.toLowerCase().includes('design')) return 'Design';
    if (item.functionName.toLowerCase().includes('deploy')) return 'Deployment';
    return 'Development';
  }

  private findMatchingCapability(item: SpecSyncItem, domains: TMFOdaDomain[]): any | null {
    // Find capability by name match or domain match
    for (const domain of domains) {
      for (const capability of domain.capabilities) {
        if (capability.name.toLowerCase().includes(item.functionName.toLowerCase()) ||
            item.capability.toLowerCase().includes(capability.name.toLowerCase())) {
          return capability;
        }
      }
    }
    return null;
  }

  // Validation
  validateWorkItemMappings(mappings: ADOWorkItemMapping[]): ADOValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];

    this.log('info', 'Validating work item mappings', { totalMappings: mappings.length });

    try {
      // Check for required fields
      mappings.forEach((mapping, index) => {
        if (!mapping.targetTitle || mapping.targetTitle.trim() === '') {
          errors.push(`Mapping ${index + 1}: Missing title`);
        }
        if (!mapping.targetDescription || mapping.targetDescription.trim() === '') {
          warnings.push(`Mapping ${index + 1}: Missing description`);
        }
        if (mapping.targetFields['System.Title'] && mapping.targetFields['System.Title'].length > 255) {
          errors.push(`Mapping ${index + 1}: Title too long (max 255 characters)`);
        }
      });

      // Check for duplicate titles
      const titles = mappings.map(m => m.targetTitle);
      const duplicateTitles = titles.filter((title, index) => titles.indexOf(title) !== index);
      if (duplicateTitles.length > 0) {
        warnings.push(`Duplicate titles found: ${duplicateTitles.join(', ')}`);
      }

      // Check configuration
      if (!this.configuration) {
        errors.push('ADO configuration not found');
      } else {
        if (!this.configuration.organization) errors.push('Organization not configured');
        if (!this.configuration.project) errors.push('Project not configured');
        if (!this.configuration.authentication.token) warnings.push('Authentication token not configured');
      }

      // Summary info
      const breakdown = {
        epics: mappings.filter(m => m.targetType === 'epic').length,
        features: mappings.filter(m => m.targetType === 'feature').length,
        userStories: mappings.filter(m => m.targetType === 'userstory').length,
        tasks: mappings.filter(m => m.targetType === 'task').length
      };

      info.push(`Total items: ${mappings.length} (Epics: ${breakdown.epics}, Features: ${breakdown.features}, User Stories: ${breakdown.userStories}, Tasks: ${breakdown.tasks})`);

      this.log('info', 'Validation completed', { 
        errors: errors.length, 
        warnings: warnings.length, 
        info: info.length 
      });

    } catch (error) {
      this.log('error', 'Validation failed', error);
      errors.push('Validation process failed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info
    };
  }

  // Preview Generation
  generatePreview(mappings: ADOWorkItemMapping[]): ADOPreviewData {
    this.log('info', 'Generating preview data', { totalMappings: mappings.length });

    const epics = mappings.filter(m => m.targetType === 'epic');
    const features = mappings.filter(m => m.targetType === 'feature');
    const userStories = mappings.filter(m => m.targetType === 'userstory');
    const tasks = mappings.filter(m => m.targetType === 'task');

    const totalEffort = mappings.reduce((sum, m) => sum + (m.estimatedEffort || 0), 0);
    const totalStoryPoints = mappings.reduce((sum, m) => sum + (m.storyPoints || 0), 0);

    const breakdown = {
      epics: epics.length,
      features: features.length,
      userStories: userStories.length,
      tasks: tasks.length
    };

    return {
      epics,
      features,
      userStories,
      tasks,
      summary: {
        totalItems: mappings.length,
        totalEffort,
        totalStoryPoints,
        breakdown
      }
    };
  }

  // Export Functions
  async exportToJSON(mappings: ADOWorkItemMapping[]): Promise<string> {
    this.log('info', 'Exporting to JSON', { totalMappings: mappings.length });

    const exportData = {
      exportDate: new Date().toISOString(),
      configuration: this.configuration,
      workItems: mappings,
      summary: this.generatePreview(mappings).summary
    };

    return JSON.stringify(exportData, null, 2);
  }

  async exportToADO(mappings: ADOWorkItemMapping[]): Promise<ADOExportStatus> {
    if (!this.configuration || !this.authStatus?.isAuthenticated) {
      throw new Error('ADO not configured or not authenticated');
    }

    this.log('info', 'Starting ADO export', { totalMappings: mappings.length });

    const exportStatus: ADOExportStatus = {
      status: 'preparing',
      progress: 0,
      totalItems: mappings.length,
      processedItems: 0,
      errors: [],
      exportedItems: []
    };

    try {
      exportStatus.status = 'exporting';

      for (let i = 0; i < mappings.length; i++) {
        const mapping = mappings[i];
        
        try {
          const workItem = await this.createWorkItem(mapping);
          exportStatus.exportedItems.push(workItem);
          exportStatus.processedItems++;
          
          this.log('info', 'Work item created successfully', { 
            workItemId: workItem.id, 
            title: mapping.targetTitle 
          });
        } catch (error) {
          const errorMessage = `Failed to create work item: ${mapping.targetTitle}`;
          exportStatus.errors.push(errorMessage);
          this.log('error', errorMessage, error);
        }

        exportStatus.progress = Math.round(((i + 1) / mappings.length) * 100);
      }

      exportStatus.status = exportStatus.errors.length === 0 ? 'completed' : 'failed';
      
      this.log('info', 'ADO export completed', { 
        status: exportStatus.status,
        processed: exportStatus.processedItems,
        errors: exportStatus.errors.length
      });

    } catch (error) {
      exportStatus.status = 'failed';
      exportStatus.errors.push('Export process failed');
      this.log('error', 'ADO export failed', error);
    }

    return exportStatus;
  }

  // API Methods
  private async makeApiCall(endpoint: string, options: RequestInit = {}): Promise<Response> {
    if (!this.configuration) {
      throw new Error('ADO configuration not found');
    }

    const baseUrl = `https://dev.azure.com/${this.configuration.organization}/${this.configuration.project}`;
    const url = `${baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    if (this.configuration.authentication.token) {
      const auth = btoa(`:${this.configuration.authentication.token}`);
      headers['Authorization'] = `Basic ${auth}`;
    }

    this.log('debug', 'Making API call', { url, method: options.method || 'GET' });

    return fetch(url, {
      ...options,
      headers
    });
  }

  private async createWorkItem(mapping: ADOWorkItemMapping): Promise<ADOWorkItemResponse> {
    const fields: any[] = [];
    
    // Convert mapping fields to ADO format
    Object.entries(mapping.targetFields).forEach(([path, value]) => {
      fields.push({
        op: 'add',
        path: `/fields/${path}`,
        value: value
      });
    });

    const payload = {
      workItemType: mapping.targetType,
      fields: fields
    };

    const response = await this.makeApiCall('/_apis/wit/workitems/$' + mapping.targetType + '?api-version=7.1', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create work item: ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  // Logging and Notifications
  private log(level: 'info' | 'warning' | 'error' | 'debug', message: string, details?: any): void {
    const logEntry: ADOIntegrationLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
      operation: 'ADO Service'
    };

    this.logs.push(logEntry);
    console.log(`[ADO Service] ${level.toUpperCase()}: ${message}`, details || '');
  }

  private addNotification(type: 'success' | 'warning' | 'error' | 'info', title: string, message: string, details?: any): void {
    const notification: ADONotification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      details,
      timestamp: new Date().toISOString(),
      read: false
    };

    this.notifications.push(notification);
  }

  getLogs(): ADOIntegrationLogEntry[] {
    return this.logs;
  }

  getNotifications(): ADONotification[] {
    return this.notifications;
  }

  clearLogs(): void {
    this.logs = [];
  }

  clearNotifications(): void {
    this.notifications = [];
  }
}

// Export singleton instance
export const adoService = new ADOService();
