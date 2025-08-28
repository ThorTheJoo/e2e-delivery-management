# Blue Dolphin REST API Integration Guide

## Overview

This guide provides comprehensive documentation for integrating with Blue Dolphin using the REST API. The REST API offers standard HTTP endpoints for creating, reading, updating, and deleting enterprise architecture objects.

## Base Configuration

### API Endpoint
```
https://public-api.eu.bluedolphin.app
```

### Authentication
```typescript
// API Key Authentication (Recommended)
const headers = {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Basic Authentication (Alternative)
const headers = {
  'Authorization': 'Basic ' + btoa('username:password'),
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
```

## Core API Endpoints

### 1. Domain Management

#### Get All Domains
```typescript
GET /api/v1/domains
```

**Response:**
```json
{
  "data": [
    {
      "id": "domain-123",
      "name": "Market & Sales",
      "description": "Market and Sales domain for TMF ODA",
      "type": "TMF_ODA_DOMAIN",
      "status": "ACTIVE",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "metadata": {
        "tmfVersion": "4.0",
        "category": "CORE_DOMAIN"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 100
  }
}
```

#### Get Domain by ID
```typescript
GET /api/v1/domains/{domainId}
```

#### Create Domain
```typescript
POST /api/v1/domains
```

**Request Body:**
```json
{
  "name": "Product Management",
  "description": "Product lifecycle and catalog management domain",
  "type": "TMF_ODA_DOMAIN",
  "metadata": {
    "tmfVersion": "4.0",
    "category": "CORE_DOMAIN",
    "parentDomain": null
  }
}
```

#### Update Domain
```typescript
PUT /api/v1/domains/{domainId}
```

#### Delete Domain
```typescript
DELETE /api/v1/domains/{domainId}
```

### 2. Capability Management

#### Get Capabilities by Domain
```typescript
GET /api/v1/domains/{domainId}/capabilities
```

**Response:**
```json
{
  "data": [
    {
      "id": "cap-456",
      "name": "Product Catalog Management",
      "description": "Manage product catalog and offerings",
      "domainId": "domain-123",
      "type": "TMF_ODA_CAPABILITY",
      "level": "LEVEL_1",
      "status": "ACTIVE",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "metadata": {
        "effortEstimate": "20 PD",
        "complexity": "MEDIUM",
        "dependencies": ["cap-789"]
      }
    }
  ]
}
```

#### Create Capability
```typescript
POST /api/v1/domains/{domainId}/capabilities
```

**Request Body:**
```json
{
  "name": "Order Management",
  "description": "Process and manage customer orders",
  "type": "TMF_ODA_CAPABILITY",
  "level": "LEVEL_2",
  "metadata": {
    "effortEstimate": "15 PD",
    "complexity": "HIGH",
    "dependencies": [],
    "useCases": ["UC001", "UC002"]
  }
}
```

### 3. Requirement Management

#### Get Requirements
```typescript
GET /api/v1/requirements
```

**Query Parameters:**
- `domainId`: Filter by domain
- `capabilityId`: Filter by capability
- `status`: Filter by status (DRAFT, ACTIVE, ARCHIVED)
- `page`: Page number
- `size`: Page size

#### Create Requirement
```typescript
POST /api/v1/requirements
```

**Request Body:**
```json
{
  "name": "REQ-001",
  "description": "System shall support product catalog management",
  "type": "FUNCTIONAL_REQUIREMENT",
  "priority": "HIGH",
  "domainId": "domain-123",
  "capabilityId": "cap-456",
  "metadata": {
    "source": "SPECSYNC",
    "sourceId": "REQ-001-ORIGINAL",
    "effortEstimate": "5 PD",
    "useCases": ["UC001"]
  }
}
```

### 4. Use Case Management

#### Get Use Cases
```typescript
GET /api/v1/usecases
```

#### Create Use Case
```typescript
POST /api/v1/usecases
```

**Request Body:**
```json
{
  "name": "UC001",
  "title": "Create Product Offering",
  "description": "Business user creates a new product offering",
  "actors": ["Business User", "Product Manager"],
  "preconditions": ["User is authenticated", "Product catalog exists"],
  "postconditions": ["Product offering is created", "Offering is available for sale"],
  "domainId": "domain-123",
  "capabilityId": "cap-456",
  "requirements": ["REQ-001", "REQ-002"]
}
```

### 5. Application Function Management

#### Get Application Functions
```typescript
GET /api/v1/application-functions
```

#### Create Application Function
```typescript
POST /api/v1/application-functions
```

**Request Body:**
```json
{
  "name": "ProductCatalogService",
  "description": "Service for managing product catalog operations",
  "type": "MICROSERVICE",
  "technology": "JAVA_SPRING",
  "domainId": "domain-123",
  "capabilityId": "cap-456",
  "interfaces": [
    {
      "name": "ProductCatalogAPI",
      "type": "REST_API",
      "version": "v1"
    }
  ],
  "dependencies": ["UserService", "PricingService"]
}
```

## Advanced Querying

### Filtering
```typescript
// Filter by multiple criteria
GET /api/v1/domains?type=TMF_ODA_DOMAIN&status=ACTIVE&page=1&size=50
```

