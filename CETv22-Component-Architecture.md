# CET v22.0 Component Architecture

## Component Hierarchy

```
CETv22ServiceDesign (Main Container)
├── CETv22FileUpload (File Input)
├── CETv22ProjectOverview (Project Summary)
├── CETv22ResourceDashboard (Domain Breakdown)
│   ├── Resource Summary Cards
│   ├── Role Breakdown Section
│   └── Domain Breakdown Section ⭐
├── CETv22EffortAnalysis (Effort Metrics)
├── CETv22PhaseTimeline (Timeline View)
├── CETv22RiskAssessment (Risk Analysis)
└── CETv22IntegrationPanel (Integration)
```

## Key Components

### 1. CETv22ServiceDesign
**Purpose**: Main container managing state and data flow
**Key Features**:
- File processing orchestration
- State management (data, analysis, progress)
- Tab navigation
- Error handling

### 2. CETv22ResourceDashboard
**Purpose**: Display resource analysis including domain breakdown
**Key Features**:
- Resource summary cards
- Role breakdown visualization
- Domain breakdown with percentages
- Progress bars and charts

### 3. CETv22FileUpload
**Purpose**: Handle Excel file upload and validation
**Key Features**:
- Drag & drop file input
- File validation
- Progress tracking
- Error feedback

## Data Flow Architecture

```
Excel File → Parser → Analyzer → UI Components
     ↓         ↓        ↓           ↓
  Upload → Extract → Aggregate → Display
```

## State Management

### Main State Structure
```typescript
interface ServiceDesignState {
  activeTab: string;
  processingState: 'idle' | 'uploading' | 'parsing' | 'analyzing' | 'completed' | 'error';
  progress: number;
  cetData: CETv22Data | null;
  analysisResult: CETv22AnalysisResult | null;
  error: string | null;
}
```

### Data Processing Pipeline
1. **Upload**: File validation and reading
2. **Parse**: Excel extraction and data mapping
3. **Analyze**: Domain aggregation and calculations
4. **Display**: UI rendering with visualizations

## Integration Points

### External Dependencies
- **xlsx**: Excel file parsing
- **React**: Component framework
- **Next.js**: Application framework
- **Tailwind**: Styling system

### Internal Services
- **CETv22ParserService**: Excel data extraction
- **CETv22AnalyzerService**: Data analysis and aggregation
- **DataService**: General data utilities

## Error Handling Strategy

### Error Boundaries
- Component-level error catching
- Graceful degradation
- User-friendly error messages

### Validation Layers
- File format validation
- Data structure validation
- Business logic validation

## Performance Optimizations

### Data Processing
- Efficient Excel parsing
- Optimized aggregation algorithms
- Memory-conscious data structures

### UI Rendering
- Component memoization
- Lazy loading for large datasets
- Virtual scrolling for long lists

## Testing Strategy

### Unit Tests
- Parser service logic
- Analyzer calculations
- Component rendering

### Integration Tests
- End-to-end data flow
- File upload scenarios
- Error handling paths

### Visual Tests
- UI component snapshots
- Responsive design validation
- Cross-browser compatibility
