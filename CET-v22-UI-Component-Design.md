# CET v22.0 UI Component Design

## Component Architecture Overview

The CET v22.0 integration requires a comprehensive set of React components that provide intuitive file analysis, data visualization, and integration management capabilities. This design follows the markdown-inspired approach with clear separation of concerns and reusable patterns.

## Core Component Structure

### 1. **Main Container Component**
```typescript
// CETv22MainContainer.tsx
interface CETv22MainContainerProps {
  onIntegrationComplete: (result: IntegrationResult) => void;
  onError: (error: Error) => void;
  config: CETConfiguration;
}

// Component Structure
┌─────────────────────────────────────────────────────────────┐
│                    CET v22.0 Analyzer                      │
├─────────────────────────────────────────────────────────────┤
│  [File Upload Area]                                        │
│  [Analysis Progress]                                        │
│  [Results Dashboard]                                        │
└─────────────────────────────────────────────────────────────┘
```

### 2. **File Upload Component**
```typescript
// CETv22FileUpload.tsx
interface CETv22FileUploadProps {
  onFileSelected: (file: File) => void;
  onValidationError: (errors: string[]) => void;
  maxFileSize: number;
  allowedTypes: string[];
  dragAndDrop: boolean;
}

// Features
- Drag & drop file upload
- File validation (size, type, format)
- Progress indication
- Error handling and display
- File preview
```

### 3. **Analysis Dashboard Component**
```typescript
// CETv22AnalysisDashboard.tsx
interface CETv22AnalysisDashboardProps {
  analysisResult: CETAnalysisResult;
  onIntegrationRequest: (options: IntegrationOptions) => void;
  onExportRequest: (format: ExportFormat) => void;
}

// Dashboard Sections
┌─────────────────────────────────────────────────────────────┐
│  [Project Overview] [Resource Summary] [Effort Analysis]   │
├─────────────────────────────────────────────────────────────┤
│  [Phase Breakdown] [Product Mapping] [Risk Assessment]     │
├─────────────────────────────────────────────────────────────┤
│  [Integration Options] [Export Controls] [Action Buttons]  │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
CETv22MainContainer
├── CETv22FileUpload
│   ├── FileDropZone
│   ├── FileValidation
│   └── UploadProgress
├── CETv22AnalysisDashboard
│   ├── ProjectOverviewCard
│   ├── ResourceSummaryCard
│   ├── EffortAnalysisCard
│   ├── PhaseBreakdownCard
│   ├── ProductMappingCard
│   └── RiskAssessmentCard
├── CETv22IntegrationPanel
│   ├── IntegrationOptions
│   ├── MappingPreview
│   └── IntegrationProgress
└── CETv22ResultsViewer
    ├── DataTable
    ├── ChartVisualizations
    └── ExportControls
```

## Detailed Component Specifications

### 1. **File Upload Components**

#### FileDropZone
```typescript
// CETv22FileDropZone.tsx
interface FileDropZoneProps {
  onFileDrop: (files: FileList) => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
  isDragActive: boolean;
  acceptedFileTypes: string[];
}

// Visual States
- Default: Light border with upload icon
- Drag Active: Highlighted border with drop message
- Error: Red border with error message
- Success: Green border with success message
```

#### FileValidation
```typescript
// CETv22FileValidation.tsx
interface FileValidationProps {
  file: File;
  validationRules: ValidationRule[];
  onValidationComplete: (result: ValidationResult) => void;
}

// Validation Checks
- File size limits
- File type verification
- Required sheet presence
- Data format validation
- Business rule compliance
```

### 2. **Analysis Display Components**

#### ProjectOverviewCard
```typescript
// CETv22ProjectOverviewCard.tsx
interface ProjectOverviewCardProps {
  projectInfo: CETProjectInfo;
  onEdit: () => void;
  onSave: (updates: Partial<CETProjectInfo>) => void;
}

// Display Elements
┌─────────────────────────────────────────┐
│  📋 Project Overview                   │
├─────────────────────────────────────────┤
│  Customer: [Customer Name]             │
│  Project:  [Project Name]              │
│  Region:   [Geographic Region]         │
│  Telco:    [Digital Telco Type]        │
│  Status:   [Project Status]             │
└─────────────────────────────────────────┘
```

#### ResourceSummaryCard
```typescript
// CETv22ResourceSummaryCard.tsx
interface ResourceSummaryCardProps {
  resourceData: CETResourceSummary;
  onDrillDown: (resourceType: string) => void;
}

// Summary Metrics
┌─────────────────────────────────────────┐
│  👥 Resource Summary                   │
├─────────────────────────────────────────┤
│  Total Effort: [X,XXX] hours           │
│  Peak Resources: [XX] people           │
│  Avg Resources: [XX] people            │
│  Resource Types: [X] categories        │
└─────────────────────────────────────────┘
```

