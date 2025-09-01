# Blue Dolphin OData Integration Guide

## Overview

This guide provides comprehensive documentation for integrating with Blue Dolphin using the OData v4 feed. OData offers powerful querying capabilities with standardized filtering, sorting, and expansion operations.

## OData Feed Configuration

### Base Endpoint
```
https://public-api.eu.bluedolphin.app/odata/v4
```

### Authentication
```typescript
// API Key Authentication
const headers = {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Accept': 'application/json',
  'OData-MaxVersion': '4.0',
  'OData-Version': '4.0'
};

// Basic Authentication (Alternative)
const headers = {
  'Authorization': 'Basic ' + btoa('username:password'),
  'Accept': 'application/json',
  'OData-MaxVersion': '4.0',
  'OData-Version': '4.0'
};
```

## Enhanced Object Retrieval with MoreColumns

### MoreColumns Parameter
The `MoreColumns=true` parameter enables retrieval of additional metadata columns that are not included in the standard object response. This is equivalent to the Excel Power Query `MoreColumns=true` functionality.

#### Basic MoreColumns Usage
```typescript
// Enable additional columns
GET /odata/v4/Objects?MoreColumns=true

// With filtering and selection
GET /odata/v4/Objects?$filter=Definition eq 'Application Component'&MoreColumns=true&$top=100
```

#### ⚠️ CRITICAL: Field Selection Conflict
**Important Discovery**: When using `MoreColumns=true`, the `$select` parameter is **ignored** by the Blue Dolphin service. The service will return all available fields including enhanced ones.

**Incorrect Usage (Will Not Work):**
```typescript
// This will NOT return enhanced fields - $select overrides MoreColumns
GET /odata/v4/Objects?$select=Id,Title&MoreColumns=true
```

**Correct Usage:**
```typescript
// This WILL return enhanced fields - no $select parameter
GET /odata/v4/Objects?MoreColumns=true&$top=100

// Or use filtering without $select
GET /odata/v4/Objects?$filter=Definition eq 'Business Process'&MoreColumns=true&$top=10
```

#### Expanded More Columns Properties
When `MoreColumns=true` is enabled, the following additional properties become available:

##### Object Properties
- `Object_Properties_Name` - Object name property
- `Object_Properties_AMEFF_Import_Identifier` - AMEFF import identifier
- `Object_Properties_Deliverable_Object_Status` - Deliverable status
- `Object_Properties_User_Interface_Integration` - UI integration details
- `Object_Properties_Needs_Localization` - Localization requirements
- `Object_Properties_Needs_Specialization` - Specialization requirements
- `Object_Properties_Needs_External_Integration` - External integration needs
- `Object_Properties_Documentation` - Documentation links
- `Object_Properties_Provided_by` - Provider information
- `Object_Properties_Supplied_By` - Supplier information
- `Object_Properties_Questions` - Related questions
- `Object_Properties_Action_Items` - Action items
- `Object_Properties_Base_Implementation_Costs` - Implementation costs

##### Deliverable Status Properties
- `Deliverable_Object_Status_Status` - Current deliverable status
- `Deliverable_Object_Status_Architectural_Decision_Log` - ADL information

