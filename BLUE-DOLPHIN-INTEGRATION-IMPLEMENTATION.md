# Blue Dolphin Integration Implementation Guide

## Overview

This guide provides practical implementation details for integrating the E2E Delivery Management application with Blue Dolphin. It includes code examples, integration patterns, and step-by-step implementation instructions.

## Enhanced Object Retrieval Implementation

### MoreColumns Support Analysis

Based on analysis of Excel Power Query capabilities, we've identified that Blue Dolphin OData supports enhanced object retrieval through the `MoreColumns=true` parameter. This enables access to significantly more metadata than the current implementation.

#### Current vs Enhanced Field Comparison

**Current Implementation (Limited Fields):**

```typescript
select: [
  'Id',
  'Title',
  'Definition',
  'Description',
  'ArchimateType',
  'Status',
  'CreatedOn',
  'ChangedOn',
  'Workspace',
];
```

**Enhanced Implementation (With MoreColumns):**

```typescript
select: [
  // Standard fields (existing)
  'Id',
  'Title',
  'Definition',
  'Description',
  'ArchimateType',
  'Status',
  'CreatedOn',
  'ChangedOn',
  'Workspace',

  // Enhanced properties (new)
  'Object_Properties_Name',
  'Object_Properties_AMEFF_Import_Identifier',
  'Deliverable_Object_Status_Status',
  'Object_Properties_Deliverable_Object_Status',
  'Object_Properties_User_Interface_Integration',
  'Ameff_properties_Domain',
  'Ameff_properties_Category',
  'Ameff_properties_Source_ID',
  'Ameff_properties_Compliance',
  'Resource_x26_Rate_Role_required_to_deliver_this_servicex3F',
  'Resource_x26_Rate_Rate',
  'External_Design_Description_Service',
  'External_Design_User_Interface',
  'Object_Properties_Needs_Localization',
  'Object_Properties_Needs_Specialization',
  'Object_Properties_Needs_External_Integration',
  'Object_Properties_Documentation',
  'Object_Properties_Provided_by',
  'Object_Properties_Supplied_By',
  'Object_Properties_Questions',
  'Object_Properties_Action_Items',
  'Object_Properties_Base_Implementation_Costs',
];
```

#### Excel Query Analysis

The Excel Power Query implementation shows the following structure:

```m
let
    Source = OData.Feed("https://csgipoc.odata.bluedolphin.app", null, [MoreColumns=true]),
    Objects_table = Source{[Name="Objects",Signature="table"]}[Data],
    #"Expanded More Columns" = Table.ExpandRecordColumn(Objects_table, "More Columns", {...})
in
    #"Expanded More Columns"
```

**Key Findings:**

1. **MoreColumns=true** parameter enables additional metadata
2. **Nested "More Columns" structure** contains expanded properties
3. **Significantly more fields** available than current implementation
4. **Excel successfully retrieves** all enhanced properties

#### Implementation Strategy

**Phase 1: API Enhancement**

1. Add `MoreColumns=true` support to the Blue Dolphin service
2. Update the select fields array to include new properties
3. Modify the API route to handle enhanced queries
4. Test with small result sets (top=2) to validate

**Phase 2: UI Enhancement**

1. Update object card components to display new fields
2. Add filtering capabilities for new properties
3. Implement field selection controls
4. Add data export functionality for enhanced data

**Phase 3: Performance Optimization**

1. Implement field selection controls
2. Add caching for frequently accessed properties
3. Optimize response handling for large datasets
4. Add progress indicators for enhanced queries

#### Technical Implementation Details

**Updated Blue Dolphin Service:**