#### EffortAnalysisCard
```typescript
// CETv22EffortAnalysisCard.tsx
interface EffortAnalysisCardProps {
  effortData: CETEffortAnalysis;
  onPhaseSelect: (phase: number) => void;
}

// Effort Breakdown
┌─────────────────────────────────────────┐
│  ⏱️ Effort Analysis                    │
├─────────────────────────────────────────┤
│  Phase 1: [XXX] hours ([XX]%)          │
│  Phase 2: [XXX] hours ([XX]%)          │
│  Phase 3: [XXX] hours ([XX]%)          │
│  Phase 4: [XXX] hours ([XX]%)          │
│  Total:   [X,XXX] hours                │
└─────────────────────────────────────────┘
```

### 3. **Data Visualization Components**

#### PhaseBreakdownChart
```typescript
// CETv22PhaseBreakdownChart.tsx
interface PhaseBreakdownChartProps {
  phaseData: CETPhaseData[];
  chartType: 'bar' | 'line' | 'pie';
  onDataPointClick: (phase: number) => void;
}

// Chart Features
- Interactive phase breakdown
- Effort vs. time visualization
- Resource allocation display
- Phase comparison charts
- Export to image/PDF
```

#### ResourceDemandTimeline
```typescript
// CETv22ResourceDemandTimeline.tsx
interface ResourceDemandTimelineProps {
  timelineData: CETTimelineData[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

// Timeline Features
- Week-by-week resource demand
- Role-based color coding
- Peak resource identification
- Resource utilization trends
- Interactive zoom and pan
```

### 4. **Integration Management Components**

#### IntegrationOptions
```typescript
// CETv22IntegrationOptions.tsx
interface IntegrationOptionsProps {
  availableMappings: IntegrationMapping[];
  onOptionToggle: (option: string, enabled: boolean) => void;
  onPreviewRequest: () => void;
}

// Integration Options
┌─────────────────────────────────────────┐
│  🔗 Integration Options                │
├─────────────────────────────────────────┤
│  ☑️ Create Work Packages               │
│  ☑️ Generate Milestones                │
│  ☑️ Allocate Resources                 │
│  ☑️ Identify Risks                     │
│  ☑️ Update Existing Items              │
├─────────────────────────────────────────┤
│  [Preview Integration] [Start Import]  │
└─────────────────────────────────────────┘
```

#### MappingPreview
```typescript
// CETv22MappingPreview.tsx
interface MappingPreviewProps {
  mappings: IntegrationMapping[];
  onMappingEdit: (mappingId: string, updates: any) => void;
  onMappingDelete: (mappingId: string) => void;
}

// Preview Features
- Table view of all mappings
- Edit individual mappings
- Delete unwanted mappings
- Bulk mapping operations
- Mapping validation
```

## Component Styling & Theming

### 1. **Design System Integration**
```typescript
// Use existing design system components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
```

### 2. **Color Scheme**
```css
/* CET-specific color variables */
:root {
  --cet-primary: #2563eb;      /* Blue for primary actions */
  --cet-success: #16a34a;      /* Green for success states */
  --cet-warning: #ca8a04;      /* Yellow for warnings */
  --cet-error: #dc2626;        /* Red for errors */
  --cet-info: #0891b2;         /* Cyan for information */
  --cet-neutral: #6b7280;      /* Gray for neutral states */
}
```

### 3. **Responsive Design**
```typescript
// Responsive breakpoints
const breakpoints = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px'
};

// Component adaptations
- Mobile: Stacked card layout
- Tablet: Side-by-side cards
- Desktop: Multi-column grid
- Wide: Full dashboard view
```

## State Management

### 1. **Component State**
```typescript
// Local component state
const [uploadState, setUploadState] = useState<UploadState>('idle');
const [analysisProgress, setAnalysisProgress] = useState(0);
const [validationErrors, setValidationErrors] = useState<string[]>([]);
const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
```

### 2. **Shared State**
```typescript
// Context-based state management
interface CETv22Context {
  currentFile: File | null;
  analysisResult: CETAnalysisResult | null;
  integrationMappings: IntegrationMapping[];
  processingState: ProcessingState;
  errors: Error[];
  warnings: string[];
}
```

### 3. **State Persistence**
```typescript
// Local storage for user preferences
const saveUserPreferences = (preferences: UserPreferences) => {
  localStorage.setItem('cet-v22-preferences', JSON.stringify(preferences));
};

const loadUserPreferences = (): UserPreferences => {
  const stored = localStorage.getItem('cet-v22-preferences');
  return stored ? JSON.parse(stored) : defaultPreferences;
};
```

## Event Handling

### 1. **File Events**
```typescript
// File upload event handlers
const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    validateAndProcessFile(file);
  }
};

const handleFileDrop = (event: DragEvent) => {
  event.preventDefault();
  const files = event.dataTransfer?.files;
  if (files) {
    processDroppedFiles(files);
  }
};
```