##### AMEFF Properties
- `Ameff_properties_Reportx3AModelx3ACoverx3ABackground` - Model cover background
- `Ameff_properties_Reportx3AModelx3AHeaderx3ABackground` - Model header background
- `Ameff_properties_Reportx3AModelx3AHidex3AApplication` - Hide application in reports
- `Ameff_properties_Reportx3AModelx3AHidex3ABusiness` - Hide business in reports
- `Ameff_properties_Reportx3AModelx3AHidex3AImplementationx26Migration` - Hide implementation/migration
- `Ameff_properties_Reportx3AModelx3AHidex3AMotivation` - Hide motivation in reports
- `Ameff_properties_Reportx3AModelx3AHidex3AOther` - Hide other elements
- `Ameff_properties_Reportx3AModelx3AHidex3ARelations` - Hide relations in reports
- `Ameff_properties_Reportx3AModelx3AHidex3ATechnologyx26Physical` - Hide technology/physical
- `Ameff_properties_Reportx3AModelx3AHidex3AViewNumbering` - Hide view numbering
- `Ameff_properties_Reportx3AModelx3AHidex3AViews` - Hide views in reports
- `Ameff_properties_Reportx3AViewx3ADetailed` - Detailed view settings
- `Ameff_properties_Reportx3AViewx3AHide` - Hide view settings
- `Ameff_properties_Reportx3AViewx3AHidex3ADiagram` - Hide diagram in views
- `Ameff_properties_Reportx3AViewx3ATag` - View tag settings
- `Ameff_properties_Documentation` - Documentation settings
- `Ameff_properties_Hide_Business` - Hide business elements
- `Ameff_properties_Hide_Application` - Hide application elements
- `Ameff_properties_Hide_Technology` - Hide technology elements
- `Ameff_properties_Hide_Motivation` - Hide motivation elements
- `Ameff_properties_Show_Views` - Show views setting
- `Ameff_properties_Domain` - Domain information
- `Ameff_properties_Category` - Category information
- `Ameff_properties_Source_ID` - Source identifier
- `Ameff_properties_Compliance` - Compliance information

##### Resource and Rate Properties
- `Resource_x26_Rate_Role_required_to_deliver_this_servicex3F` - Required delivery role
- `Resource_x26_Rate_Rate` - Resource rate information

##### External Design Properties
- `External_Design_Description_Service` - External service description
- `External_Design_User_Interface` - External UI design

#### CLI Testing Results

Our command-line testing confirmed the following:

**Test 1: Standard Query (Baseline)**
```bash
curl "https://csgipoc.odata.bluedolphin.app/Objects?$top=2&$select=Id,Title,Definition,Status"
```
**Result**: Basic fields only (4 fields)

**Test 2: MoreColumns=true with Select Fields**
```bash
curl "https://csgipoc.odata.bluedolphin.app/Objects?$top=2&$select=Id,Title,Definition,Status&MoreColumns=true"
```
**Result**: Same as baseline - **MoreColumns parameter ignored when $select is specified**

**Test 3: MoreColumns=true without Select Fields**
```bash
curl "https://csgipoc.odata.bluedolphin.app/Objects?$top=2&MoreColumns=true"
```
**Result**: **Significantly enhanced response with 45+ additional fields**

**Test 4: MoreColumns=true with Object Type Filter**
```bash
curl "https://csgipoc.odata.bluedolphin.app/Objects?$filter=Definition eq 'Business Process'&$top=2&MoreColumns=true"
```
**Result**: **Maximum enhanced fields available for Business Process objects**

#### Implementation Example
```typescript
// Enhanced object retrieval with MoreColumns support
const enhancedObjectsRequest = {
  action: 'get-objects-enhanced',
  config: blueDolphinConfig,
  data: {
    endpoint: '/Objects',
    filter: "Definition eq 'Business Process'", // Use Business Process for max fields
    top: 100,
    // NOTE: Do NOT include select parameter when using MoreColumns=true
    moreColumns: true // Enable additional columns
  }
};
```

