# Dashboard and Bill of Materials Data Architecture Guide

## Executive Summary

This document provides a comprehensive data architecture guide for implementing enhanced dashboard UI elements and configurable Bill of Materials (BOM) generation. It maps all available data sources from localStorage and provides detailed specifications for creating modern, data-driven UI components that can be reused across both dashboard and BOM contexts.

## Data Source Inventory

### 1. SpecSync Data (`specsync-data`)
**Storage Key**: `specsync-data`
**Data Structure**: `SpecSyncState`
**Last Updated**: Dynamic (on import)
**Data Quality**: High - Real imported data

#### Available Fields
```typescript
interface SpecSyncState {
  fileName: string;
  importedAt: number;
  includeInEstimates: boolean;
  counts: {
    totalRequirements: number;
    domains: Record<string, number>;
    useCases: number;
  };
  items: SpecSyncItem[];
  selectedCapabilityIds: string[];
}
```

#### SpecSyncItem Structure
```typescript
interface SpecSyncItem {
  id: string;
  requirementId: string;
  rephrasedRequirementId: string;
  domain: string;
  vertical: string;
  functionName: string;
  afLevel2: string;
  capability: string;
  referenceCapability: string;
  'Rephrased Function Name'?: string;
  usecase1: string;
  description: string;
  priority: string;
  status: string;
}
```

#### Dashboard UI Elements
- **SpecSync Summary Card**: `counts.totalRequirements`, `counts.domains`, `counts.useCases`
- **Domain Distribution Chart**: `counts.domains` breakdown
- **Import Status Badge**: `fileName`, `importedAt` timestamp
- **Requirements Quality Metrics**: Mapped vs unmapped requirements

#### BOM Data Selection Options
- **Requirement Categories**: Filter by `domain`, `vertical`, `priority`, `status`
- **Function Mappings**: Group by `functionName`, `capability`
- **Use Case Coverage**: Include/exclude items with `usecase1`
- **Quality Filters**: Include only mapped requirements

### 2. CETv22 Service Design Data (`cetv22Data`, `cetv22Analysis`)
**Storage Keys**: `cetv22Data`, `cetv22Analysis`
**Data Structure**: `CETv22Data` + `CETv22AnalysisResult`
**Last Updated**: On file processing
**Data Quality**: High - Processed from Excel files

#### Available Fields
```typescript
interface CETv22Data {
  project: CETv22Project;
  phases: CETv22Phase[];
  products: CETv22Product[];
  jobProfiles: CETv22JobProfile[];
  resourceDemands: CETv22ResourceDemand[];
  lookupValues: CETv22LookupValue[];
  dealTypes: CETv22DealType[];
}
```

#### Resource Demand Structure
```typescript
interface CETv22ResourceDemand {
  productType: string;
  jobProfile: string;
  effortHours: number;
  phase: string;
  domain: string;
}
```

#### Dashboard UI Elements
- **Resource Demand Summary**: Total hours, peak resources
- **Job Profile Distribution**: Hours by job profile
- **Phase Timeline**: Resource allocation by phase
- **Domain Resource Allocation**: Hours by domain

#### BOM Data Selection Options
- **Resource Categories**: Filter by `jobProfile`, `productType`
- **Phase-based Selection**: Include specific `phases`
- **Domain Filtering**: Filter by `domain`
- **Effort Thresholds**: Include items above certain `effortHours`

### 3. Blue Dolphin Traversal Results (`blueDolphinTraversalObjects`)
**Storage Key**: `blueDolphinTraversalObjects`
**Data Structure**: Array of Blue Dolphin objects
**Last Updated**: On traversal completion
**Data Quality**: High - Real API data

#### Available Object Types
- **Application Functions**: `Definition === 'Application Function'`
- **Business Processes**: `Definition === 'Business Process'` (top/child/grandchild)
- **Application Services**: `Definition === 'Application Service'` (top/child/grandchild)
- **Application Interfaces**: `Definition === 'Application Interface'` (top/child/grandchild)
- **Deliverables**: `Definition === 'Deliverable'` (top/child/grandchild)