### 2. **Analysis Events**
```typescript
// Analysis progress events
const handleAnalysisProgress = (progress: number, step: string) => {
  setAnalysisProgress(progress);
  setCurrentStep(step);
  
  if (progress === 100) {
    onAnalysisComplete();
  }
};

const handleAnalysisError = (error: Error) => {
  setAnalysisState('error');
  setErrorMessage(error.message);
  onError(error);
};
```

### 3. **Integration Events**
```typescript
// Integration action events
const handleIntegrationStart = (options: IntegrationOptions) => {
  setIntegrationState('processing');
  startIntegration(options);
};

const handleIntegrationComplete = (result: IntegrationResult) => {
  setIntegrationState('completed');
  onIntegrationComplete(result);
};
```

## Performance Optimization

### 1. **Lazy Loading**
```typescript
// Lazy load heavy components
const CETv22ChartVisualization = lazy(() => import('./CETv22ChartVisualization'));
const CETv22DataTable = lazy(() => import('./CETv22DataTable'));

// Suspense wrapper
<Suspense fallback={<ChartLoadingSkeleton />}>
  <CETv22ChartVisualization data={chartData} />
</Suspense>
```

### 2. **Memoization**
```typescript
// Memoize expensive calculations
const memoizedEffortCalculation = useMemo(() => {
  return calculateTotalEffort(resourceDemands);
}, [resourceDemands]);

// Memoize component props
const memoizedChartData = useMemo(() => {
  return transformDataForChart(rawData);
}, [rawData]);
```

### 3. **Virtual Scrolling**
```typescript
// Virtual scrolling for large datasets
import { FixedSizeList as List } from 'react-window';

const VirtualizedDataTable = ({ data }: { data: CETData[] }) => (
  <List
    height={400}
    itemCount={data.length}
    itemSize={50}
    itemData={data}
  >
    {DataRow}
  </List>
);
```

## Accessibility Features

### 1. **Keyboard Navigation**
```typescript
// Keyboard event handlers
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
      handleAction();
      break;
    case 'Escape':
      handleCancel();
      break;
    case 'Tab':
      handleTabNavigation(event);
      break;
  }
};
```

### 2. **Screen Reader Support**
```typescript
// ARIA labels and descriptions
<div
  role="region"
  aria-label="CET Analysis Results"
  aria-describedby="analysis-description"
>
  <div id="analysis-description" className="sr-only">
    Comprehensive analysis of CET v22.0 file with resource demands, 
    effort estimates, and integration mappings.
  </div>
  {/* Component content */}
</div>
```

### 3. **Focus Management**
```typescript
// Focus management for modals and dialogs
const focusTrapRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (isOpen && focusTrapRef.current) {
    const firstFocusable = focusTrapRef.current.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    firstFocusable?.focus();
  }
}, [isOpen]);
```

## Testing Strategy

### 1. **Unit Tests**
```typescript
// Component unit tests
describe('CETv22FileUpload', () => {
  it('should validate file size correctly', () => {
    const { getByTestId } = render(<CETv22FileUpload maxFileSize={50} />);
    // Test implementation
  });
  
  it('should handle file selection', () => {
    const mockOnFileSelected = jest.fn();
    const { getByTestId } = render(
      <CETv22FileUpload onFileSelected={mockOnFileSelected} />
    );
    // Test implementation
  });
});
```

### 2. **Integration Tests**
```typescript
// Component integration tests
describe('CETv22Integration', () => {
  it('should complete full analysis workflow', async () => {
    // Test complete workflow
  });
  
  it('should handle errors gracefully', async () => {
    // Test error scenarios
  });
});
```

### 3. **Visual Regression Tests**
```typescript
// Visual testing with Storybook
export const Default = Template.bind({});
Default.args = {
  file: mockCETFile,
  onAnalysisComplete: action('analysis-complete')
};

export const WithErrors = Template.bind({});
WithErrors.args = {
  file: mockCETFile,
  errors: ['Invalid file format', 'Missing required sheets']
};
```

## Component Documentation

### 1. **Storybook Stories**
```typescript
// Component documentation with Storybook
export default {
  title: 'CET v22.0/FileUpload',
  component: CETv22FileUpload,
  parameters: {
    docs: {
      description: {
        component: 'File upload component for CET v22.0 Excel files'
      }
    }
  }
};
```

### 2. **Props Documentation**
```typescript
// Comprehensive props documentation
interface CETv22FileUploadProps {
  /** Maximum file size in bytes */
  maxFileSize: number;
  
  /** Array of allowed file extensions */
  allowedTypes: string[];
  
  /** Enable drag and drop functionality */
  dragAndDrop?: boolean;
  
  /** Callback when file is selected */
  onFileSelected: (file: File) => void;
  
  /** Callback when validation errors occur */
  onValidationError: (errors: string[]) => void;
}
```

---

*This UI component design provides a comprehensive foundation for building intuitive and powerful CET v22.0 integration interfaces.*