#### Response Structure with MoreColumns
```json
{
  "@odata.context": "https://csgipoc.odata.bluedolphin.app/$metadata#Objects",
  "value": [
    {
      "ID": "602a773bad3fc03ba4564bc0",
      "Title": "(c) Business Process",
      "Definition": "Business Process",
      "Status": "Archived",
      "Workspace": "CSG International",
      "Object_Properties_Name": "",
      "Object_Properties_AMEFF_Import_Identifier": "id-602a773bad3fc03ba4564bc0",
      "Deliverable_Object_Status_Status": "",
      "Object_Properties_Deliverable_Object_Status": "",
      "Object_Properties_User_Interface_Integration": "",
      "Ameff_properties_Domain": "",
      "Ameff_properties_Category": "",
      "Ameff_properties_Source_ID": "",
      "Ameff_properties_Compliance": "",
      "Ameff_properties_Reportx3AModelx3ACoverx3ABackground": "",
      "Ameff_properties_Reportx3AModelx3AHeaderx3ABackground": "",
      "Ameff_properties_Reportx3AModelx3AHidex3AApplication": "",
      "Ameff_properties_Reportx3AModelx3AHidex3ABusiness": "",
      "Ameff_properties_Reportx3AModelx3AHidex3AImplementationx26Migration": "",
      "Ameff_properties_Reportx3AModelx3AHidex3AMotivation": "",
      "Ameff_properties_Reportx3AModelx3AHidex3AOther": "",
      "Ameff_properties_Reportx3AModelx3AHidex3ARelations": "",
      "Ameff_properties_Reportx3AModelx3AHidex3ATechnologyx26Physical": "",
      "Ameff_properties_Reportx3AModelx3AHidex3AViewNumbering": "",
      "Ameff_properties_Reportx3AModelx3AHidex3AViews": "",
      "Ameff_properties_Reportx3AViewx3ADetailed": "",
      "Ameff_properties_Reportx3AViewx3AHide": "",
      "Ameff_properties_Reportx3AViewx3AHidex3ADiagram": "",
      "Ameff_properties_Reportx3AViewx3ATag": "",
      "Ameff_properties_Documentation": "",
      "Ameff_properties_Hide_Business": "",
      "Ameff_properties_Hide_Application": "",
      "Ameff_properties_Hide_Technology": "",
      "Ameff_properties_Hide_Motivation": "",
      "Ameff_properties_Show_Views": ""
    }
  ]
}
```

### Comparison: Current vs Enhanced Implementation

#### Current Implementation (Limited Fields)
```typescript
select: [
  'Id', 'Title', 'Definition', 'Description', 'ArchimateType', 
  'Status', 'CreatedOn', 'ChangedOn', 'Workspace'
]
```

#### Enhanced Implementation (With MoreColumns)
```typescript
// When using MoreColumns=true, DO NOT use $select parameter
// The service will return all available fields including enhanced ones
// Total field count: 45+ fields vs 9 standard fields
```

### Benefits of Enhanced Implementation

1. **Richer Data Model** - Access to comprehensive object metadata (45+ fields vs 9)
2. **Better Reporting** - More fields for analysis and reporting
3. **Enhanced Filtering** - Filter by additional properties like compliance, report settings
4. **Improved UI** - Display more relevant information to users
5. **Better Integration** - More data points for external system integration

### Implementation Considerations

1. **Performance Impact** - More fields may increase response size (confirmed via CLI testing)
2. **Data Mapping** - Need to update UI components to display new fields
3. **Error Handling** - Some fields may be null or undefined
4. **Backward Compatibility** - Maintain existing functionality while adding new features
5. **Field Selection Conflict** - **CRITICAL**: Cannot use `$select` with `MoreColumns=true`
6. **Data Quality** - Many enhanced fields are empty strings but available for population
7. **Object Type Variation** - Different object types have different enhanced field availability

### CLI Testing Summary

Our command-line testing has confirmed:

- ✅ `MoreColumns=true` parameter works and provides 45+ additional fields
- ✅ Enhanced fields match the Excel Power Query capabilities
- ⚠️ Field selection conflicts exist (cannot use `$select` with `MoreColumns=true`)
- ⚠️ Many enhanced fields are empty but available for population
- 📊 Performance impact is measurable but acceptable for the data richness gained
- 🔍 Business Process objects show the most comprehensive enhanced field set

## Core OData Endpoints

### 1. Domain Management

#### Get All Domains
```typescript
GET /odata/v4/Domains
```

