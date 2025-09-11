# CET v22.0 Data Structure Analysis

## Sheet Inventory & Classification

### 1. **Configuration Sheets** (3 sheets)

- **Instructions**: User guidance and navigation
- **Attributes**: Main project configuration (293 rows)
- **Summary**: Consolidated project overview

### 2. **Demand Planning Sheets** (8 sheets)

- **Ph1Demand**: Phase 1 resource demands
- **Ph2Demand**: Phase 2 resource demands
- **Ph3Demand**: Phase 3 resource demands
- **Ph4Demand**: Phase 4 resource demands
- **GovDemand**: Governance resource demands
- **ENCDemand**: Encompass product demands
- **ASCDemand**: Ascendon product demands
- **CMADemand**: CMA product demands

### 3. **Product Configuration Sheets** (5 sheets)

- **Governance**: Governance framework settings
- **Encompass**: Encompass BSS configuration
- **Ascendon**: Ascendon BSS configuration
- **CMA**: Customer Management & Analytics
- **ManagedService**: Managed services configuration

### 4. **Reference Data Sheets** (6 sheets)

- **JobProfiles**: Resource roles and cost structures
- **LookupValues**: System configuration values
- **Deal Types Definition**: Commercial model definitions
- **GovRefData**: Governance reference data
- **ENCRefData**: Encompass reference data
- **ASCRefData**: Ascendon reference data
- **CMARefData**: CMA reference data
- **MSRefData**: Managed Service reference data

### 5. **Utility Sheets** (2 sheets)

- **TurboProformaInput**: Financial modeling input
- **Sheet2**: Additional data storage

## Data Structure Patterns

### Resource Demand Structure

```typescript
interface CETResourceDemand {
  weekNumber: number; // Week identifier
  weekDate: string; // Date representation
  jobProfile: string; // Role identifier
  effortHours: number; // Effort in hours
  resourceCount: number; // Number of resources
  productType: string; // Product classification
  phaseNumber: number; // Phase identifier (1-4)
  complexityLevel?: string; // Optional complexity rating
}
```

### Job Profile Structure

```typescript
interface CETJobProfile {
  id: string; // Unique identifier
  productService: string; // Service classification
  projectTeam: string; // Team assignment
  projectRole: string; // Role description
  salesRegion: string; // Geographic region
  salesTerritory: string; // Sales territory
  supervisoryOrganization: string; // Organizational structure
  workdayJobProfile: string; // HR system mapping
  resourceLevel: string; // Seniority level
  resourceCostRegion: string; // Cost center
  demandLocationCountryCode: string; // Country code
  workerType: string; // Employment type
}
```

### Project Configuration Structure

```typescript
interface CETProjectConfig {
  customerName: string; // Client identifier
  projectName: string; // Project identifier
  digitalTelco: string; // Telco classification
  region: string; // Geographic region
  language: string; // Language preference
  sfdcType: string; // Salesforce type
  createdDate: string; // Creation timestamp
  status: string; // Project status
}
```

## Data Relationships & Dependencies

### 1. **Hierarchical Structure**

```
Project
├── Phases (1-4)
│   ├── Resource Demands
│   │   ├── Job Profiles
│   │   └── Effort Allocation
│   └── Product Configurations
│       ├── Governance
│       ├── Encompass
│       ├── Ascendon
│       ├── CMA
│       └── Managed Service
└── Reference Data
    ├── Job Profiles
    ├── Lookup Values
    └── Deal Types
```

### 2. **Cross-Reference Mappings**

- **Job Profiles** ↔ **Resource Demands** (via role matching)
- **Product Configurations** ↔ **Phase Demands** (via product type)
- **Reference Data** ↔ **Configuration Sheets** (via lookup keys)

### 3. **Data Validation Rules**

- Week numbers must be sequential within phases
- Effort hours must be positive numbers
- Resource counts must be whole numbers
- Product types must match reference data
- Phase numbers must be 1-4

## Data Quality Assessment

### Strengths

- **Consistent Structure**: All demand sheets follow same format
- **Comprehensive Coverage**: Covers all major delivery phases
- **Detailed Granularity**: Week-by-week resource planning
- **Reference Integrity**: Strong lookup table relationships

### Areas for Improvement

- **Data Validation**: Limited built-in validation rules
- **Error Handling**: No explicit error reporting
- **Version Control**: No version tracking mechanism
- **Audit Trail**: Limited change tracking

## Integration Data Requirements

### Required Fields for Mapping

1. **Project Identification**
   - Customer name
   - Project name
   - Digital telco classification
   - Geographic region

2. **Resource Planning**
   - Job profile definitions
   - Effort hour allocations
   - Resource count requirements
   - Phase assignments

3. **Timeline Management**
   - Week numbering system
   - Phase boundaries
   - Duration calculations
   - Milestone dependencies

4. **Cost Estimation**
   - Resource cost regions
   - Effort multipliers
   - Complexity factors
   - Risk adjustments

## Data Transformation Rules

### 1. **Effort Distribution**

```
Total Phase Effort = Σ(Week Effort × Resource Count)
Role Effort = Total Effort × Role Percentage
```

### 2. **Phase Duration**

```
Phase Duration = Max(Week Number) - Min(Week Number) + 1
Phase Start = Project Start + (Min(Week Number) - 1) × 7 days
Phase End = Phase Start + (Phase Duration × 7 days)
```

### 3. **Resource Allocation**

```
Peak Resources = Max(Weekly Resource Count)
Average Resources = Total Resources / Phase Duration
Resource Utilization = Effort Hours / (Resources × 40 hours/week)
```

## Data Export Formats

### 1. **JSON Structure**

```json
{
  "project": { ... },
  "phases": [ ... ],
  "resources": [ ... ],
  "products": [ ... ],
  "estimates": { ... }
}
```

### 2. **CSV Export**

- Phase-based resource demands
- Job profile definitions
- Product configurations
- Cost estimates

### 3. **API Integration**

- RESTful endpoints for data access
- GraphQL queries for complex relationships
- WebSocket updates for real-time changes

---

_This data structure analysis provides the foundation for building robust data transformation and integration capabilities._