#### Object Structure
```typescript
interface BlueDolphinObject {
  ID: string;
  Title: string;
  Description: string;
  Definition: string;
  Workspace: string;
  hierarchyLevel?: 'top' | 'child' | 'grandchild';
  // Additional metadata fields
}
```

#### Dashboard UI Elements
- **Solution Model Overview**: Object count by type
- **Architecture Hierarchy**: Visual hierarchy representation
- **Integration Completeness**: Mapped vs unmapped objects
- **Workspace Distribution**: Objects by workspace

#### BOM Data Selection Options
- **Object Type Selection**: Choose specific `Definition` types
- **Hierarchy Level Filtering**: Include/exclude by `hierarchyLevel`
- **Workspace Filtering**: Filter by `Workspace`
- **Integration Status**: Include only mapped objects

### 4. SET Estimation Data (`set-data`)
**Storage Key**: `set-data`
**Data Structure**: SET estimation results
**Last Updated**: On SET file processing
**Data Quality**: Medium - Processed from Excel files

#### Available Fields
- Domain effort estimates
- Work package matches
- Estimation accuracy metrics
- CUT effort calculations

#### Dashboard UI Elements
- **Estimation Summary**: Total effort by domain
- **Estimation Accuracy**: SET vs actual comparison
- **Work Package Status**: Matched vs unmatched

#### BOM Data Selection Options
- **Domain Effort Selection**: Include specific domain efforts
- **Work Package Filtering**: Include matched work packages
- **Estimation Accuracy**: Include only high-confidence estimates

### 5. Miro Integration Data
**Storage Keys**: `miroConfig`, `miro_test_board_id`, `miro_specsync_test_board_id`
**Data Structure**: Miro configuration and board references
**Last Updated**: On configuration save
**Data Quality**: High - Real configuration data

#### Available Fields
- Board creation status
- Integration configuration
- Board access links
- Authentication status

#### Dashboard UI Elements
- **Visualization Status**: Board creation indicators
- **Integration Health**: Configuration status
- **Board Access Links**: Quick access to created boards

#### BOM Data Selection Options
- **Board-based Filtering**: Include data from specific boards
- **Integration Status**: Include only successfully integrated data

### 6. ADO Integration Data (`ado-configuration`)
**Storage Key**: `ado-configuration`
**Data Structure**: ADO configuration and work items
**Last Updated**: On configuration save
**Data Quality**: High - Real configuration data

#### Available Fields
- Work item counts
- Integration status
- Export history
- Configuration details

#### Dashboard UI Elements
- **Work Item Summary**: Total work items, status breakdown
- **Integration Status**: ADO connection health
- **Export History**: Recent exports, success rates

#### BOM Data Selection Options
- **Work Item Filtering**: Include specific work item types
- **Status-based Selection**: Filter by work item status
- **Export History**: Include recently exported items

### 7. BOM Configuration Data
**Storage Keys**: Various BOM-related keys
**Data Structure**: BOM items and configurations
**Last Updated**: On BOM generation
**Data Quality**: Mixed - Some real, some mock data

#### Available Fields
- Service delivery categories
- Resource specifications
- Cost estimates
- Complexity factors

#### Dashboard UI Elements
- **BOM Summary**: Total items, categories
- **Service Delivery Status**: Category distribution
- **Resource Breakdown**: Skills, tools, infrastructure

#### BOM Data Selection Options
- **Service Category Selection**: Choose specific service categories
- **Resource Type Filtering**: Include specific resource types
- **Cost Threshold Filtering**: Include items above cost thresholds

## Dashboard UI Component Specifications

### 1. Data Source Status Panel
**Location**: Top of dashboard, below existing metrics
**Purpose**: Real-time data source health and freshness
**Components**:
```typescript
interface DataSourceStatus {
  source: string;
  status: 'connected' | 'disconnected' | 'error';
  lastUpdated: string;
  dataQuality: 'high' | 'medium' | 'low';
  recordCount: number;
}
```

**UI Elements**:
- Status indicator badges
- Last update timestamps
- Data quality indicators
- Record count displays
- Missing data alerts