**Response:**
```json
{
  "@odata.context": "https://public-api.eu.bluedolphin.app/odata/v4/$metadata#Domains",
  "value": [
    {
      "Id": "domain-123",
      "Name": "Market & Sales",
      "Description": "Market and Sales domain for TMF ODA",
      "Type": "TMF_ODA_DOMAIN",
      "Status": "ACTIVE",
      "CreatedAt": "2024-01-15T10:30:00Z",
      "UpdatedAt": "2024-01-15T10:30:00Z",
      "Metadata": {
        "TmfVersion": "4.0",
        "Category": "CORE_DOMAIN"
      }
    }
  ]
}
```

#### Get Domain by ID
```typescript
GET /odata/v4/Domains('domain-123')
```

#### Filter Domains
```typescript
// Filter by type
GET /odata/v4/Domains?$filter=Type eq 'TMF_ODA_DOMAIN'

// Filter by status
GET /odata/v4/Domains?$filter=Status eq 'ACTIVE'

// Complex filter
GET /odata/v4/Domains?$filter=Type eq 'TMF_ODA_DOMAIN' and Status eq 'ACTIVE'
```

#### Select Specific Fields
```typescript
GET /odata/v4/Domains?$select=Id,Name,Description,Type
```

#### Order Results
```typescript
GET /odata/v4/Domains?$orderby=Name asc
GET /odata/v4/Domains?$orderby=CreatedAt desc
```

#### Pagination
```typescript
GET /odata/v4/Domains?$top=20&$skip=40
```

### 2. Capability Management

#### Get Capabilities
```typescript
GET /odata/v4/Capabilities
```

#### Get Capabilities by Domain
```typescript
GET /odata/v4/Domains('domain-123')/Capabilities
```

#### Filter Capabilities
```typescript
// Filter by domain
GET /odata/v4/Capabilities?$filter=DomainId eq 'domain-123'

// Filter by level
GET /odata/v4/Capabilities?$filter=Level eq 'LEVEL_1'

// Complex filter
GET /odata/v4/Capabilities?$filter=DomainId eq 'domain-123' and Level eq 'LEVEL_1'
```

#### Expand Related Data
```typescript
// Include domain information with capabilities
GET /odata/v4/Capabilities?$expand=Domain

// Include multiple relations
GET /odata/v4/Capabilities?$expand=Domain,Requirements,UseCases
```

### 3. Requirement Management

#### Get Requirements
```typescript
GET /odata/v4/Requirements
```

#### Filter Requirements
```typescript
// Filter by domain
GET /odata/v4/Requirements?$filter=DomainId eq 'domain-123'

// Filter by capability
GET /odata/v4/Requirements?$filter=CapabilityId eq 'cap-456'

// Filter by type
GET /odata/v4/Requirements?$filter=Type eq 'FUNCTIONAL_REQUIREMENT'

// Filter by priority
GET /odata/v4/Requirements?$filter=Priority eq 'HIGH'
```

#### Complex Queries
```typescript
// Multiple filters with ordering
GET /odata/v4/Requirements?$filter=DomainId eq 'domain-123' and Priority eq 'HIGH'&$orderby=CreatedAt desc&$top=50

// Search in description
GET /odata/v4/Requirements?$filter=contains(Description, 'product catalog')
```

### 4. Use Case Management

#### Get Use Cases
```typescript
GET /odata/v4/UseCases
```

#### Filter Use Cases
```typescript
// Filter by domain
GET /odata/v4/UseCases?$filter=DomainId eq 'domain-123'

// Filter by actors
GET /odata/v4/UseCases?$filter=contains(Actors, 'Business User')
```

#### Expand Use Case Details
```typescript
// Include related requirements
GET /odata/v4/UseCases?$expand=Requirements

// Include domain and capability
GET /odata/v4/UseCases?$expand=Domain,Capability,Requirements
```

### 5. Application Function Management