```typescript
// Enhanced object retrieval with MoreColumns support
async getObjectsWithMoreColumns(options: {
  endpoint: string;
  filter?: string;
  select?: string[];
  orderby?: string;
  top?: number;
  skip?: number;
  moreColumns?: boolean;
}): Promise<ODataResponse<any>> {

  const queryParams = new URLSearchParams();

  // Add MoreColumns parameter if enabled
  if (options.moreColumns) {
    queryParams.append('MoreColumns', 'true');
  }

  // Standard OData parameters
  if (options.filter) queryParams.append('$filter', options.filter);
  if (options.select && options.select.length > 0) {
    queryParams.append('$select', options.select.join(','));
  }
  if (options.orderby) queryParams.append('$orderby', options.orderby);
  if (options.top) queryParams.append('$top', options.top.toString());
  if (options.skip) queryParams.append('$skip', options.skip.toString());

  const endpoint = `${options.endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return this.odataRequest<ODataResponse<any>>(endpoint);
}
```

**Updated API Route:**

```typescript
case 'get-objects-enhanced':
  try {
    const { endpoint, filter, top = 2, skip = 0, select, orderby, moreColumns } = data || {};

    // Build enhanced query with MoreColumns support
    const queryParams = new URLSearchParams();
    if (moreColumns) queryParams.append('MoreColumns', 'true');
    if (filter) queryParams.append('$filter', filter);
    if (select && select.length > 0) queryParams.append('$select', select.join(','));
    if (orderby) queryParams.append('$orderby', orderby);
    if (top) queryParams.append('$top', top.toString());
    if (skip) queryParams.append('$skip', skip.toString());

    const url = `${baseUrl}${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // Make request and return enhanced data
    const response = await fetch(url, { headers });
    const result = await response.json();

    return NextResponse.json({
      success: true,
      data: result.value || result || [],
      count: (result.value || result || []).length,
      moreColumns: moreColumns,
      enhancedFields: moreColumns ? 'enabled' : 'disabled'
    });
  } catch (error) {
    // Error handling
  }
```

**Enhanced Type Definitions:**

```typescript
export interface BlueDolphinObjectEnhanced extends BlueDolphinObject {
  // Enhanced properties
  Object_Properties_Name?: string;
  Object_Properties_AMEFF_Import_Identifier?: string;
  Deliverable_Object_Status_Status?: string;
  Object_Properties_Deliverable_Object_Status?: string;
  Object_Properties_User_Interface_Integration?: string;
  Ameff_properties_Domain?: string;
  Ameff_properties_Category?: string;
  Ameff_properties_Source_ID?: string;
  Ameff_properties_Compliance?: string;
  Resource_x26_Rate_Role_required_to_deliver_this_servicex3F?: string;
  Resource_x26_Rate_Rate?: string;
  External_Design_Description_Service?: string;
  External_Design_User_Interface?: string;
  Object_Properties_Needs_Localization?: string;
  Object_Properties_Needs_Specialization?: string;
  Object_Properties_Needs_External_Integration?: string;
  Object_Properties_Documentation?: string;
  Object_Properties_Provided_by?: string;
  Object_Properties_Supplied_By?: string;
  Object_Properties_Questions?: string;
  Object_Properties_Action_Items?: string;
  Object_Properties_Base_Implementation_Costs?: string;
}
```

#### Testing Strategy

**Initial Testing (Top=2):**

```typescript
// Test enhanced query with minimal results
const testRequest = {
  action: 'get-objects-enhanced',
  config: blueDolphinConfig,
  data: {
    endpoint: '/Objects',
    filter: "Definition eq 'Application Component'",
    top: 2, // Small result set for testing
    select: [
      'Id',
      'Title',
      'Definition',
      'Status',
      'Object_Properties_Name',
      'Deliverable_Object_Status_Status',
      'Ameff_properties_Domain',
    ],
    moreColumns: true,
  },
};
```

**Validation Steps:**

1. Verify `MoreColumns=true` parameter is accepted
2. Confirm additional fields are returned in response
3. Validate field data types and values
4. Test error handling for invalid field names
5. Measure performance impact of enhanced queries

#### Benefits and Considerations

**Benefits:**

- **Richer Data Model**: Access to comprehensive object metadata
- **Better Reporting**: More fields for analysis and reporting
- **Enhanced Filtering**: Filter by additional properties like compliance, costs
- **Improved UI**: Display more relevant information to users
- **Better Integration**: More data points for external system integration

**Considerations:**

- **Performance Impact**: More fields may increase response size
- **Data Mapping**: Need to update UI components to display new fields
- **Error Handling**: Some fields may be null or undefined
- **Backward Compatibility**: Maintain existing functionality while adding new features
- **Field Selection**: Implement controls to select which enhanced fields to retrieve

## Implementation Strategy

### Phase 1: Foundation Setup

#### 1.1 Environment Configuration

Create environment variables for Blue Dolphin integration:

```bash
# .env.local
BLUE_DOLPHIN_API_URL=https://public-api.eu.bluedolphin.app
BLUE_DOLPHIN_API_KEY=your_api_key_here
BLUE_DOLPHIN_ODATA_URL=https://public-api.eu.bluedolphin.app/odata/v4
BLUE_DOLPHIN_USERNAME=your_username
BLUE_DOLPHIN_PASSWORD=your_password
```

#### 1.2 Type Definitions

Create TypeScript interfaces for Blue Dolphin entities:

```typescript
// src/types/blue-dolphin.ts

export interface BlueDolphinDomain {
  id: string;
  name: string;
  description: string;
  type: 'TMF_ODA_DOMAIN' | 'CUSTOM_DOMAIN';
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  metadata?: {
    tmfVersion?: string;
    category?: string;
    parentDomain?: string;
  };
}

export interface BlueDolphinCapability {
  id: string;
  name: string;
  description: string;
  domainId: string;
  type: 'TMF_ODA_CAPABILITY' | 'CUSTOM_CAPABILITY';
  level: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  metadata?: {
    effortEstimate?: string;
    complexity?: 'LOW' | 'MEDIUM' | 'HIGH';
    dependencies?: string[];
    useCases?: string[];
  };
}

export interface BlueDolphinRequirement {
  id: string;
  name: string;
  description: string;
  type: 'FUNCTIONAL_REQUIREMENT' | 'NON_FUNCTIONAL_REQUIREMENT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  domainId?: string;
  capabilityId?: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  metadata?: {
    source?: string;
    sourceId?: string;
    effortEstimate?: string;
    useCases?: string[];
  };
}

export interface BlueDolphinUseCase {
  id: string;
  name: string;
  title: string;
  description: string;
  actors: string[];
  preconditions: string[];
  postconditions: string[];
  domainId?: string;
  capabilityId?: string;
  requirements?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BlueDolphinApplicationFunction {
  id: string;
  name: string;
  description: string;
  type: 'MICROSERVICE' | 'API' | 'DATABASE' | 'UI_COMPONENT';
  technology?: string;
  domainId?: string;
  capabilityId?: string;
  interfaces?: Array<{
    name: string;
    type: string;
    version: string;
  }>;
  dependencies?: string[];
  createdAt: string;
  updatedAt: string;
}

// Request/Response types
export interface CreateDomainRequest {
  name: string;
  description: string;
  type: BlueDolphinDomain['type'];
  metadata?: BlueDolphinDomain['metadata'];
}

export interface CreateCapabilityRequest {
  name: string;
  description: string;
  type: BlueDolphinCapability['type'];
  level: BlueDolphinCapability['level'];
  metadata?: BlueDolphinCapability['metadata'];
}

export interface CreateRequirementRequest {
  name: string;
  description: string;
  type: BlueDolphinRequirement['type'];
  priority: BlueDolphinRequirement['priority'];
  domainId?: string;
  capabilityId?: string;
  metadata?: BlueDolphinRequirement['metadata'];
}

export interface PaginationInfo {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationInfo;
}

export interface ODataResponse<T> {
  '@odata.context': string;
  value: T[];
  '@odata.count'?: number;
}
```

### Phase 2: Service Layer Implementation

#### 2.1 Base Service Configuration

```typescript
// src/lib/blue-dolphin-base-service.ts

export abstract class BlueDolphinBaseService {
  protected baseUrl: string;
  protected apiKey: string;
  protected username?: string;
  protected password?: string;

  constructor() {
    this.baseUrl = process.env.BLUE_DOLPHIN_API_URL!;
    this.apiKey = process.env.BLUE_DOLPHIN_API_KEY!;
    this.username = process.env.BLUE_DOLPHIN_USERNAME;
    this.password = process.env.BLUE_DOLPHIN_PASSWORD;
  }

  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    } else if (this.username && this.password) {
      headers['Authorization'] = `Basic ${btoa(`${this.username}:${this.password}`)}`;
    }

    return headers;
  }

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
      throw new Error(`Blue Dolphin API Error: ${error.error?.message || response.statusText}`);
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
```

#### 2.2 REST API Service Implementation

```typescript
// src/lib/blue-dolphin-rest-service.ts

import { BlueDolphinBaseService } from './blue-dolphin-base-service';
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
  PaginationInfo,
} from '@/types/blue-dolphin';

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

  async updateDomain(id: string, domain: Partial<CreateDomainRequest>): Promise<BlueDolphinDomain> {
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
    capability: CreateCapabilityRequest,
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

// Export singleton instance
export const blueDolphinRestService = new BlueDolphinRestService();
```

#### 2.3 OData Service Implementation

```typescript
// src/lib/blue-dolphin-odata-service.ts

import { BlueDolphinBaseService } from './blue-dolphin-base-service';
import {
  BlueDolphinDomain,
  BlueDolphinCapability,
  BlueDolphinRequirement,
  BlueDolphinUseCase,
  BlueDolphinApplicationFunction,
  ODataResponse,
} from '@/types/blue-dolphin';

export class BlueDolphinODataService extends BlueDolphinBaseService {
  private odataUrl: string;

  constructor() {
    super();
    this.odataUrl = process.env.BLUE_DOLPHIN_ODATA_URL!;
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
      throw new Error(`Blue Dolphin OData Error: ${error.error?.message || response.statusText}`);
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
    const queryParams = this.buildODataQueryParams(options);
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

// Export singleton instance
export const blueDolphinODataService = new BlueDolphinODataService();
```

### Phase 3: React Hooks and Components

#### 3.1 Custom Hooks

```typescript
// src/hooks/use-blue-dolphin.ts

import { useState, useEffect, useCallback } from 'react';
import { blueDolphinRestService } from '@/lib/blue-dolphin-rest-service';
import { blueDolphinODataService } from '@/lib/blue-dolphin-odata-service';
import {
  BlueDolphinDomain,
  BlueDolphinCapability,
  BlueDolphinRequirement,
  BlueDolphinUseCase,
} from '@/types/blue-dolphin';

// REST API Hooks
export function useBlueDolphinDomains(params?: {
  type?: string;
  status?: string;
  page?: number;
  size?: number;
}) {
  const [domains, setDomains] = useState<BlueDolphinDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchDomains = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await blueDolphinRestService.getDomains(params);
      setDomains(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch domains');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  return { domains, loading, error, pagination, refetch: fetchDomains };
}

export function useBlueDolphinCapabilities(domainId?: string) {
  const [capabilities, setCapabilities] = useState<BlueDolphinCapability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCapabilities = useCallback(async () => {
    if (!domainId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await blueDolphinRestService.getCapabilitiesByDomain(domainId);
      setCapabilities(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch capabilities');
    } finally {
      setLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    fetchCapabilities();
  }, [fetchCapabilities]);

  return { capabilities, loading, error, refetch: fetchCapabilities };
}

// OData Hooks
export function useBlueDolphinOData<T>(
  entitySet: string,
  options?: {
    filter?: string;
    select?: string[];
    orderby?: string;
    top?: number;
    skip?: number;
    expand?: string[];
  },
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let result;
      switch (entitySet) {
        case 'Domains':
          result = await blueDolphinODataService.getDomains(options);
          break;
        case 'Capabilities':
          result = await blueDolphinODataService.getCapabilities(options);
          break;
        case 'Requirements':
          result = await blueDolphinODataService.getRequirements(options);
          break;
        case 'UseCases':
          result = await blueDolphinODataService.getUseCases(options);
          break;
        default:
          throw new Error(`Unknown entity set: ${entitySet}`);
      }

      setData(result.value);
      setTotalCount(result['@odata.count'] || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [entitySet, JSON.stringify(options)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, totalCount, refetch: fetchData };
}
```

#### 3.2 Integration Components

```typescript
// src/components/blue-dolphin-integration/domain-manager.tsx

'use client';

import { useState } from 'react';
import { useBlueDolphinDomains } from '@/hooks/use-blue-dolphin';
import { blueDolphinRestService } from '@/lib/blue-dolphin-rest-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateDomainRequest } from '@/types/blue-dolphin';

export function BlueDolphinDomainManager() {
  const { domains, loading, error, refetch } = useBlueDolphinDomains({
    type: 'TMF_ODA_DOMAIN',
    status: 'ACTIVE',
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDomain, setNewDomain] = useState<Partial<CreateDomainRequest>>({
    name: '',
    description: '',
    type: 'TMF_ODA_DOMAIN',
  });

  const handleCreateDomain = async () => {
    try {
      await blueDolphinRestService.createDomain(newDomain as CreateDomainRequest);
      setShowCreateForm(false);
      setNewDomain({ name: '', description: '', type: 'TMF_ODA_DOMAIN' });
      refetch();
    } catch (error) {
      console.error('Failed to create domain:', error);
    }
  };

  if (loading) return <div>Loading domains...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Blue Dolphin Domains</h2>
        <Button onClick={() => setShowCreateForm(true)}>Create Domain</Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Domain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="domainName">Name</Label>
              <Input
                id="domainName"
                value={newDomain.name}
                onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })}
                placeholder="Enter domain name"
              />
            </div>
            <div>
              <Label htmlFor="domainDescription">Description</Label>
              <Input
                id="domainDescription"
                value={newDomain.description}
                onChange={(e) => setNewDomain({ ...newDomain, description: e.target.value })}
                placeholder="Enter domain description"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateDomain}>Create</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {domains.map((domain) => (
          <Card key={domain.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {domain.name}
                <Badge variant="secondary">{domain.type}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{domain.description}</p>
              <div className="mt-2 text-xs text-gray-500">
                Created: {new Date(domain.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Phase 4: API Routes

#### 4.1 REST API Routes

```typescript
// src/app/api/blue-dolphin/domains/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { blueDolphinRestService } from '@/lib/blue-dolphin-rest-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
    const size = searchParams.get('size') ? parseInt(searchParams.get('size')!) : undefined;

    const response = await blueDolphinRestService.getDomains({
      type: type || undefined,
      status: status || undefined,
      page,
      size,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Blue Dolphin API error:', error);
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const domain = await blueDolphinRestService.createDomain(body);
    return NextResponse.json(domain);
  } catch (error) {
    console.error('Blue Dolphin API error:', error);
    return NextResponse.json({ error: 'Failed to create domain' }, { status: 500 });
  }
}
```

```typescript
// src/app/api/blue-dolphin/domains/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { blueDolphinRestService } from '@/lib/blue-dolphin-rest-service';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const domain = await blueDolphinRestService.getDomainById(params.id);
    return NextResponse.json(domain);
  } catch (error) {
    console.error('Blue Dolphin API error:', error);
    return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const domain = await blueDolphinRestService.updateDomain(params.id, body);
    return NextResponse.json(domain);
  } catch (error) {
    console.error('Blue Dolphin API error:', error);
    return NextResponse.json({ error: 'Failed to update domain' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await blueDolphinRestService.deleteDomain(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Blue Dolphin API error:', error);
    return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 });
  }
}
```

#### 4.2 OData API Routes

```typescript
// src/app/api/blue-dolphin/odata/domains/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { blueDolphinODataService } from '@/lib/blue-dolphin-odata-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const options = {
      filter: searchParams.get('$filter') || undefined,
      select: searchParams.get('$select')?.split(',') || undefined,
      orderby: searchParams.get('$orderby') || undefined,
      top: searchParams.get('$top') ? parseInt(searchParams.get('$top')!) : undefined,
      skip: searchParams.get('$skip') ? parseInt(searchParams.get('$skip')!) : undefined,
      expand: searchParams.get('$expand')?.split(',') || undefined,
    };

    const response = await blueDolphinODataService.getDomains(options);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Blue Dolphin OData error:', error);
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
  }
}
```

### Phase 5: Integration with E2E Application

#### 5.1 Sync Service

```typescript
// src/lib/blue-dolphin-sync-service.ts