### 2. SpecSync Analytics Section
**Location**: New collapsible section
**Purpose**: Deep dive into requirements data
**Components**:
```typescript
interface SpecSyncAnalytics {
  totalRequirements: number;
  domainBreakdown: Record<string, number>;
  useCaseCoverage: number;
  mappingCompleteness: number;
  qualityMetrics: {
    mappedRequirements: number;
    unmappedRequirements: number;
    highPriorityRequirements: number;
  };
}
```

**UI Elements**:
- Requirements distribution pie chart
- Domain coverage bar chart
- Use case mapping progress bar
- Quality metrics cards
- Import history timeline

### 3. Resource Planning Dashboard
**Location**: New collapsible section
**Purpose**: CETv22 and SET data visualization
**Components**:
```typescript
interface ResourcePlanning {
  totalHours: number;
  peakResources: number;
  jobProfileBreakdown: Record<string, number>;
  phaseTimeline: PhaseResource[];
  domainAllocation: Record<string, number>;
  estimationAccuracy: number;
}
```

**UI Elements**:
- Resource demand summary cards
- Job profile distribution chart
- Phase timeline visualization
- Domain allocation chart
- Estimation accuracy gauge

### 4. Solution Model Overview
**Location**: New collapsible section
**Purpose**: Blue Dolphin architecture visualization
**Components**:
```typescript
interface SolutionModelOverview {
  totalObjects: number;
  objectTypeBreakdown: Record<string, number>;
  hierarchyDistribution: Record<string, number>;
  workspaceDistribution: Record<string, number>;
  integrationCompleteness: number;
}
```

**UI Elements**:
- Object type distribution chart
- Hierarchy level breakdown
- Workspace distribution
- Integration completeness progress
- Architecture complexity metrics

### 5. Integration Health Panel
**Location**: New collapsible section
**Purpose**: External system integration status
**Components**:
```typescript
interface IntegrationHealth {
  miro: {
    configured: boolean;
    boardsCreated: number;
    lastSync: string;
  };
  ado: {
    configured: boolean;
    workItemsCount: number;
    lastSync: string;
  };
  blueDolphin: {
    connected: boolean;
    objectsCount: number;
    lastTraversal: string;
  };
}
```

**UI Elements**:
- Integration status indicators
- Last sync timestamps
- Configuration health badges
- Error status alerts
- Quick action buttons

## Bill of Materials Data Selection Framework

### BOM Configuration Interface
**Purpose**: Allow users to select data sources and criteria for BOM generation
**Location**: Bill of Materials tab

#### Data Source Selection Panel
```typescript
interface BOMDataSourceSelection {
  specSync: {
    enabled: boolean;
    filters: {
      domains: string[];
      priorities: string[];
      statuses: string[];
      includeUnmapped: boolean;
    };
  };
  cetv22: {
    enabled: boolean;
    filters: {
      jobProfiles: string[];
      phases: string[];
      domains: string[];
      effortThreshold: number;
    };
  };
  blueDolphin: {
    enabled: boolean;
    filters: {
      objectTypes: string[];
      hierarchyLevels: string[];
      workspaces: string[];
      includeUnmapped: boolean;
    };
  };
  set: {
    enabled: boolean;
    filters: {
      domains: string[];
      workPackages: string[];
      accuracyThreshold: number;
    };
  };
  miro: {
    enabled: boolean;
    filters: {
      boardIds: string[];
      includeVisualElements: boolean;
    };
  };
  ado: {
    enabled: boolean;
    filters: {
      workItemTypes: string[];
      statuses: string[];
      includeExported: boolean;
    };
  };
}
```

#### BOM Output Configuration
```typescript
interface BOMOutputConfig {
  outputFormat: 'csv' | 'excel' | 'json';
  includeMetadata: boolean;
  groupBy: 'domain' | 'function' | 'phase' | 'objectType';
  sortBy: 'priority' | 'effort' | 'alphabetical' | 'custom';
  customFields: string[];
  aggregationLevel: 'detailed' | 'summary' | 'both';
}
```