#### Get Application Functions
```typescript
GET /odata/v4/ApplicationFunctions
```

#### Filter Application Functions
```typescript
// Filter by type
GET /odata/v4/ApplicationFunctions?$filter=Type eq 'MICROSERVICE'

// Filter by technology
GET /odata/v4/ApplicationFunctions?$filter=Technology eq 'JAVA_SPRING'
```

## Advanced OData Querying

### 1. Complex Filtering

#### Logical Operators
```typescript
// AND operator
GET /odata/v4/Domains?$filter=Type eq 'TMF_ODA_DOMAIN' and Status eq 'ACTIVE'

// OR operator
GET /odata/v4/Capabilities?$filter=Level eq 'LEVEL_1' or Level eq 'LEVEL_2'

// NOT operator
GET /odata/v4/Requirements?$filter=not(Status eq 'ARCHIVED')
```

#### Comparison Operators
```typescript
// Equals
GET /odata/v4/Domains?$filter=Type eq 'TMF_ODA_DOMAIN'

// Not equals
GET /odata/v4/Capabilities?$filter=Level ne 'LEVEL_3'

// Greater than
GET /odata/v4/Requirements?$filter=Priority gt 'MEDIUM'

// Less than or equal
GET /odata/v4/Requirements?$filter=CreatedAt le 2024-01-15T00:00:00Z
```

#### String Functions
```typescript
// Contains
GET /odata/v4/Requirements?$filter=contains(Description, 'catalog')

// Starts with
GET /odata/v4/Domains?$filter=startswith(Name, 'Product')

// Ends with
GET /odata/v4/Capabilities?$filter=endswith(Name, 'Management')

// Length
GET /odata/v4/Requirements?$filter=length(Description) gt 100
```

### 2. Aggregation Functions

#### Count
```typescript
// Count all domains
GET /odata/v4/Domains/$count

// Count filtered results
GET /odata/v4/Domains/$count?$filter=Type eq 'TMF_ODA_DOMAIN'
```

#### Group By
```typescript
// Group capabilities by level
GET /odata/v4/Capabilities?$apply=groupby((Level), aggregate(Id with countdistinct as TotalCapabilities))
```

### 3. Search and Full-Text Search

#### Search Across Multiple Fields
```typescript
// Search in name and description
GET /odata/v4/Domains?$filter=contains(Name, 'Product') or contains(Description, 'Product')
```

#### Full-Text Search (if supported)
```typescript
// Full-text search
GET /odata/v4/Requirements?$search='product catalog management'
```

## Implementation Examples

### TypeScript OData Client

