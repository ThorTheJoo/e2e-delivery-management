# CET v22.0 Domain Breakdown Implementation Guide

## Overview

This guide provides complete documentation for implementing the CET v22.0 Domain Breakdown functionality, which extracts and displays project role total days effort data broken down by domain from Excel files.

## Core Functionality

- Parse Excel files with Ph1Demand worksheet
- Extract domain (Column M) and total mandate effort (Column O) data
- Aggregate data by domain and role
- Display interactive breakdown with percentages and visualizations

## Architecture Overview

### Data Flow

1. **Excel Upload** → **Parser** → **Analyzer** → **UI Components**
2. **Ph1Demand Sheet** → **Domain/Role Extraction** → **Aggregation** → **Visualization**

### Key Components

- `CETv22ParserService` - Excel file parsing
- `CETv22AnalyzerService` - Data analysis and aggregation
- `CETv22ResourceDashboard` - UI display component
- `CETv22ServiceDesign` - Main container component

---

## 1. Type Definitions

### Core Data Types

```typescript
// Resource demand with domain information
export interface CETv22ResourceDemand {
  weekNumber: number;
  weekDate: string;
  jobProfile: string;
  effortHours: number;
  resourceCount: number;
  productType: string;
  phaseNumber: number;
  complexityLevel?: string;
  domain?: string; // Column M from Ph1Demand
  totalMandateEffort?: number; // Column O from Ph1Demand
}

// Domain effort breakdown
export interface CETv22DomainEffort {
  domain: string;
  totalEffort: number;
  percentage: number;
  roleBreakdown: CETv22RoleEffort[];
}

// Role effort within domain
export interface CETv22RoleEffort {
  role: string;
  effort: number;
  percentage: number;
}

// Resource analysis result
export interface CETv22ResourceAnalysis {
  totalEffort: number;
  peakResources: number;
  averageResources: number;
  resourceUtilization: number;
  roleBreakdown: CETv22RoleEffort[];
  timelineAnalysis: CETv22TimelineData[];
  domainBreakdown: CETv22DomainEffort[]; // Key field for domain aggregation
}
```

---

## 2. Excel Parser Service

### Key Features

- Handles Ph1Demand worksheet with specific structure
- Extracts data from columns A (Project Role), M (Domain), O (Total Effort)
- Validates and processes data starting from row 6
- Uses direct index access for reliable column mapping

### Critical Implementation Details

#### Column Mapping

```typescript
// Ph1Demand sheet structure:
// Row 3: Headers
// Row 6+: Data rows
// Column A (index 0): Project Role
// Column M (index 12): Domain
// Column O (index 14): Total Mandate Effort
```

#### Validation Logic

```typescript
private isValidDemandRow(row: any[], headers: string[]): boolean {
  // For Ph1Demand sheet, check domain and total effort
  if (headers.length > 14 && row.length > 14) {
    const domain = String(row[12] || '').trim();
    const totalEffort = parseFloat(String(row[14] || ''));
    return domain.length > 0 && !isNaN(totalEffort) && totalEffort > 0;
  }
  // Standard validation for other sheets...
}
```

#### Data Extraction

```typescript
// Extract domain and total mandate effort for Ph1Demand
if (sheetName === 'Ph1Demand') {
  domain = this.getCellValueByIndex(row, 12); // Column M
  const totalEffortStr = this.getCellValueByIndex(row, 14); // Column O
  totalMandateEffort = parseFloat(totalEffortStr) || undefined;
}
```

---

## 3. Data Analyzer Service

### Domain Breakdown Analysis

```typescript
private analyzeDomainBreakdown(demands: any[]): CETv22DomainEffort[] {
  const domainMap = new Map<string, { totalEffort: number; roleEfforts: Map<string, number> }>();

  // Filter only Ph1Demand data for domain analysis
  const ph1Demands = demands.filter(d =>
    d.phaseNumber === 1 &&
    d.domain &&
    d.totalMandateEffort
  );

  // Aggregate by domain and role
  ph1Demands.forEach(demand => {
    const domain = demand.domain || 'Unknown';
    const effort = demand.totalMandateEffort || 0;

    if (!domainMap.has(domain)) {
      domainMap.set(domain, { totalEffort: 0, roleEfforts: new Map() });
    }

    const domainData = domainMap.get(domain)!;
    domainData.totalEffort += effort;

    const role = demand.jobProfile || 'Unknown';
    if (!domainData.roleEfforts.has(role)) {
      domainData.roleEfforts.set(role, 0);
    }
    domainData.roleEfforts.set(role, domainData.roleEfforts.get(role)! + effort);
  });

  // Calculate percentages and create result
  const totalEffort = Array.from(domainMap.values()).reduce((sum, data) => sum + data.totalEffort, 0);

  return Array.from(domainMap.entries()).map(([domain, data]) => {
    const roleBreakdown: CETv22RoleEffort[] = Array.from(data.roleEfforts.entries()).map(([role, effort]) => ({
      role,
      effort,
      percentage: totalEffort > 0 ? (effort / totalEffort) * 100 : 0
    }));

    return {
      domain,
      totalEffort: data.totalEffort,
      percentage: totalEffort > 0 ? (data.totalEffort / totalEffort) * 100 : 0,
      roleBreakdown
    };
  });
}
```

