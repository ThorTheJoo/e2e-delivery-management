# Bill of Materials (BOM) Implementation

## Overview

The Bill of Materials (BOM) page is a comprehensive inventory system that aggregates data from multiple sources across the E2E Delivery Management application to create a unified view of project requirements, capabilities, and service delivery services.

## Purpose

The BOM serves as a central repository that helps software vendors:

- Automate business processes and workflows throughout the delivery process
- Create comprehensive project plans and commercial models
- Track TMF domains, capabilities, and requirements
- Manage service delivery services and their associated costs
- Export data for further analysis and planning

## Data Sources

### 1. SpecSync Requirements (TMF)

- **Source**: `specSyncState` from SpecSync import functionality
- **Data**:
  - TMF domains and capabilities
  - Requirements breakdown
  - Application components
  - Use cases (when available)
  - Product capabilities

### 2. SET Estimation Data

- **Source**: `setDomainEfforts` from SET import process
- **Data**:
  - CUT (Code and Unit Test) effort in mandays
  - Domain-linked effort estimates
  - eTOM L1, L2, L3 capability decomposition

### 3. Service Design (CETv22)

- **Source**: `cetv22Data` from CETv22 service design analysis
- **Data**:
  - Resource plan and domain breakdown
  - Resource forecasting
  - Service delivery planning

## Service Delivery Services

The BOM includes a comprehensive list of service delivery services that are commonly included in proposals:

### Core Services

- **Migration**: Data and system migration services
- **Training**: User and technical training programs
- **Development**: Custom development and customization
- **Build**: System build and configuration
- **Test**: Testing and quality assurance

### Management Services

- **Project Management**: Day-to-day project oversight
- **Program Management**: Strategic program coordination
- **Stakeholder Management**: Communication and stakeholder engagement
- **Governance**: Project governance and compliance

### Technical Services

- **Architecture**: Solution architecture design
- **Design**: Detailed design and specifications
- **Integration**: System integration services
- **Platform Engineering**: Platform-specific engineering
- **Platform Architecture**: Platform architecture design

### Operational Services

- **Environments**: Environment setup and management
- **Release Deployment**: Release management and deployment
- **Production Cutover**: Production transition services
- **Warranty**: Post-deployment warranty support
- **Hypercare**: Intensive post-deployment support

## BOM Item Structure

Each BOM item contains:

```typescript
interface BOMItem {
  id: string;
  tmfDomain: string; // TMF domain (e.g., Customer Management)
  capability: string; // Specific capability within domain
  requirement: string; // Detailed requirement description
  applicationComponent?: string; // Associated application component
  useCase?: string; // Use case description
  cutEffort?: number; // CUT effort in mandays
  resourceDomain?: string; // Resource domain from service design
  resourceBreakdown?: ResourceBreakdown; // Detailed resource allocation
  serviceDeliveryServices: ServiceDeliveryService[]; // Associated services
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Identified' | 'In Progress' | 'Completed' | 'On Hold';
  source: 'SpecSync' | 'SET' | 'CETv22' | 'Manual';
  createdAt: string;
  updatedAt: string;
}
```

## Key Features

### 1. Data Aggregation

- Automatically combines data from all sources
- Maps related items across different data sources
- Maintains data lineage and source tracking

### 2. Comprehensive Filtering

- **Search**: Text-based search across all fields
- **Domain Filter**: Filter by TMF domains
- **Capability Filter**: Filter by specific capabilities
- **Priority Filter**: Filter by priority levels
- **Source Filter**: Filter by data source
- **Status Filter**: Filter by item status

### 3. Multiple Views

- **Overview**: Summary statistics and breakdowns
- **Item Details**: Detailed table view of all BOM items
- **Service Delivery**: Service breakdown and cost analysis

### 4. Export Functionality

- **CSV Export**: Complete BOM data export
- **Filtered Export**: Export only filtered/visible items
- **Comprehensive Data**: Includes all fields and calculated values

## Implementation Details

### Component Location

- **File**: `src/components/bill-of-materials.tsx`
- **Navigation**: Added to Presales section in navigation sidebar
- **Tab**: Integrated as "Bill of Materials" tab in main application

### State Management

- **Local State**: Component manages its own state for filters and UI
- **Data Integration**: Receives data from parent components via props
- **Real-time Updates**: Automatically updates when source data changes

### Data Processing

- **Source Mapping**: Maps items across different data sources
- **Effort Calculation**: Aggregates CUT efforts and resource breakdowns
- **Cost Calculation**: Calculates total service delivery costs
- **Summary Statistics**: Generates real-time summary metrics

## Usage Workflow

### 1. Data Import

1. Import SpecSync requirements data
2. Import SET estimation data
3. Import CETv22 service design data (when available)

### 2. BOM Generation

- BOM automatically generates when data is available
- Items are created from all data sources
- Service delivery services are automatically assigned

### 3. Analysis and Filtering

- Use filters to focus on specific domains or capabilities
- Search for specific requirements or components
- Analyze effort and cost breakdowns

### 4. Export and Planning

- Export filtered or complete BOM data
- Use exported data for project planning
- Integrate with commercial model development

## Integration Points

### Navigation

- Added to Presales section in navigation sidebar
- Accessible via "Bill of Materials" menu item
- Integrated with main application tab system

### Data Flow

- **Input**: Receives data from SpecSync, SET, and CETv22 components
- **Processing**: Aggregates and processes data into unified BOM structure
- **Output**: Provides filtered views and CSV export functionality

### Future Enhancements

- Integration with commercial model development
- Advanced reporting and analytics
- Real-time collaboration features
- Integration with external project management tools

## Benefits

### For Project Managers

- **Centralized View**: Single source of truth for all project components
- **Effort Tracking**: Comprehensive effort and resource planning
- **Cost Management**: Detailed cost breakdown and analysis
- **Risk Assessment**: Priority and status tracking for risk management

### For Business Development

- **Proposal Development**: Comprehensive data for proposal creation
- **Service Catalog**: Complete service delivery service inventory
- **Cost Estimation**: Accurate cost estimation for proposals
- **Resource Planning**: Detailed resource requirements and allocation

### For Delivery Teams

- **Work Breakdown**: Clear understanding of all work components
- **Dependency Management**: Visibility into dependencies and relationships
- **Resource Allocation**: Detailed resource planning and allocation
- **Progress Tracking**: Status tracking for all BOM items

## Technical Implementation

### Dependencies

- React hooks for state management
- TypeScript for type safety
- Tailwind CSS for styling
- Shadcn UI components for consistent UI
- Lucide React for icons

### Performance Considerations

- Memoized calculations for summary statistics
- Efficient filtering algorithms
- Lazy loading for large datasets
- Optimized CSV export functionality

### Accessibility

- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility

## Conclusion

The Bill of Materials implementation provides a comprehensive, integrated view of all project components, requirements, and services. It serves as a foundation for project planning, commercial model development, and delivery execution, enabling software vendors to effectively manage complex delivery projects with full visibility into all aspects of the delivery process.
