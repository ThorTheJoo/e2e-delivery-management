import {
  BlueDolphinDomain,
  BlueDolphinCapability,
  BlueDolphinRequirement,
  BlueDolphinUseCase,
  BlueDolphinApplicationFunction,
  CreateDomainRequest,
  CreateCapabilityRequest,
  CreateRequirementRequest,
  ApiResponse,
  ODataResponse,
  BlueDolphinConfig,
  SyncResult,
  SyncOperation
} from '@/types/blue-dolphin';

export abstract class BlueDolphinBaseService {
  protected baseUrl: string;
  protected apiKey: string;
  protected username?: string;
  protected password?: string;

  constructor(config: BlueDolphinConfig) {
    this.baseUrl = config.apiUrl;
    this.apiKey = config.apiKey || '';
    this.username = config.username;
    this.password = config.password;
  }

  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    } else if (this.username && this.password) {
      headers['Authorization'] = `Basic ${btoa(`${this.username}:${this.password}`)}`;
    }

    return headers;
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Blue Dolphin API Error: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  protected buildQueryParams(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    return searchParams.toString();
  }
}

export class BlueDolphinRestService extends BlueDolphinBaseService {
  // Domain operations
  async getDomains(params?: {
    type?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<BlueDolphinDomain[]>> {
    const queryParams = this.buildQueryParams(params || {});
    const endpoint = `/api/v1/domains${queryParams ? `?${queryParams}` : ''}`;
    
    return this.request<ApiResponse<BlueDolphinDomain[]>>(endpoint);
  }

  async getDomainById(id: string): Promise<BlueDolphinDomain> {
    return this.request<BlueDolphinDomain>(`/api/v1/domains/${id}`);
  }

  async createDomain(domain: CreateDomainRequest): Promise<BlueDolphinDomain> {
    return this.request<BlueDolphinDomain>('/api/v1/domains', {
      method: 'POST',
      body: JSON.stringify(domain),
    });
  }

  async updateDomain(
    id: string,
    domain: Partial<CreateDomainRequest>
  ): Promise<BlueDolphinDomain> {
    return this.request<BlueDolphinDomain>(`/api/v1/domains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(domain),
    });
  }

  async deleteDomain(id: string): Promise<void> {
    return this.request<void>(`/api/v1/domains/${id}`, {
      method: 'DELETE',
    });
  }

  // Capability operations
  async getCapabilities(params?: {
    domainId?: string;
    level?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<BlueDolphinCapability[]>> {
    const queryParams = this.buildQueryParams(params || {});
    const endpoint = `/api/v1/capabilities${queryParams ? `?${queryParams}` : ''}`;
    
    return this.request<ApiResponse<BlueDolphinCapability[]>>(endpoint);
  }

  async getCapabilitiesByDomain(domainId: string): Promise<BlueDolphinCapability[]> {
    return this.request<BlueDolphinCapability[]>(`/api/v1/domains/${domainId}/capabilities`);
  }

  async createCapability(
    domainId: string,
    capability: CreateCapabilityRequest
  ): Promise<BlueDolphinCapability> {
    return this.request<BlueDolphinCapability>(`/api/v1/domains/${domainId}/capabilities`, {
      method: 'POST',
      body: JSON.stringify(capability),
    });
  }

  // Requirement operations
  async getRequirements(params?: {
    domainId?: string;
    capabilityId?: string;
    type?: string;
    priority?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<BlueDolphinRequirement[]>> {
    const queryParams = this.buildQueryParams(params || {});
    const endpoint = `/api/v1/requirements${queryParams ? `?${queryParams}` : ''}`;
    
    return this.request<ApiResponse<BlueDolphinRequirement[]>>(endpoint);
  }

  async createRequirement(requirement: CreateRequirementRequest): Promise<BlueDolphinRequirement> {
    return this.request<BlueDolphinRequirement>('/api/v1/requirements', {
      method: 'POST',
      body: JSON.stringify(requirement),
    });
  }

  // Use case operations
  async getUseCases(params?: {
    domainId?: string;
    capabilityId?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<BlueDolphinUseCase[]>> {
    const queryParams = this.buildQueryParams(params || {});
    const endpoint = `/api/v1/usecases${queryParams ? `?${queryParams}` : ''}`;
    
    return this.request<ApiResponse<BlueDolphinUseCase[]>>(endpoint);
  }

  // Application function operations
  async getApplicationFunctions(params?: {
    domainId?: string;
    capabilityId?: string;
    type?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<BlueDolphinApplicationFunction[]>> {
    const queryParams = this.buildQueryParams(params || {});
    const endpoint = `/api/v1/application-functions${queryParams ? `?${queryParams}` : ''}`;
    
    return this.request<ApiResponse<BlueDolphinApplicationFunction[]>>(endpoint);
  }
}

export class BlueDolphinODataService extends BlueDolphinBaseService {
  private odataUrl: string;

  constructor(config: BlueDolphinConfig) {
    super(config);
    this.odataUrl = config.odataUrl;
  }

  protected getODataHeaders(): Record<string, string> {
    return {
      ...this.getAuthHeaders(),
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
    };
  }

  protected async odataRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.odataUrl}${endpoint}`;
    const headers = this.getODataHeaders();

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Blue Dolphin OData Error: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  // Domain operations
  async getDomains(options?: {
    filter?: string;
    select?: string[];
    orderby?: string;
    top?: number;
    skip?: number;
    expand?: string[];
  }): Promise<ODataResponse<BlueDolphinDomain>> {
    const queryParams = this.buildODataQueryParams(options || {});
    const endpoint = `/Domains${queryParams ? `?${queryParams}` : ''}`;
    
    return this.odataRequest<ODataResponse<BlueDolphinDomain>>(endpoint);
  }

  async getDomainById(id: string, expand?: string[]): Promise<BlueDolphinDomain> {
    const queryParams = expand ? this.buildODataQueryParams({ expand }) : '';
    const endpoint = `/Domains('${id}')${queryParams ? `?${queryParams}` : ''}`;
    
    return this.odataRequest<BlueDolphinDomain>(endpoint);
  }

  // Capability operations
  async getCapabilities(options?: {
    domainId?: string;
    filter?: string;
    select?: string[];
    orderby?: string;
    top?: number;
    skip?: number;
    expand?: string[];
  }): Promise<ODataResponse<BlueDolphinCapability>> {
    const filters: string[] = [];
    if (options?.domainId) {
      filters.push(`DomainId eq '${options.domainId}'`);
    }
    if (options?.filter) {
      filters.push(options.filter);
    }

    const queryOptions = {
      ...options,
      filter: filters.length > 0 ? filters.join(' and ') : undefined,
    };

    const queryParams = this.buildODataQueryParams(queryOptions);
    const endpoint = `/Capabilities${queryParams ? `?${queryParams}` : ''}`;
    
    return this.odataRequest<ODataResponse<BlueDolphinCapability>>(endpoint);
  }

  // Requirement operations
  async getRequirements(options?: {
    domainId?: string;
    capabilityId?: string;
    filter?: string;
    select?: string[];
    orderby?: string;
    top?: number;
    skip?: number;
    expand?: string[];
  }): Promise<ODataResponse<BlueDolphinRequirement>> {
    const filters: string[] = [];
    if (options?.domainId) {
      filters.push(`DomainId eq '${options.domainId}'`);
    }
    if (options?.capabilityId) {
      filters.push(`CapabilityId eq '${options.capabilityId}'`);
    }
    if (options?.filter) {
      filters.push(options.filter);
    }

    const queryOptions = {
      ...options,
      filter: filters.length > 0 ? filters.join(' and ') : undefined,
    };

    const queryParams = this.buildODataQueryParams(queryOptions);
    const endpoint = `/Requirements${queryParams ? `?${queryParams}` : ''}`;
    
    return this.odataRequest<ODataResponse<BlueDolphinRequirement>>(endpoint);
  }

  // Use case operations
  async getUseCases(options?: {
    domainId?: string;
    filter?: string;
    select?: string[];
    orderby?: string;
    top?: number;
    skip?: number;
    expand?: string[];
  }): Promise<ODataResponse<BlueDolphinUseCase>> {
    const filters: string[] = [];
    if (options?.domainId) {
      filters.push(`DomainId eq '${options.domainId}'`);
    }
    if (options?.filter) {
      filters.push(options.filter);
    }

    const queryOptions = {
      ...options,
      filter: filters.length > 0 ? filters.join(' and ') : undefined,
    };

    const queryParams = this.buildODataQueryParams(queryOptions);
    const endpoint = `/UseCases${queryParams ? `?${queryParams}` : ''}`;
    
    return this.odataRequest<ODataResponse<BlueDolphinUseCase>>(endpoint);
  }

  // Count operations
  async getDomainCount(filter?: string): Promise<number> {
    const queryParams = filter ? `?$filter=${encodeURIComponent(filter)}` : '';
    const endpoint = `/Domains/$count${queryParams}`;
    
    return this.odataRequest<number>(endpoint);
  }

  async getCapabilityCount(filter?: string): Promise<number> {
    const queryParams = filter ? `?$filter=${encodeURIComponent(filter)}` : '';
    const endpoint = `/Capabilities/$count${queryParams}`;
    
    return this.odataRequest<number>(endpoint);
  }

  private buildODataQueryParams(options: Record<string, any>): string {
    const params: string[] = [];

    if (options.filter) params.push(`$filter=${encodeURIComponent(options.filter)}`);
    if (options.select) params.push(`$select=${options.select.join(',')}`);
    if (options.orderby) params.push(`$orderby=${options.orderby}`);
    if (options.top) params.push(`$top=${options.top}`);
    if (options.skip) params.push(`$skip=${options.skip}`);
    if (options.expand) params.push(`$expand=${options.expand.join(',')}`);

    return params.join('&');
  }
}

export class BlueDolphinSyncService {
  private restService: BlueDolphinRestService;
  private odataService: BlueDolphinODataService;
  private config: BlueDolphinConfig;

  constructor(config: BlueDolphinConfig) {
    this.config = config;
    this.restService = new BlueDolphinRestService(config);
    this.odataService = new BlueDolphinODataService(config);
  }

  // Sync TMF domains from E2E to Blue Dolphin
  async syncDomainsToBlueDolphin(domains: any[]): Promise<SyncResult> {
    const operations: SyncOperation[] = [];
    const errors: string[] = [];
    let syncedCount = 0;

    for (const domain of domains) {
      const operation: SyncOperation = {
        id: `sync-domain-${domain.id}`,
        type: 'CREATE',
        entityType: 'DOMAIN',
        entityId: domain.id,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        operation.status = 'IN_PROGRESS';
        operation.updatedAt = new Date().toISOString();

        await this.restService.createDomain({
          name: domain.name,
          description: domain.description,
          type: 'TMF_ODA_DOMAIN',
          metadata: {
            tmfVersion: '4.0',
            category: 'CORE_DOMAIN',
          },
        });

        operation.status = 'COMPLETED';
        operation.updatedAt = new Date().toISOString();
        syncedCount++;
      } catch (error) {
        operation.status = 'FAILED';
        operation.error = error instanceof Error ? error.message : 'Unknown error';
        operation.updatedAt = new Date().toISOString();
        errors.push(`Failed to sync domain ${domain.name}: ${operation.error}`);
      }

      operations.push(operation);
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors,
      operations,
    };
  }

  // Sync capabilities from E2E to Blue Dolphin
  async syncCapabilitiesToBlueDolphin(
    domainId: string,
    capabilities: any[]
  ): Promise<SyncResult> {
    const operations: SyncOperation[] = [];
    const errors: string[] = [];
    let syncedCount = 0;

    for (const capability of capabilities) {
      const operation: SyncOperation = {
        id: `sync-capability-${capability.id}`,
        type: 'CREATE',
        entityType: 'CAPABILITY',
        entityId: capability.id,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        operation.status = 'IN_PROGRESS';
        operation.updatedAt = new Date().toISOString();

        await this.restService.createCapability(domainId, {
          name: capability.name,
          description: capability.description,
          type: 'TMF_ODA_CAPABILITY',
          level: 'LEVEL_1', // Default level
          metadata: {
            effortEstimate: `${capability.baseEffort?.businessAnalyst + 
              capability.baseEffort?.solutionArchitect + 
              capability.baseEffort?.developer + 
              capability.baseEffort?.qaEngineer} PD`,
            complexity: 'MEDIUM',
          },
        });

        operation.status = 'COMPLETED';
        operation.updatedAt = new Date().toISOString();
        syncedCount++;
      } catch (error) {
        operation.status = 'FAILED';
        operation.error = error instanceof Error ? error.message : 'Unknown error';
        operation.updatedAt = new Date().toISOString();
        errors.push(`Failed to sync capability ${capability.name}: ${operation.error}`);
      }

      operations.push(operation);
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors,
      operations,
    };
  }

  // Sync requirements from SpecSync to Blue Dolphin
  async syncRequirementsToBlueDolphin(
    requirements: any[]
  ): Promise<SyncResult> {
    const operations: SyncOperation[] = [];
    const errors: string[] = [];
    let syncedCount = 0;

    for (const requirement of requirements) {
      const operation: SyncOperation = {
        id: `sync-requirement-${requirement.id}`,
        type: 'CREATE',
        entityType: 'REQUIREMENT',
        entityId: requirement.id,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        operation.status = 'IN_PROGRESS';
        operation.updatedAt = new Date().toISOString();

        await this.restService.createRequirement({
          name: requirement.rephrasedRequirementId || requirement.requirementId,
          description: requirement.description || requirement.usecase1 || 'No description available',
          type: 'FUNCTIONAL_REQUIREMENT',
          priority: 'MEDIUM', // Default priority
          metadata: {
            source: 'SPECSYNC',
            sourceId: requirement.sourceRequirementId || requirement.requirementId,
            useCases: requirement.usecase1 ? [requirement.usecase1] : [],
          },
        });

        operation.status = 'COMPLETED';
        operation.updatedAt = new Date().toISOString();
        syncedCount++;
      } catch (error) {
        operation.status = 'FAILED';
        operation.error = error instanceof Error ? error.message : 'Unknown error';
        operation.updatedAt = new Date().toISOString();
        errors.push(`Failed to sync requirement ${requirement.rephrasedRequirementId}: ${operation.error}`);
      }

      operations.push(operation);
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors,
      operations,
    };
  }

  // Get domains from Blue Dolphin and map to E2E format
  async getDomainsFromBlueDolphin(): Promise<any[]> {
    const response = await this.odataService.getDomains({
      filter: "Type eq 'TMF_ODA_DOMAIN' and Status eq 'ACTIVE'",
      expand: ['Capabilities'],
    });

    return response.value.map((domain) => ({
      id: domain.id,
      name: domain.name,
      description: domain.description,
      capabilities: (domain as any).Capabilities?.map((cap: any) => ({
        id: cap.id,
        name: cap.name,
        description: cap.description,
        segments: [],
        baseEffort: {
          businessAnalyst: 5,
          solutionArchitect: 3,
          developer: 10,
          qaEngineer: 2,
        },
        complexityFactors: {},
      })) || [],
    }));
  }
}

// Factory function to create the appropriate service based on configuration
export function createBlueDolphinService(config: BlueDolphinConfig) {
  switch (config.protocol) {
    case 'REST':
      return new BlueDolphinRestService(config);
    case 'ODATA':
      return new BlueDolphinODataService(config);
    case 'HYBRID':
      return {
        rest: new BlueDolphinRestService(config),
        odata: new BlueDolphinODataService(config),
        sync: new BlueDolphinSyncService(config)
      };
    default:
      throw new Error(`Unsupported protocol: ${config.protocol}`);
  }
}