---

## 4. UI Components

### Resource Dashboard Component

```typescript
// Domain Breakdown Section
{resourceAnalysis.domainBreakdown && resourceAnalysis.domainBreakdown.length > 0 ? (
  <Card>
    <CardHeader>
      <CardTitle>Domain Breakdown & Total Mandate Effort</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {resourceAnalysis.domainBreakdown.map((domain, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">{domain.domain}</h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {domain.totalEffort.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                <span>Domain Share</span>
                <span>{domain.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${domain.percentage}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Role Breakdown:</h4>
              {domain.roleBreakdown.map((role, roleIndex) => (
                <div key={roleIndex} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{role.role}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{role.effort.toLocaleString()}h</span>
                    <Badge variant="secondary" className="text-xs">
                      {role.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
) : (
  // Fallback message with debug info
  <Card>
    <CardHeader>
      <CardTitle>Domain Breakdown & Total Mandate Effort</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-center py-8 text-muted-foreground">
        <p>No domain breakdown data available.</p>
        <p className="text-sm mt-2">
          This section requires Ph1Demand worksheet data with domain (Column M) and total mandate effort (Column O) information.
        </p>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>• resourceAnalysis.domainBreakdown: {JSON.stringify(resourceAnalysis.domainBreakdown)}</p>
          <p>• resourceAnalysis.domainBreakdown length: {resourceAnalysis.domainBreakdown?.length || 0}</p>
          <p>• resourceAnalysis keys: {Object.keys(resourceAnalysis).join(', ')}</p>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

---

## 5. Dependencies

### Required NPM Packages

```json
{
  "xlsx": "^0.18.5",
  "react": "^18.0.0",
  "next": "^14.0.0",
  "typescript": "^5.0.0",
  "@types/react": "^18.0.0",
  "@types/node": "^20.0.0"
}
```

### UI Component Dependencies

```json
{
  "@radix-ui/react-slot": "^1.0.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0",
  "lucide-react": "^0.300.0"
}
```

---

## 6. Configuration Files

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Tailwind Configuration

```javascript
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
    },
  },
  plugins: [],
};
```

---

## 7. File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── progress.tsx
│   └── cet-v22/
│       ├── CETv22ServiceDesign.tsx
│       ├── CETv22ResourceDashboard.tsx
│       ├── CETv22FileUpload.tsx
│       └── CETv22ProjectOverview.tsx
├── services/
│   ├── cet-v22-parser.ts
│   └── cet-v22-analyzer.ts
├── types/
│   └── index.ts
└── lib/
    └── utils.ts
```

---

## 8. Implementation Steps

### Step 1: Setup Project

1. Create Next.js project with TypeScript
2. Install required dependencies
3. Configure Tailwind CSS
4. Setup path aliases (@/\*)

### Step 2: Create Type Definitions

1. Copy type definitions from section 1
2. Ensure all interfaces are properly exported

### Step 3: Implement Parser Service

1. Create `cet-v22-parser.ts`
2. Implement Excel reading with xlsx library
3. Add Ph1Demand sheet processing logic
4. Include validation and error handling

### Step 4: Implement Analyzer Service

1. Create `cet-v22-analyzer.ts`
2. Implement domain breakdown analysis
3. Add percentage calculations
4. Include role aggregation logic

### Step 5: Create UI Components

1. Build base UI components (Card, Badge, Progress)
2. Create CETv22ResourceDashboard component
3. Implement domain breakdown visualization
4. Add responsive design and styling

### Step 6: Integration

1. Create main service design component
2. Connect parser → analyzer → UI flow
3. Add file upload functionality
4. Implement error handling and loading states

### Step 7: Testing

1. Test with sample Excel files
2. Verify column mapping (A, M, O)
3. Check data aggregation accuracy
4. Test UI responsiveness

---

## 9. Key Implementation Notes

### Excel File Requirements

- Must contain 'Ph1Demand' worksheet
- Headers in row 3 (index 2)
- Data starts from row 6 (index 5)
- Column A: Project Role
- Column M: Domain
- Column O: Total Mandate Effort

### Error Handling

- Validate Excel file structure
- Check for required columns
- Handle missing or invalid data
- Provide meaningful error messages

### Performance Considerations

- Use direct index access for column mapping
- Implement efficient data aggregation
- Consider large file handling
- Add loading states for better UX

### Debugging Features

- Console logging for data flow
- Debug information in UI
- Validation feedback
- Error boundary implementation

---

## 10. Sample Data Structure

### Expected Input (Ph1Demand Sheet)

```
Row 3: [Headers...]
Row 6: ['Program Directors', ..., 'Program', ..., 55.5, ...]
Row 7: ['Project Managers (Launch Lead)', ..., 'Program', ..., 57.5, ...]
```

### Expected Output (Domain Breakdown)

```typescript
[
  {
    domain: 'Program',
    totalEffort: 271.45,
    percentage: 12.2,
    roleBreakdown: [
      { role: 'Program Directors', effort: 55.5, percentage: 2.5 },
      { role: 'Project Managers (Launch Lead)', effort: 57.5, percentage: 2.6 },
    ],
  },
];
```

This implementation guide provides everything needed to rebuild the CET v22.0 Domain Breakdown functionality in a new application.