### Sorting
```typescript
// Sort by creation date descending
GET /api/v1/capabilities?sort=createdAt:desc
```

### Including Related Data
```typescript
// Include capabilities with domains
GET /api/v1/domains?include=capabilities

// Include multiple relations
GET /api/v1/domains?include=capabilities,requirements,usecases
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req-123456"
  }
}
```

### Common Error Codes
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Invalid or missing authentication
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource conflict
- `422`: Unprocessable Entity - Validation error
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server error

## Rate Limiting

### Limits
- **Standard Plan**: 1000 requests per hour
- **Professional Plan**: 5000 requests per hour
- **Enterprise Plan**: 20000 requests per hour

### Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642233600
```

## Implementation Examples

### TypeScript Service Class
```typescript
export class BlueDolphinRestService {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  // Domain operations
  async getDomains(params?: {
    type?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<{ data: Domain[]; pagination: PaginationInfo }> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    return this.request(`/api/v1/domains?${queryParams}`);
  }

  async createDomain(domain: CreateDomainRequest): Promise<Domain> {
    return this.request('/api/v1/domains', {
      method: 'POST',
      body: JSON.stringify(domain)
    });
  }

  async updateDomain(id: string, domain: UpdateDomainRequest): Promise<Domain> {
    return this.request(`/api/v1/domains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(domain)
    });
  }

  async deleteDomain(id: string): Promise<void> {
    return this.request(`/api/v1/domains/${id}`, {
      method: 'DELETE'
    });
  }

  // Capability operations
  async getCapabilities(domainId: string): Promise<Capability[]> {
    return this.request(`/api/v1/domains/${domainId}/capabilities`);
  }

  async createCapability(
    domainId: string,
    capability: CreateCapabilityRequest
  ): Promise<Capability> {
    return this.request(`/api/v1/domains/${domainId}/capabilities`, {
      method: 'POST',
      body: JSON.stringify(capability)
    });
  }

  // Requirement operations
  async getRequirements(params?: {
    domainId?: string;
    capabilityId?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<{ data: Requirement[]; pagination: PaginationInfo }> {
    const queryParams = new URLSearchParams();
    if (params?.domainId) queryParams.append('domainId', params.domainId);
    if (params?.capabilityId) queryParams.append('capabilityId', params.capabilityId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    return this.request(`/api/v1/requirements?${queryParams}`);
  }

  async createRequirement(requirement: CreateRequirementRequest): Promise<Requirement> {
    return this.request('/api/v1/requirements', {
      method: 'POST',
      body: JSON.stringify(requirement)
    });
  }
}
```

### React Hook for Data Fetching
```typescript
import { useState, useEffect } from 'react';
import { blueDolphinService } from '@/lib/blue-dolphin-rest-service';

export function useBlueDolphinDomains() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDomains() {
      try {
        setLoading(true);
        const response = await blueDolphinService.getDomains({
          type: 'TMF_ODA_DOMAIN',
          status: 'ACTIVE'
        });
        setDomains(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch domains');
      } finally {
        setLoading(false);
      }
    }

    fetchDomains();
  }, []);

  return { domains, loading, error };
}
```

## Best Practices

### 1. Error Handling
- Always check response status codes
- Implement retry logic for transient errors
- Log errors with request context
- Provide user-friendly error messages

### 2. Rate Limiting
- Implement exponential backoff for retries
- Cache responses to reduce API calls
- Use batch operations when possible
- Monitor rate limit headers

### 3. Data Validation
- Validate input data before sending requests
- Handle partial responses gracefully
- Implement data transformation layers
- Use TypeScript for type safety

### 4. Performance
- Implement request caching
- Use pagination for large datasets
- Optimize network requests
- Monitor API response times

## Testing

### Unit Tests
```typescript
import { BlueDolphinRestService } from '@/lib/blue-dolphin-rest-service';

describe('BlueDolphinRestService', () => {
  let service: BlueDolphinRestService;

  beforeEach(() => {
    service = new BlueDolphinRestService(
      'https://public-api.eu.bluedolphin.app',
      'test-api-key'
    );
  });

  it('should create a domain successfully', async () => {
    const domainData = {
      name: 'Test Domain',
      description: 'Test domain description',
      type: 'TMF_ODA_DOMAIN'
    };

    const result = await service.createDomain(domainData);
    expect(result.name).toBe(domainData.name);
    expect(result.id).toBeDefined();
  });
});
```

### Integration Tests
```typescript
describe('Blue Dolphin Integration', () => {
  it('should sync domains from E2E to Blue Dolphin', async () => {
    // Test complete integration flow
    const e2eDomains = await getE2EDomains();
    const syncResults = await syncDomainsToBlueDolphin(e2eDomains);
    
    expect(syncResults.success).toBe(true);
    expect(syncResults.syncedCount).toBe(e2eDomains.length);
  });
});
```

## References

- [Blue Dolphin API Documentation](https://support.valueblue.nl/hc/en-us/categories/13253352426140-API-Documentation)
- [Swagger API Reference](https://public-api.eu.bluedolphin.app/swagger/index.html)
- [REST API Best Practices](https://restfulapi.net/)
