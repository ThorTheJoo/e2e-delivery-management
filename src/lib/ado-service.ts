import {
  ADOConfiguration,
  ADOWorkItemMapping,
  ADOValidationResult,
  ADOExportStatus,
  ADOPreviewData,
  ADOApiResponse,
  ADOWorkItemResponse,
  ADOProject,
  ADOAuthStatus,
  ADOIntegrationLogEntry,
  ADONotification,
} from '@/types/ado';
import { Project, TMFOdaDomain, SpecSyncItem } from '@/types';
import { BlueDolphinObjectEnhanced } from '@/types/blue-dolphin';

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
      if (typeof window === 'undefined') {
        this.log('info', 'Skipping configuration load on server');
        return null;
      }
      const savedConfig = window.localStorage.getItem('ado-configuration');
      if (savedConfig) {
        this.configuration = JSON.parse(savedConfig);
        this.log('info', 'Configuration loaded from storage');
        
        // Don't automatically test connection on load to prevent infinite loops
        // Connection testing should be done explicitly by user action
        
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
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('ado-configuration', JSON.stringify(config));
      }
      this.log('info', 'Configuration saved successfully');

      // Don't automatically test connection on save to prevent infinite loops
      // Connection testing should be done explicitly by user action
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

    if (!this.configuration.organization || !this.configuration.project) {
      this.log('error', 'Organization and project must be configured');
      this.addNotification(
        'error',
        'Configuration Error',
        'Organization and project must be configured',
      );
      return false;
    }

    if (!this.configuration.authentication.token) {
      this.log('error', 'Authentication token not configured');
      this.addNotification('error', 'Authentication Error', 'Personal Access Token not configured');
      return false;
    }

    try {
      this.log('info', 'Testing ADO connection...', {
        organization: this.configuration.organization,
        project: this.configuration.project,
      });

      const response = await this.makeApiCall('/_apis/projects?api-version=7.1');

      if (response.ok) {
        const data: ADOApiResponse<ADOProject> = await response.json();
        this.log('info', 'Successfully retrieved projects list', {
          projectCount: data.value.length,
          projects: data.value.map((p) => p.name),
        });

        const project = data.value.find((p) => p.name === this.configuration!.project);

        if (project) {
          this.authStatus = {
            isAuthenticated: true,
            organization: this.configuration.organization,
            project: this.configuration.project,
            user: 'Authenticated User', // Would get from API in real implementation
            permissions: ['Read', 'Write'], // Would get from API in real implementation
            lastChecked: new Date().toISOString(),
          };

          this.log('info', 'ADO connection test successful', {
            foundProject: project.name,
            projectId: project.id,
          });
          this.addNotification(
            'success',
            'Connection Successful',
            `Successfully connected to Azure DevOps project: ${project.name}`,
          );
          return true;
        } else {
          this.log('error', `Project '${this.configuration.project}' not found in organization`, {
            availableProjects: data.value.map((p) => p.name),
          });
          this.addNotification(
            'error',
            'Project Not Found',
            `Project '${this.configuration.project}' not found. Available projects: ${data.value.map((p) => p.name).join(', ')}`,
          );
          return false;
        }
      } else {
        const errorText = await response.text();
        this.log('error', 'ADO connection test failed', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        this.addNotification(
          'error',
          'Connection Failed',
          `HTTP ${response.status}: ${response.statusText}`,
        );
        return false;
      }
    } catch (error) {
      this.log('error', 'ADO connection test failed with exception', error);
      this.addNotification(
        'error',
        'Connection Failed',
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  getAuthStatus(): ADOAuthStatus | null {
    return this.authStatus;
  }

  // Ensure authentication before operations
  async ensureAuthenticated(): Promise<boolean> {
    if (this.authStatus?.isAuthenticated) {
      return true;
    }

    if (!this.configuration?.authentication.token) {
      this.log('error', 'No authentication token available');
      return false;
    }

    this.log('info', 'Authentication not verified, testing connection...');
    return await this.testConnection();
  }

  // Validate work item types exist in the project
  async validateWorkItemTypes(): Promise<{ [key: string]: boolean }> {
    if (!this.configuration) {
      throw new Error('ADO configuration not found');
    }

    // Check both lowercase and proper case variants for work item types
    // Most ADO projects use proper case (Epic, Feature, etc.)
    const workItemTypesToCheck = [
      { original: 'epic', variants: ['Epic', 'epic'] },
      { original: 'feature', variants: ['Feature', 'feature'] },
      { original: 'User Story', variants: ['User Story', 'user story', 'userstory'] },
      { original: 'task', variants: ['Task', 'task'] }
    ];
    
    const validation: { [key: string]: boolean } = {};

    try {
      for (const typeGroup of workItemTypesToCheck) {
        let found = false;
        
        for (const variant of typeGroup.variants) {
          try {
            // Handle spaces in work item type names by URL encoding
            const encodedType = encodeURIComponent(variant);
            const response = await this.makeApiCall(
              `/_apis/wit/workItemTypes/${encodedType}?api-version=7.1`,
              {},
              true,
            );
            
            if (response.ok) {
              validation[typeGroup.original] = true;
              found = true;
              this.log('info', `Work item type '${variant}' is available (mapped to '${typeGroup.original}')`);
              
              // Also log to console for immediate visibility
              console.log(`✅ Work item type '${variant}' is available (mapped to '${typeGroup.original}')`);
              
              break; // Found a working variant, no need to check others
            }
          } catch (error) {
            // Continue to next variant
            this.log('debug', `Work item type '${variant}' check failed`, error);
          }
        }
        
        if (!found) {
          validation[typeGroup.original] = false;
          this.log('warning', `Work item type '${typeGroup.original}' not available in any variant`, {
            checkedVariants: typeGroup.variants,
          });
          
          // Also log to console for immediate visibility
          console.warn(`❌ Work item type '${typeGroup.original}' not available in any variant:`, typeGroup.variants);
        }
      }
    } catch (error) {
      this.log('error', 'Failed to validate work item types', error);
    }

    return validation;
  }

  // Get available work item types from the project
  async getAvailableWorkItemTypes(): Promise<string[]> {
    if (!this.configuration) {
      throw new Error('ADO configuration not found');
    }

    try {
      const response = await this.makeApiCall('/_apis/wit/workItemTypes?api-version=7.1', {}, true);

      if (response.ok) {
        const data = await response.json();
        const availableTypes = data.value.map((type: any) => type.name);

        this.log('info', 'Retrieved available work item types', {
          count: availableTypes.length,
          types: availableTypes,
        });

        return availableTypes;
      } else {
        this.log('error', 'Failed to retrieve work item types', { status: response.status });
        return [];
      }
    } catch (error) {
      this.log('error', 'Exception while retrieving work item types', error);
      return [];
    }
  }

  // Suggest alternative work item types
  suggestAlternativeWorkItemTypes(): { [key: string]: string[] } {
    return {
      epic: ['Requirement', 'Issue', 'Bug'],
      feature: ['Requirement', 'Issue', 'Bug'],
      'User Story': ['Requirement', 'Issue', 'Bug'],
      task: ['Requirement', 'Issue', 'Bug'],
    };
  }

  // Get valid area paths from ADO project
  async getValidAreaPaths(): Promise<string[]> {
    try {
      const response = await this.makeApiCall(
        `/${this.configuration?.project}/_apis/wit/classificationnodes/areas?api-version=7.1`,
        { method: 'GET' },
        true
      );

      if (!response.ok) {
        throw new Error(`Failed to get area paths: ${response.statusText}`);
      }

      const data = await response.json();
      const areaPaths = this.extractAreaPaths(data);
      
      this.log('info', 'Retrieved valid area paths', { count: areaPaths.length, paths: areaPaths });
      return areaPaths;
    } catch (error) {
      this.log('error', 'Failed to get area paths', error);
      // Return default area path if API call fails
      return [this.configuration?.project || 'ADOSandBox'];
    }
  }

  private extractAreaPaths(node: any, prefix: string = ''): string[] {
    const paths: string[] = [];
    const currentPath = prefix ? `${prefix}\\${node.name}` : node.name;
    
    // Add current node path
    paths.push(currentPath);
    
    // Recursively add child paths
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        paths.push(...this.extractAreaPaths(child, currentPath));
      }
    }
    
    return paths;
  }

  // Work Item Generation
  generateWorkItemMappings(
    project: Project,
    domains: TMFOdaDomain[],
    specSyncItems: SpecSyncItem[],
  ): ADOWorkItemMapping[] {
    this.log('info', 'Generating work item mappings', {
      projectId: project.id,
      domainCount: domains.length,
      requirementCount: specSyncItems.length,
    });

    const mappings: ADOWorkItemMapping[] = [];

    try {
      // 1. Generate Epic from Project
      const epicMapping = this.generateEpicFromProject(project, domains);
      mappings.push(epicMapping);

      // 2. Generate Features from TMF Domains
      domains.forEach((domain) => {
        const featureMapping = this.generateFeatureFromDomain(domain);
        mappings.push(featureMapping);
      });

      // 3. Generate User Stories from TMF Capabilities
      domains.forEach((domain) => {
        domain.capabilities.forEach((capability) => {
          const userStoryMapping = this.generateUserStoryFromCapability(capability, domain);
          this.log('debug', 'Generated User Story mapping', {
            targetType: userStoryMapping.targetType,
            title: userStoryMapping.targetTitle,
          });
          mappings.push(userStoryMapping);
        });
      });

      // 4. Generate Tasks from SpecSync Requirements
      specSyncItems.forEach((item) => {
        const taskMapping = this.generateTaskFromSpecSyncItem(item, domains);
        if (taskMapping) {
          mappings.push(taskMapping);
        }
      });

      // Debug: Log all generated mappings to see their types
      mappings.forEach((mapping, index) => {
        this.log('debug', `Mapping ${index + 1}`, {
          targetType: mapping.targetType,
          title: mapping.targetTitle,
        });
      });

      this.log('info', 'Work item mappings generated successfully', {
        totalMappings: mappings.length,
        breakdown: {
          epics: mappings.filter((m) => m.targetType === 'epic').length,
          features: mappings.filter((m) => m.targetType === 'feature').length,
          userStories: mappings.filter((m) => m.targetType === 'User Story').length,
          tasks: mappings.filter((m) => m.targetType === 'task').length,
        },
      });
    } catch (error) {
      this.log('error', 'Failed to generate work item mappings', error);
    }

    return mappings;
  }

  // Blue Dolphin Work Item Generation
  generateWorkItemMappingsFromBlueDolphin(
    project: Project,
    blueDolphinObjects: BlueDolphinObjectEnhanced[],
    selectedDeliverables: string[] = [],
    selectedApplicationFunctions: string[] = [],
    selectedApplicationInterfaces: string[] = []
  ): ADOWorkItemMapping[] {
    this.log('info', 'Generating work item mappings from Blue Dolphin objects', {
      projectId: project.id,
      totalObjects: blueDolphinObjects.length,
      selectedDeliverables: selectedDeliverables.length,
      selectedApplicationFunctions: selectedApplicationFunctions.length,
      selectedApplicationInterfaces: selectedApplicationInterfaces.length,
    });

    const mappings: ADOWorkItemMapping[] = [];

    try {
      // Filter objects based on selection
      const deliverables = blueDolphinObjects.filter(obj => 
        obj.Definition === 'Deliverable' && 
        (selectedDeliverables.length === 0 || selectedDeliverables.includes(obj.ID))
      );
      
      const applicationFunctions = blueDolphinObjects.filter(obj => 
        obj.Definition === 'Application Function' && 
        (selectedApplicationFunctions.length === 0 || selectedApplicationFunctions.includes(obj.ID))
      );
      
      const applicationInterfaces = blueDolphinObjects.filter(obj => 
        obj.Definition === 'Application Interface' && 
        (selectedApplicationInterfaces.length === 0 || selectedApplicationInterfaces.includes(obj.ID))
      );

      // 1. Generate Epics from Deliverables
      deliverables.forEach((deliverable) => {
        const epicMapping = this.generateEpicFromDeliverable(deliverable, project);
        mappings.push(epicMapping);
      });

      // 2. Generate Features from Application Functions
      applicationFunctions.forEach((appFunction) => {
        const featureMapping = this.generateFeatureFromApplicationFunction(appFunction, project);
        mappings.push(featureMapping);
      });

      // 3. Generate Features from Application Interfaces
      applicationInterfaces.forEach((appInterface) => {
        const featureMapping = this.generateFeatureFromApplicationInterface(appInterface, project);
        mappings.push(featureMapping);
      });

      this.log('info', 'Blue Dolphin work item mappings generated successfully', {
        totalMappings: mappings.length,
        breakdown: {
          epics: mappings.filter((m) => m.targetType === 'epic').length,
          features: mappings.filter((m) => m.targetType === 'feature').length,
        },
      });
    } catch (error) {
      this.log('error', 'Failed to generate Blue Dolphin work item mappings', error);
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
        'System.AreaPath': this.configuration?.project || 'ADOSandBox',
        'System.IterationPath': this.configuration?.project || 'ADOSandBox',
        // Removed all optional fields to prevent creation failures
        // Only using required system fields that are guaranteed to exist
      },
      relationships: [],
      estimatedEffort: this.calculateTotalEffort(domains),
      storyPoints: 0,
      priority: 'High',
      tags: ['BSS-Transformation', 'Epic', project.customer, 'TMF-ODA'],
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
        'System.AreaPath': this.configuration?.project || 'ADOSandBox',
        'System.IterationPath': this.configuration?.project || 'ADOSandBox',
        'System.Tags': `TMF-Domain;${domain.name};Feature`,
        'Custom.DomainId': domain.id,
        'Custom.CapabilityCount': domain.capabilities.length,
        'Custom.TMFLevel': 'Domain',
      },
      relationships: [`Epic:${domain.name}`],
      estimatedEffort: this.calculateDomainEffort(domain),
      storyPoints: this.calculateStoryPoints(domain.capabilities.length),
      priority: 'High',
      tags: ['TMF-Domain', domain.name, 'Feature'],
    };
  }

  private generateUserStoryFromCapability(
    capability: any,
    domain: TMFOdaDomain,
  ): ADOWorkItemMapping {
    return {
      sourceType: 'capability',
      sourceId: capability.id,
      sourceName: capability.name,
      targetType: 'User Story',
      targetTitle: capability.name,
      targetDescription: capability.description,
      targetFields: {
        'System.Title': capability.name,
        'System.Description': capability.description,
        'Microsoft.VSTS.Common.StoryPoints': this.calculateStoryPoints(1),
        'Microsoft.VSTS.Common.AcceptanceCriteria': `${capability.name} capability delivered and tested according to TMF specifications`,
        'System.AreaPath': this.configuration?.project || 'ADOSandBox',
        'System.IterationPath': this.configuration?.project || 'ADOSandBox',
        'System.Tags': `TMF-Capability;${capability.name};UserStory`,
        'Custom.CapabilityId': capability.id,
        'Custom.DomainId': domain.id,
        'Custom.TMFLevel': 'Capability',
      },
      relationships: [`Feature:${domain.name}`],
      estimatedEffort: this.calculateCapabilityEffort(capability),
      storyPoints: this.calculateStoryPoints(1),
      priority: 'Medium',
      tags: ['TMF-Capability', capability.name, 'UserStory'],
    };
  }

  private generateTaskFromSpecSyncItem(
    item: SpecSyncItem,
    domains: TMFOdaDomain[],
  ): ADOWorkItemMapping | null {
    // Find matching capability based on function name or capability field
    const matchingCapability = this.findMatchingCapability(item, domains);
    if (!matchingCapability) {
      this.log('warning', 'No matching capability found for SpecSync item', {
        itemId: item.id,
        functionName: item.functionName,
      });
      return null;
    }

    // Enrich with complexity attributes if present in localStorage selection (non-breaking)
    let complexityFields: Record<string, any> = {};
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('complexity-selection') : null;
      if (raw) {
        const selection = JSON.parse(raw);
        complexityFields = {
          'Custom.Complexity.CustomerType': selection.customerTypeId || '',
          'Custom.Complexity.ProductMix': Array.isArray(selection.productMixIds)
            ? selection.productMixIds.join(';')
            : selection.productMixId || '',
          'Custom.Complexity.AccessTech': Array.isArray(selection.accessTechnologyIds)
            ? selection.accessTechnologyIds.join(';')
            : selection.accessTechnologyId || '',
          'Custom.Complexity.Channel': Array.isArray(selection.channelIds)
            ? selection.channelIds.join(';')
            : selection.channelId || '',
          'Custom.Complexity.Deployment': selection.deploymentId || '',
          'Custom.Complexity.APIs': selection?.integration?.apiCount || 0,
          'Custom.Complexity.Legacy': Boolean(selection?.integration?.requiresLegacyCompatibility),
        };
      }
    } catch {}

    return {
      sourceType: 'requirement',
      sourceId: item.id,
      sourceName: item.rephrasedRequirementId,
      targetType: 'task',
      targetTitle: `${item.rephrasedRequirementId} - ${item.functionName}`,
      targetDescription:
        item.usecase1 || item.description || `Implement ${item.functionName} functionality`,
      targetFields: {
        'System.Title': `${item.rephrasedRequirementId} - ${item.functionName}`,
        'System.Description':
          item.usecase1 || item.description || `Implement ${item.functionName} functionality`,
        'Microsoft.VSTS.Scheduling.RemainingWork': this.calculateRemainingWork(item),
        'Microsoft.VSTS.Scheduling.Activity': this.determineActivity(item),
        'System.AreaPath': this.configuration?.project || 'ADOSandBox',
        'System.IterationPath': this.configuration?.project || 'ADOSandBox',
        'System.Tags': `SpecSync;${item.domain};${item.functionName};Task`,
        'Custom.RequirementId': item.requirementId,
        'Custom.RephrasedRequirementId': item.rephrasedRequirementId,
        'Custom.Domain': item.domain,
        'Custom.FunctionName': item.functionName,
        'Custom.Capability': item.capability,
        'Custom.Usecase': item.usecase1,
        'Custom.Priority': item.priority || 'Medium',
        'Custom.Status': item.status || 'New',
        ...complexityFields,
      },
      relationships: [`UserStory:${matchingCapability.name}`],
      estimatedEffort: this.calculateTaskEffort(item),
      storyPoints: 0,
      priority: item.priority || 'Medium',
      tags: ['SpecSync', item.domain, item.functionName, 'Task'],
    };
  }

  // Helper Methods
  private calculateTotalEffort(domains: TMFOdaDomain[]): number {
    return domains.reduce((total, domain) => total + this.calculateDomainEffort(domain), 0);
  }

  private calculateDomainEffort(domain: TMFOdaDomain): number {
    return domain.capabilities.reduce(
      (total, capability) => total + this.calculateCapabilityEffort(capability),
      0,
    );
  }

  private calculateCapabilityEffort(_capability: any): number {
    // Default effort calculation - can be enhanced with actual effort data
    return 5; // 5 days per capability
  }

  private calculateTaskEffort(item: SpecSyncItem): number {
    // Default effort calculation based on priority
    const effortMap: Record<string, number> = {
      High: 3,
      Medium: 2,
      Low: 1,
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

  // Blue Dolphin Mapping Methods
  private generateEpicFromDeliverable(deliverable: BlueDolphinObjectEnhanced, project: Project): ADOWorkItemMapping {
    return {
      sourceType: 'deliverable',
      sourceId: deliverable.ID,
      sourceName: deliverable.Title,
      targetType: 'epic',
      targetTitle: `Epic: ${deliverable.Title}`,
      targetDescription: deliverable.Description || `Deliverable: ${deliverable.Title}`,
      targetFields: {
        'System.Title': `Epic: ${deliverable.Title}`,
        'System.Description': deliverable.Description || `Deliverable: ${deliverable.Title}`,
        'System.AreaPath': this.configuration?.project || 'ADOSandBox',
        'System.IterationPath': this.configuration?.project || 'ADOSandBox',
        // Removed all optional fields to prevent creation failures
        // Only using required system fields that are guaranteed to exist
      },
      relationships: [],
      estimatedEffort: 30, // 30 days for deliverable epic
      storyPoints: 0,
      priority: 'High',
      tags: ['BlueDolphin', 'Deliverable', project.customer],
    };
  }

  private generateFeatureFromApplicationFunction(appFunction: BlueDolphinObjectEnhanced, project: Project): ADOWorkItemMapping {
    return {
      sourceType: 'applicationFunction',
      sourceId: appFunction.ID,
      sourceName: appFunction.Title,
      targetType: 'feature',
      targetTitle: `Feature: ${appFunction.Title}`,
      targetDescription: appFunction.Description || `Application Function: ${appFunction.Title}`,
      targetFields: {
        'System.Title': `Feature: ${appFunction.Title}`,
        'System.Description': appFunction.Description || `Application Function: ${appFunction.Title}`,
        'Microsoft.VSTS.Common.ValueArea': 'Business',
        'System.AreaPath': this.configuration?.project || 'ADOSandBox',
        'System.IterationPath': this.configuration?.project || 'ADOSandBox',
        // Only using minimal standard fields to prevent creation failures
      },
      relationships: [],
      estimatedEffort: 8, // 8 days for application function feature
      storyPoints: 13,
      priority: 'Medium',
      tags: ['BlueDolphin', 'ApplicationFunction', project.customer],
    };
  }

  private generateFeatureFromApplicationInterface(appInterface: BlueDolphinObjectEnhanced, project: Project): ADOWorkItemMapping {
    return {
      sourceType: 'applicationInterface',
      sourceId: appInterface.ID,
      sourceName: appInterface.Title,
      targetType: 'feature',
      targetTitle: `Feature: ${appInterface.Title}`,
      targetDescription: appInterface.Description || `Application Interface: ${appInterface.Title}`,
      targetFields: {
        'System.Title': `Feature: ${appInterface.Title}`,
        'System.Description': appInterface.Description || `Application Interface: ${appInterface.Title}`,
        'Microsoft.VSTS.Common.ValueArea': 'Architectural',
        'System.AreaPath': this.configuration?.project || 'ADOSandBox',
        'System.IterationPath': this.configuration?.project || 'ADOSandBox',
        // Only using minimal standard fields to prevent creation failures
      },
      relationships: [],
      estimatedEffort: 5, // 5 days for application interface feature
      storyPoints: 8,
      priority: 'Medium',
      tags: ['BlueDolphin', 'ApplicationInterface', project.customer],
    };
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
        if (
          capability.name.toLowerCase().includes(item.functionName.toLowerCase()) ||
          item.capability.toLowerCase().includes(capability.name.toLowerCase())
        ) {
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
        if (
          mapping.targetFields['System.Title'] &&
          typeof mapping.targetFields['System.Title'] === 'string' &&
          mapping.targetFields['System.Title'].length > 255
        ) {
          errors.push(`Mapping ${index + 1}: Title too long (max 255 characters)`);
        }
      });

      // Check for duplicate titles
      const titles = mappings.map((m) => m.targetTitle);
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
        if (!this.configuration.authentication.token)
          warnings.push('Authentication token not configured');
      }

      // Summary info
      const breakdown = {
        epics: mappings.filter((m) => m.targetType === 'epic').length,
        features: mappings.filter((m) => m.targetType === 'feature').length,
        userStories: mappings.filter((m) => m.targetType === 'User Story').length,
        tasks: mappings.filter((m) => m.targetType === 'task').length,
      };

      info.push(
        `Total items: ${mappings.length} (Epics: ${breakdown.epics}, Features: ${breakdown.features}, User Stories: ${breakdown.userStories}, Tasks: ${breakdown.tasks})`,
      );

      this.log('info', 'Validation completed', {
        errors: errors.length,
        warnings: warnings.length,
        info: info.length,
      });
    } catch (error) {
      this.log('error', 'Validation failed', error);
      errors.push('Validation process failed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
    };
  }

  // Preview Generation
  generatePreview(mappings: ADOWorkItemMapping[]): ADOPreviewData {
    this.log('info', 'Generating preview data', { totalMappings: mappings.length });

    const epics = mappings.filter((m) => m.targetType === 'epic');
    const features = mappings.filter((m) => m.targetType === 'feature');
    const userStories = mappings.filter((m) => m.targetType === 'User Story');
    const tasks = mappings.filter((m) => m.targetType === 'task');

    const totalEffort = mappings.reduce((sum, m) => sum + (m.estimatedEffort || 0), 0);
    const totalStoryPoints = mappings.reduce((sum, m) => sum + (m.storyPoints || 0), 0);

    const breakdown = {
      epics: epics.length,
      features: features.length,
      userStories: userStories.length,
      tasks: tasks.length,
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
        breakdown,
      },
    };
  }

  // Export Functions
  async exportToJSON(mappings: ADOWorkItemMapping[]): Promise<string> {
    this.log('info', 'Exporting to JSON', { totalMappings: mappings.length });

    const exportData = {
      exportDate: new Date().toISOString(),
      configuration: this.configuration,
      workItems: mappings,
      summary: this.generatePreview(mappings).summary,
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
      exportedItems: [],
    };

    try {
      exportStatus.status = 'exporting';

      // First, validate that all required work item types exist
      this.log('info', 'Validating work item types before export...');
      const workItemTypeValidation = await this.validateWorkItemTypes();

      // Debug: Log the validation results
      this.log('debug', 'Work item type validation results', workItemTypeValidation);
      
      // Also log to console for immediate visibility
      console.log('🔍 Work item type validation results:', workItemTypeValidation);

      // Debug: Log all mapping types before filtering
      mappings.forEach((mapping, index) => {
        this.log('debug', `Mapping ${index + 1} type check`, {
          targetType: mapping.targetType,
          title: mapping.targetTitle,
          isValid: workItemTypeValidation[mapping.targetType],
        });
        
        // Also log to console for immediate visibility
        console.log(`🔍 Mapping ${index + 1} validation:`, {
          targetType: mapping.targetType,
          title: mapping.targetTitle,
          isValid: workItemTypeValidation[mapping.targetType],
        });
      });

      // Filter out mappings for unavailable work item types
      const validMappings = mappings.filter((mapping) => {
        if (!workItemTypeValidation[mapping.targetType]) {
          const errorMessage = `Work item type '${mapping.targetType}' not available in ADO project`;
          exportStatus.errors.push(errorMessage);
          this.log('warning', errorMessage, { mapping: mapping.targetTitle });
          
          // Also log to console for immediate visibility
          console.warn(`⚠️ Filtering out work item:`, {
            type: mapping.targetType,
            title: mapping.targetTitle,
            reason: 'Work item type not available in ADO project'
          });
          
          return false;
        }
        return true;
      });

      if (validMappings.length === 0) {
        exportStatus.status = 'failed';
        exportStatus.errors.push('No valid work item types found for export');
        this.log('error', 'Export failed: No valid work item types available');
        return exportStatus;
      }

      this.log('info', `Proceeding with export of ${validMappings.length} valid mappings`);

      for (let i = 0; i < validMappings.length; i++) {
        const mapping = validMappings[i];

        try {
          this.log(
            'info',
            `Creating work item ${i + 1}/${validMappings.length}: ${mapping.targetTitle}`,
          );

          const workItem = await this.createWorkItem(mapping);
          exportStatus.exportedItems.push(workItem);
          exportStatus.processedItems++;

          this.log('info', 'Work item created successfully', {
            workItemId: workItem.id,
            title: mapping.targetTitle,
          });
        } catch (error) {
          const errorMessage = `Failed to create work item: ${mapping.targetTitle}`;
          exportStatus.errors.push(errorMessage);
          this.log('error', errorMessage, error);
        }

        exportStatus.progress = Math.round(((i + 1) / validMappings.length) * 100);
      }

      exportStatus.status =
        exportStatus.errors.length === 0 ? 'completed' : 'completed_with_errors';

      this.log('info', 'ADO export completed', {
        status: exportStatus.status,
        processed: exportStatus.processedItems,
        errors: exportStatus.errors.length,
      });
    } catch (error) {
      exportStatus.status = 'failed';
      exportStatus.errors.push('Export process failed');
      this.log('error', 'ADO export failed', error);
    }

    return exportStatus;
  }

  // API Methods
  private async makeApiCall(
    endpoint: string,
    options: RequestInit = {},
    useProjectUrl: boolean = false,
  ): Promise<Response> {
    if (!this.configuration) {
      throw new Error('ADO configuration not found');
    }

    // For organization-level APIs (like listing projects), use organization URL
    // For project-level APIs (like work items), use project URL
    const baseUrl = useProjectUrl
      ? `https://dev.azure.com/${this.configuration.organization}/${this.configuration.project}`
      : `https://dev.azure.com/${this.configuration.organization}`;
    const url = `${baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json-patch+json',
      ...(options.headers as Record<string, string>),
    };

    if (this.configuration.authentication.token) {
      const auth = btoa(`:${this.configuration.authentication.token}`);
      headers['Authorization'] = `Basic ${auth}`;
    }

    this.log('debug', 'Making API call', { url, method: options.method || 'GET' });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      return response;
    } catch (fetchError) {
      // Provide more specific error messages based on the error type
      let errorMessage = 'Unknown fetch error';
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          errorMessage = 'Request timeout - the Azure DevOps server may be unreachable or slow to respond';
        } else if (fetchError.message.includes('ENOTFOUND')) {
          errorMessage = 'DNS resolution failed - cannot reach dev.azure.com. Please check your internet connection and VPN status';
        } else if (fetchError.message.includes('ECONNREFUSED')) {
          errorMessage = 'Connection refused - the Azure DevOps server is not accepting connections';
        } else if (fetchError.message.includes('ETIMEDOUT')) {
          errorMessage = 'Connection timeout - the Azure DevOps server is not responding';
        } else if (fetchError.message.includes('fetch failed')) {
          errorMessage = 'Network error - please check your internet connection and VPN status';
        } else {
          errorMessage = fetchError.message;
        }
      }
      
      this.log('error', `ADO API call failed: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  private async createWorkItem(mapping: ADOWorkItemMapping): Promise<ADOWorkItemResponse> {
    try {
      // Azure DevOps expects an array of operations, not a workItemType object
      const operations: any[] = [];

      // Add System.Title first (required field)
      if (mapping.targetFields['System.Title']) {
        operations.push({
          op: 'add',
          path: '/fields/System.Title',
          value: mapping.targetFields['System.Title'],
        });
      }

      // Add System.Description if available
      if (mapping.targetFields['System.Description']) {
        operations.push({
          op: 'add',
          path: '/fields/System.Description',
          value: mapping.targetFields['System.Description'],
        });
      }

      // Use minimal field approach - only add fields that are guaranteed to exist
      // This prevents field validation errors that cause work item creation failures
      
      // Only add Microsoft.VSTS.Common.ValueArea if it's a simple string value
      if (mapping.targetFields['Microsoft.VSTS.Common.ValueArea'] && 
          typeof mapping.targetFields['Microsoft.VSTS.Common.ValueArea'] === 'string') {
        const valueArea = mapping.targetFields['Microsoft.VSTS.Common.ValueArea'];
        // Only use standard values that exist in most ADO projects
        if (valueArea === 'Business' || valueArea === 'Architectural') {
          operations.push({
            op: 'add',
            path: '/fields/Microsoft.VSTS.Common.ValueArea',
            value: valueArea,
          });
        }
      }

      // Add Priority as integer (2 = Normal priority in most ADO projects)
      operations.push({
        op: 'add',
        path: '/fields/Microsoft.VSTS.Common.Priority',
        value: 2,
      });

      // Note: Removed Custom.WorkItemHealth as it may not exist in all ADO projects
      // Only using guaranteed standard fields to prevent creation failures

      // Add area path (required field)
      // Use just the project name, not organization\project format
      const areaPath = this.configuration?.project || 'ADOSandBox';
      operations.push({
        op: 'add',
        path: '/fields/System.AreaPath',
        value: areaPath,
      });

      // Add iteration path (required field)
      // Use just the project name, not organization\project format
      const iterationPath = this.configuration?.project || 'ADOSandBox';
      operations.push({
        op: 'add',
        path: '/fields/System.IterationPath',
        value: iterationPath,
      });

      // Note: External Reference ID field not available in this ADO project
      // Epic work items will be created without this field

      this.log('debug', 'Creating work item', {
        type: mapping.targetType,
        title: mapping.targetFields['System.Title'],
        operations: operations.length,
        operationsList: operations.map((op) => `${op.op} ${op.path}: ${op.value}`),
      });

      // Handle spaces in work item type names by URL encoding
      // Map lowercase types to proper case for ADO API
      const typeMapping: { [key: string]: string } = {
        'epic': 'Epic',
        'feature': 'Feature', 
        'User Story': 'User Story',
        'task': 'Task'
      };
      
      const actualType = typeMapping[mapping.targetType] || mapping.targetType;
      const encodedType = encodeURIComponent(actualType);
      
      this.log('debug', 'Creating work item with type mapping', {
        originalType: mapping.targetType,
        mappedType: actualType,
        encodedType: encodedType
      });
      
      const response = await this.makeApiCall(
        '/_apis/wit/workitems/$' + encodedType + '?api-version=7.1',
        {
          method: 'POST',
          body: JSON.stringify(operations),
        },
        true,
      ); // Use project URL for work item operations

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let detailedError = '';
        
        try {
          const errorData = await response.json();
          this.log('debug', 'ADO API Error Response', errorData);
          
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.value && errorData.value.length > 0) {
            errorMessage = errorData.value[0].message || errorMessage;
            // Capture detailed field validation errors
            if (errorData.value[0].fields) {
              detailedError = `Field errors: ${JSON.stringify(errorData.value[0].fields)}`;
            }
          }
          
          // Log the full error response for debugging
          if (errorData.innerException) {
            detailedError += ` Inner exception: ${errorData.innerException.message}`;
          }
          
        } catch (parseError) {
          // If we can't parse the error, use the status text
          this.log('debug', 'Could not parse error response', parseError);
        }

        this.log('error', 'Work item creation failed', {
          type: mapping.targetType,
          title: mapping.targetFields['System.Title'],
          status: response.status,
          error: errorMessage,
          detailedError: detailedError,
          operations: operations.map((op) => `${op.path}: ${op.value}`),
        });

        // Also log to console for immediate visibility
        console.error('🚨 ADO Work Item Creation Failed:', {
          type: mapping.targetType,
          title: mapping.targetFields['System.Title'],
          status: response.status,
          error: errorMessage,
          detailedError: detailedError,
          operations: operations.map((op) => `${op.path}: ${op.value}`),
        });

        throw new Error(
          `Failed to create work item: ${mapping.targetFields['System.Title'] || mapping.targetType} - ${errorMessage}${detailedError ? ` (${detailedError})` : ''}`,
        );
      }

      const result = await response.json();
      this.log('info', 'Work item created successfully', {
        id: result.id,
        type: mapping.targetType,
        title: mapping.targetFields['System.Title'],
      });

      return result;
    } catch (error) {
      this.log('error', 'Exception during work item creation', {
        type: mapping.targetType,
        title: mapping.targetFields['System.Title'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // Logging and Notifications
  private log(level: 'info' | 'warning' | 'error' | 'debug', message: string, details?: any): void {
    const logEntry: ADOIntegrationLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
      operation: 'ADO Service',
    };

    this.logs.push(logEntry);
    console.log(`[ADO Service] ${level.toUpperCase()}: ${message}`, details || '');
  }

  private addNotification(
    type: 'success' | 'warning' | 'error' | 'info',
    title: string,
    message: string,
    details?: any,
  ): void {
    const notification: ADONotification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      details,
      timestamp: new Date().toISOString(),
      read: false,
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