```typescript
export class BlueDolphinODataService {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0'
    };

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OData Error: ${error.error?.message || response.statusText}`);
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
  }): Promise<{ value: Domain[] }> {
    const queryParams = new URLSearchParams();
    
    if (options?.filter) queryParams.append('$filter', options.filter);
    if (options?.select) queryParams.append('$select', options.select.join(','));
    if (options?.orderby) queryParams.append('$orderby', options.orderby);
    if (options?.top) queryParams.append('$top', options.top.toString());
    if (options?.skip) queryParams.append('$skip', options.skip.toString());
    if (options?.expand) queryParams.append('$expand', options.expand.join(','));

    const queryString = queryParams.toString();
    const endpoint = `/odata/v4/Domains${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  async getDomainById(id: string, expand?: string[]): Promise<Domain> {
    const queryParams = new URLSearchParams();
    if (expand) queryParams.append('$expand', expand.join(','));
    
    const queryString = queryParams.toString();
    const endpoint = `/odata/v4/Domains('${id}')${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  async getCapabilities(options?: {
    domainId?: string;
    filter?: string;
    select?: string[];
    orderby?: string;
    top?: number;
    skip?: number;
    expand?: string[];
  }): Promise<{ value: Capability[] }> {
    const queryParams = new URLSearchParams();
    
    if (options?.domainId) {
      queryParams.append('$filter', `DomainId eq '${options.domainId}'`);
    }
    if (options?.filter) {
      const existingFilter = queryParams.get('$filter');
      queryParams.set('$filter', existingFilter ? `${existingFilter} and ${options.filter}` : options.filter);
    }
    if (options?.select) queryParams.append('$select', options.select.join(','));
    if (options?.orderby) queryParams.append('$orderby', options.orderby);
    if (options?.top) queryParams.append('$top', options.top.toString());
    if (options?.skip) queryParams.append('$skip', options.skip.toString());
    if (options?.expand) queryParams.append('$expand', options.expand.join(','));

    const queryString = queryParams.toString();
    const endpoint = `/odata/v4/Capabilities${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  async getRequirements(options?: {
    domainId?: string;
    capabilityId?: string;
    filter?: string;
    select?: string[];
    orderby?: string;
    top?: number;
    skip?: number;
    expand?: string[];
  }): Promise<{ value: Requirement[] }> {
    const queryParams = new URLSearchParams();
    
    const filters: string[] = [];
    if (options?.domainId) filters.push(`DomainId eq '${options.domainId}'`);
    if (options?.capabilityId) filters.push(`CapabilityId eq '${options.capabilityId}'`);
    if (options?.filter) filters.push(options.filter);
    
    if (filters.length > 0) {
      queryParams.append('$filter', filters.join(' and '));
    }
    
    if (options?.select) queryParams.append('$select', options.select.join(','));
    if (options?.orderby) queryParams.append('$orderby', options.orderby);
    if (options?.top) queryParams.append('$top', options.top.toString());
    if (options?.skip) queryParams.append('$skip', options.skip.toString());
    if (options?.expand) queryParams.append('$expand', options.expand.join(','));

    const queryString = queryParams.toString();
    const endpoint = `/odata/v4/Requirements${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  async getUseCases(options?: {
    domainId?: string;
    filter?: string;
    select?: string[];
    orderby?: string;
    top?: number;
    skip?: number;
    expand?: string[];
  }): Promise<{ value: UseCase[] }> {
    const queryParams = new URLSearchParams();
    
    if (options?.domainId) {
      queryParams.append('$filter', `DomainId eq '${options.domainId}'`);
    }
    if (options?.filter) {
      const existingFilter = queryParams.get('$filter');
      queryParams.set('$filter', existingFilter ? `${existingFilter} and ${options.filter}` : options.filter);
    }
    if (options?.select) queryParams.append('$select', options.select.join(','));
    if (options?.orderby) queryParams.append('$orderby', options.orderby);
    if (options?.top) queryParams.append('$top', options.top.toString());
    if (options?.skip) queryParams.append('$skip', options.skip.toString());
    if (options?.expand) queryParams.append('$expand', options.expand.join(','));

    const queryString = queryParams.toString();
    const endpoint = `/odata/v4/UseCases${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  // Count operations
  async getDomainCount(filter?: string): Promise<number> {
    const queryParams = new URLSearchParams();
    if (filter) queryParams.append('$filter', filter);
    
    const queryString = queryParams.toString();
    const endpoint = `/odata/v4/Domains/$count${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  async getCapabilityCount(filter?: string): Promise<number> {
    const queryParams = new URLSearchParams();
    if (filter) queryParams.append('$filter', filter);
    
    const queryString = queryParams.toString();
    const endpoint = `/odata/v4/Capabilities/$count${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }
}
```

### React Hook for OData Queries

```typescript
import { useState, useEffect } from 'react';
import { blueDolphinODataService } from '@/lib/blue-dolphin-odata-service';

export function useBlueDolphinOData<T>(
  entitySet: string,
  options?: {
    filter?: string;
    select?: string[];
    orderby?: string;
    top?: number;
    skip?: number;
    expand?: string[];
  }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
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
        
        // Get total count if needed
        if (options?.top || options?.skip) {
          const count = await blueDolphinODataService.getDomainCount(options?.filter);
          setTotalCount(count);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [entitySet, JSON.stringify(options)]);

  return { data, loading, error, totalCount };
}
```

## Advanced Query Examples

### 1. Complex Domain Queries

```typescript
// Get all TMF ODA domains with their capabilities
const domainsWithCapabilities = await blueDolphinODataService.getDomains({
  filter: "Type eq 'TMF_ODA_DOMAIN' and Status eq 'ACTIVE'",
  expand: ['Capabilities'],
  orderby: 'Name asc'
});

// Get domains created in the last 30 days
const recentDomains = await blueDolphinODataService.getDomains({
  filter: "CreatedAt gt 2024-01-01T00:00:00Z",
  select: ['Id', 'Name', 'CreatedAt'],
  orderby: 'CreatedAt desc'
});
```

### 2. Capability Analysis

```typescript
// Get all capabilities for a specific domain with requirements
const domainCapabilities = await blueDolphinODataService.getCapabilities({
  domainId: 'domain-123',
  expand: ['Requirements', 'UseCases'],
  orderby: 'Level asc, Name asc'
});

// Get high-priority capabilities
const highPriorityCapabilities = await blueDolphinODataService.getCapabilities({
  filter: "Level eq 'LEVEL_1' or Level eq 'LEVEL_2'",
  select: ['Id', 'Name', 'Level', 'DomainId']
});
```

### 3. Requirement Mapping

```typescript
// Get requirements for a specific capability
const capabilityRequirements = await blueDolphinODataService.getRequirements({
  capabilityId: 'cap-456',
  filter: "Status eq 'ACTIVE'",
  expand: ['UseCases'],
  orderby: 'Priority desc'
});

// Get requirements containing specific keywords
const searchRequirements = await blueDolphinODataService.getRequirements({
  filter: "contains(Description, 'product catalog') or contains(Name, 'catalog')",
  select: ['Id', 'Name', 'Description', 'Priority', 'DomainId', 'CapabilityId']
});
```

### 4. Use Case Analysis

```typescript
// Get use cases for a domain with all related data
const domainUseCases = await blueDolphinODataService.getUseCases({
  domainId: 'domain-123',
  expand: ['Domain', 'Capability', 'Requirements'],
  orderby: 'Name asc'
});

// Get use cases with specific actors
const businessUserUseCases = await blueDolphinODataService.getUseCases({
  filter: "contains(Actors, 'Business User')",
  select: ['Id', 'Name', 'Title', 'Actors', 'DomainId']
});
```

## Performance Optimization

### 1. Query Optimization

```typescript
// Use $select to limit returned fields
const lightweightDomains = await blueDolphinODataService.getDomains({
  select: ['Id', 'Name', 'Type'],
  filter: "Type eq 'TMF_ODA_DOMAIN'"
});

// Use pagination for large datasets
const paginatedCapabilities = await blueDolphinODataService.getCapabilities({
  top: 50,
  skip: 100,
  orderby: 'Name asc'
});
```

### 2. Caching Strategy

```typescript
class BlueDolphinODataCache {
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
```

## Error Handling

### OData Error Response
```json
{
  "error": {
    "code": "ODataError",
    "message": "Invalid query parameter",
    "details": [
      {
        "code": "InvalidFilterClause",
        "message": "The filter clause is invalid",
        "target": "$filter"
      }
    ]
  }
}
```

### Error Handling in Service
```typescript
private handleODataError(error: any): never {
  if (error.error?.code === 'InvalidFilterClause') {
    throw new Error(`Invalid filter: ${error.error.message}`);
  }
  
  if (error.error?.code === 'ResourceNotFound') {
    throw new Error('Resource not found');
  }
  
  throw new Error(`OData Error: ${error.error?.message || 'Unknown error'}`);
}
```

## Best Practices

### 1. Query Optimization
- Use `$select` to limit returned fields
- Implement pagination for large datasets
- Use appropriate filters to reduce data transfer
- Cache frequently accessed data

### 2. Error Handling
- Handle OData-specific error codes
- Implement retry logic for transient errors
- Provide meaningful error messages
- Log errors with query context

### 3. Performance
- Monitor query execution times
- Use batch operations when possible
- Implement request caching
- Optimize filter expressions

### 4. Security
- Validate all query parameters
- Sanitize user input
- Use appropriate authentication
- Monitor API usage

## References

- [Blue Dolphin OData Feed Documentation](https://support.valueblue.nl/hc/en-us/articles/10898596310812-Using-the-OData-Feed)
- [OData v4 Specification](https://docs.oasis-open.org/odata/odata/v4.0/os/part1-protocol/odata-v4.0-os-part1-protocol.html)
- [OData Query Language](https://docs.oasis-open.org/odata/odata/v4.0/os/part2-url-conventions/odata-v4.0-os-part2-url-conventions.html)

---

## Relations (OData) and ArchiMate Alignment

While objects are fetched from `/odata/v4/Objects` (v4), the Excel feed for relationships (Relations_table) is accessible at the legacy feed root and responds to **OData v2.0** semantics:

- Base: `https://csgipoc.odata.bluedolphin.app/Relations`
- Headers: `Accept: application/json`, `OData-Version: 2.0`, `OData-MaxVersion: 2.0`
- Auth: Basic (same credentials as Objects)
- Supports `MoreColumns=true`

### Key Relationship Fields
- `RelationshipId` (stable relationship identifier)
- `BlueDolphinObjectItemId` (source object ID)
- `RelatedBlueDolphinObjectItemId` (target object ID)
- `RelationshipDefinitionName` (e.g., Composition, Flow, Association, Realization, Serving, Access)
- `BlueDolphinObjectDefinitionName` / `RelatedBlueDolphinObjectDefinitionName` (object types)
- `Type` (composition | flow | association | realization | access | usedby)
- `Name` (label reflecting direction: composed of/in, flow to/from, serves/served by, etc.)
- `IsRelationshipDirectionAlternative` (direction indicator)

### Directional Pairing
Rows often appear as forward/backward pairs (same `RelationshipId`) with swapped object IDs and complementary names (e.g., composed of ↔ composed in).

### ArchiMate Mapping (from e2e_architecture_context_full.md)
- `Type=composition` → ArchiMate Composition (Structural)
- `Type=flow` → Flow (Dynamic)
- `Type=association` → Association (Structural)
- `Type=realization` → Realization (Structural)
- `Type=access` → Access (Dependency)
- `Type=usedby` ↔ Serving (Dependency) — labels: serves / served by

Object definition names map to ArchiMate elements/layers:
- Application: Application Component, Application Interface, Data Object
- Strategy: Capability
- Motivation: Principle, Goal
- Business: Business Process
- Technology: Technology Service, Node

### Validated Filters (Relations)
- `RelationshipDefinitionName`
- `BlueDolphinObjectDefinitionName`
- `RelatedBlueDolphinObjectWorkspaceName`
- `RelatedBlueDolphinObjectDefinitionName`
- `Type`
- `Name`

Example (PowerShell):
```powershell
$h = @{ 'Accept'='application/json'; 'OData-Version'='2.0'; 'OData-MaxVersion'='2.0'; 'Authorization'='Basic <BASE64>' }
(Invoke-WebRequest -Uri "https://csgipoc.odata.bluedolphin.app/Relations?`$filter=Type eq 'composition'&`$top=5&MoreColumns=true" -Headers $h).Content
```

### Enrichment Pattern
Use `BlueDolphinObjectItemId` and `RelatedBlueDolphinObjectItemId` to fetch object details from `/Objects` and enrich relationship records for UI/analysis. Consolidate by `RelationshipId` when presenting bidirectional relationships.