### BOM Data Mapping Strategy

#### 1. SpecSync to BOM Mapping
```typescript
interface SpecSyncBOMItem {
  source: 'specsync';
  id: string;
  requirementId: string;
  domain: string;
  functionName: string;
  priority: string;
  status: string;
  description: string;
  useCase: string;
  effort: number; // Calculated from other sources
  category: 'requirement';
}
```

#### 2. CETv22 to BOM Mapping
```typescript
interface CETv22BOMItem {
  source: 'cetv22';
  id: string;
  productType: string;
  jobProfile: string;
  effortHours: number;
  phase: string;
  domain: string;
  category: 'resource';
}
```

#### 3. Blue Dolphin to BOM Mapping
```typescript
interface BlueDolphinBOMItem {
  source: 'blueDolphin';
  id: string;
  title: string;
  definition: string;
  workspace: string;
  hierarchyLevel: string;
  description: string;
  category: 'architecture';
}
```

#### 4. SET to BOM Mapping
```typescript
interface SETBOMItem {
  source: 'set';
  id: string;
  domain: string;
  workPackage: string;
  effort: number;
  accuracy: number;
  category: 'estimation';
}
```

### BOM Generation Process

#### 1. Data Collection Phase
- Load selected data sources from localStorage
- Apply filters based on user selection
- Validate data quality and completeness
- Handle missing or invalid data gracefully

#### 2. Data Processing Phase
- Map data to BOM item format
- Calculate derived fields (effort, costs, etc.)
- Apply grouping and sorting rules
- Generate metadata and statistics

#### 3. Output Generation Phase
- Format data according to selected output type
- Include metadata and configuration details
- Generate summary statistics
- Create downloadable file

## Implementation Guidelines

### 1. Data Loading Strategy
- **Lazy Loading**: Load data only when sections are expanded
- **Caching**: Cache processed data to avoid repeated calculations
- **Error Handling**: Graceful degradation when data is unavailable
- **Real-time Updates**: Update dashboard when data changes

### 2. UI Component Reusability
- **Shared Components**: Create reusable components for both dashboard and BOM
- **Consistent Styling**: Use existing design system and Tailwind classes
- **Responsive Design**: Ensure components work on all screen sizes
- **Accessibility**: Include proper ARIA labels and keyboard navigation

### 3. Performance Optimization
- **Data Aggregation**: Pre-calculate summary statistics
- **Virtual Scrolling**: For large datasets
- **Memoization**: Cache expensive calculations
- **Progressive Loading**: Load critical data first

### 4. Data Validation
- **Schema Validation**: Validate data structure before processing
- **Quality Checks**: Identify and flag data quality issues
- **Missing Data Handling**: Provide clear indicators for missing data
- **Error Recovery**: Allow users to retry failed operations

## Development Phases

### Phase 1: Data Source Status Panel
- Implement data source health indicators
- Add data freshness timestamps
- Create missing data alerts
- Add data quality metrics

### Phase 2: SpecSync Analytics
- Create requirements distribution charts
- Add domain coverage analysis
- Implement use case mapping visualization
- Add requirement quality metrics

### Phase 3: Resource Planning Dashboard
- Integrate CETv22 data visualization
- Add SET estimation comparison
- Create resource allocation charts
- Implement phase timeline visualization

### Phase 4: Solution Model Overview
- Add Blue Dolphin object visualization
- Create architecture hierarchy display
- Implement integration completeness metrics
- Add object relationship visualization

### Phase 5: BOM Configuration Interface
- Create data source selection panel
- Implement filter configuration
- Add output format selection
- Create BOM generation process

### Phase 6: Integration Health Panel
- Add Miro integration status
- Implement ADO sync status
- Create configuration health indicators
- Add error monitoring and alerts

## Conclusion

This comprehensive data architecture guide provides the foundation for implementing enhanced dashboard UI elements and configurable BOM generation. By following these specifications, developers can create modern, data-driven components that leverage all available data sources while maintaining consistency and performance.

The modular approach allows for incremental implementation, ensuring that each phase delivers value while building toward a comprehensive project intelligence platform.