import { blueDolphinRestService } from './blue-dolphin-rest-service';
import { blueDolphinODataService } from './blue-dolphin-odata-service';
import { TMFOdaDomain, TMFOdaCapability, SpecSyncItem } from '@/types';

export class BlueDolphinSyncService {
  // Sync TMF domains from E2E to Blue Dolphin
  async syncDomainsToBlueDolphin(domains: TMFOdaDomain[]): Promise<{
    success: boolean;
    syncedCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let syncedCount = 0;

    for (const domain of domains) {
      try {
        await blueDolphinRestService.createDomain({
          name: domain.name,
          description: domain.description,
          type: 'TMF_ODA_DOMAIN',
          metadata: {
            tmfVersion: '4.0',
            category: 'CORE_DOMAIN',
          },
        });
        syncedCount++;
      } catch (error) {
        errors.push(`Failed to sync domain ${domain.name}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors,
    };
  }

  // Sync capabilities from E2E to Blue Dolphin
  async syncCapabilitiesToBlueDolphin(
    domainId: string,
    capabilities: TMFOdaCapability[],
  ): Promise<{
    success: boolean;
    syncedCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let syncedCount = 0;

    for (const capability of capabilities) {
      try {
        await blueDolphinRestService.createCapability(domainId, {
          name: capability.name,
          description: capability.description,
          type: 'TMF_ODA_CAPABILITY',
          level: 'LEVEL_1', // Default level
          metadata: {
            effortEstimate: `${
              capability.baseEffort.businessAnalyst +
              capability.baseEffort.solutionArchitect +
              capability.baseEffort.developer +
              capability.baseEffort.qaEngineer
            } PD`,
            complexity: 'MEDIUM',
          },
        });
        syncedCount++;
      } catch (error) {
        errors.push(`Failed to sync capability ${capability.name}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors,
    };
  }

  // Sync requirements from SpecSync to Blue Dolphin
  async syncRequirementsToBlueDolphin(requirements: SpecSyncItem[]): Promise<{
    success: boolean;
    syncedCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let syncedCount = 0;

    for (const requirement of requirements) {
      try {
        await blueDolphinRestService.createRequirement({
          name: requirement.rephrasedRequirementId,
          description: requirement.usecase1 || 'No description available',
          type: 'FUNCTIONAL_REQUIREMENT',
          priority: 'MEDIUM', // Default priority
          metadata: {
            source: 'SPECSYNC',
            sourceId: requirement.sourceRequirementId,
            useCases: requirement.usecase1 ? [requirement.usecase1] : [],
          },
        });
        syncedCount++;
      } catch (error) {
        errors.push(`Failed to sync requirement ${requirement.rephrasedRequirementId}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors,
    };
  }

  // Get domains from Blue Dolphin and map to E2E format
  async getDomainsFromBlueDolphin(): Promise<TMFOdaDomain[]> {
    const response = await blueDolphinODataService.getDomains({
      filter: "Type eq 'TMF_ODA_DOMAIN' and Status eq 'ACTIVE'",
      expand: ['Capabilities'],
    });

    return response.value.map((domain) => ({
      id: domain.id,
      name: domain.name,
      description: domain.description,
      capabilities:
        domain.Capabilities?.map((cap) => ({
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

// Export singleton instance
export const blueDolphinSyncService = new BlueDolphinSyncService();
```

## Testing Strategy

### Unit Tests

```typescript
// src/lib/__tests__/blue-dolphin-rest-service.test.ts

import { BlueDolphinRestService } from '../blue-dolphin-rest-service';

describe('BlueDolphinRestService', () => {
  let service: BlueDolphinRestService;

  beforeEach(() => {
    service = new BlueDolphinRestService();
  });

  it('should create a domain successfully', async () => {
    const domainData = {
      name: 'Test Domain',
      description: 'Test domain description',
      type: 'TMF_ODA_DOMAIN' as const,
    };

    const result = await service.createDomain(domainData);
    expect(result.name).toBe(domainData.name);
    expect(result.id).toBeDefined();
  });

  it('should handle API errors gracefully', async () => {
    // Test error handling
    await expect(service.getDomainById('invalid-id')).rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
// src/lib/__tests__/blue-dolphin-sync-service.test.ts

import { blueDolphinSyncService } from '../blue-dolphin-sync-service';

describe('BlueDolphinSyncService', () => {
  it('should sync domains from E2E to Blue Dolphin', async () => {
    const e2eDomains = [
      {
        id: '1',
        name: 'Test Domain',
        description: 'Test description',
        capabilities: [],
      },
    ];

    const result = await blueDolphinSyncService.syncDomainsToBlueDolphin(e2eDomains);
    expect(result.success).toBe(true);
    expect(result.syncedCount).toBe(1);
  });
});
```

## Deployment Considerations

### Environment Variables

```bash
# Production environment
BLUE_DOLPHIN_API_URL=https://public-api.eu.bluedolphin.app
BLUE_DOLPHIN_API_KEY=production_api_key
BLUE_DOLPHIN_ODATA_URL=https://public-api.eu.bluedolphin.app/odata/v4
```

### Error Monitoring

```typescript
// src/lib/blue-dolphin-error-handler.ts

export class BlueDolphinErrorHandler {
  static handleError(error: any, context: string) {
    // Log error with context
    console.error(`Blue Dolphin Error [${context}]:`, error);

    // Send to monitoring service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error, { tags: { context } });
    }

    // Return user-friendly error message
    return {
      message: 'An error occurred while communicating with Blue Dolphin',
      details: error.message,
    };
  }
}
```

## Performance Optimization

### Caching Strategy

```typescript
// src/lib/blue-dolphin-cache.ts

class BlueDolphinCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });

    return data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const blueDolphinCache = new BlueDolphinCache();
```

This implementation guide provides a comprehensive foundation for integrating with Blue Dolphin, covering both REST API and OData approaches. The modular design allows for easy extension and maintenance while providing robust error handling and performance optimization.

---

## Relationships Integration (Documentation-Only)

### Feed and Protocol

- **Endpoint**: `https://csgipoc.odata.bluedolphin.app/Relations`
- **Protocol**: OData v2.0 (Excel Relations_table)
- **Headers**: `Accept: application/json`, `OData-Version: 2.0`, `OData-MaxVersion: 2.0`
- **Auth**: Basic (same as Objects)
- **Enhanced Data**: `MoreColumns=true` supported

### Core Fields

- `RelationshipId` — stable identifier for a logical relationship
- `BlueDolphinObjectItemId` — source object ID (lookup in Objects)
- `RelatedBlueDolphinObjectItemId` — target object ID (lookup in Objects)
- `RelationshipDefinitionName` — e.g., Composition, Flow, Association, Realization, Serving, Access
- `BlueDolphinObjectDefinitionName` / `RelatedBlueDolphinObjectDefinitionName` — ArchiMate-like element types
- `Type` — composition | flow | association | realization | access | usedby
- `Name` — human label reflecting direction (composed of/in, flow to/from, serves/served by, accesses, realized by)
- `IsRelationshipDirectionAlternative` — boolean directional indicator

### Directionality and Consolidation

Relationships often appear as directional pairs with the same `RelationshipId` and swapped object IDs:

- Forward: `Name = composed of`
- Reverse: `Name = composed in`
  For UI/presentation, consolidate pairs under a single logical relationship where appropriate.

### ArchiMate Alignment (from e2e_architecture_context_full.md)

- `Type=composition` → ArchiMate Composition (Structural)
- `Type=flow` → Flow (Dynamic)
- `Type=association` → Association (Structural)
- `Type=realization` → Realization (Structural)
- `Type=access` → Access (Dependency)
- `Type=usedby` ↔ Serving (Dependency), labels: serves / served by

Object definitions map to ArchiMate elements across layers:

- Application: Application Component, Application Interface, Data Object
- Strategy: Capability
- Motivation: Principle, Goal
- Business: Business Process
- Technology: Technology Service, Node

### Validated Filters (Relations)

Supported and tested filters for UX:

- `RelationshipDefinitionName`
- `BlueDolphinObjectDefinitionName`
- `RelatedBlueDolphinObjectWorkspaceName`
- `RelatedBlueDolphinObjectDefinitionName`
- `Type`
- `Name`

Combined filters are supported (e.g., `Type eq 'composition' and BlueDolphinObjectDefinitionName eq 'Application Component'`).

### Enrichment Pattern

1. Query `/Relations` for edges.
2. Collect unique IDs from `BlueDolphinObjectItemId` and `RelatedBlueDolphinObjectItemId`.
3. Fetch objects from `/Objects` (with `MoreColumns=true` if needed).
4. Merge object data into relationships for display/analysis.

### Non-Functional Notes

- Performance: prefer batch object lookups and caching for enrichment.
- Data quality: expect directional pairs and heterogeneous element types.
- Semantics: use ArchiMate mapping above to ensure consistent terminology in UI and reports.
