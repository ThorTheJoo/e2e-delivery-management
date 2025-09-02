# CET v22.0 Resources Tab Update - Domain & Total Mandate Effort

## Overview

This document outlines the updates made to the Resources tab in the CET v22.0 Service Design page to display aggregated data by domain and total mandate effort estimates extracted from the Ph1Demand worksheet.

## Requirements

Based on the user request, the Resources tab needed to be updated to:

1. **Extract Domain Information**: From column M in the Ph1Demand worksheet
2. **Extract Total Mandate Effort**: From column O in the Ph1Demand worksheet  
3. **Aggregate by Project Role**: Group data by project role within each domain
4. **Display in Resources Tab**: Show domain breakdown with total mandate effort estimates

## Data Source

- **Worksheet**: Ph1Demand
- **Domain Column**: Column M (index 12)
- **Total Effort Column**: Column O (index 14)
- **Project Role Column**: Column A (existing)
- **Scope**: Only Phase 1 demands (Ph1Demand sheet)

## Implementation Changes

### 1. Type Definitions Updates (`src/types/index.ts`)

Added new interfaces to support domain and total mandate effort data:

```typescript
export interface CETv22ResourceDemand {
  // ... existing fields ...
  domain?: string; // Column M from Ph1Demand
  totalMandateEffort?: number; // Column O from Ph1Demand
}

export interface CETv22ResourceAnalysis {
  // ... existing fields ...
  domainBreakdown: CETv22DomainEffort[]; // New field for domain aggregation
}

// New interface for domain effort breakdown
export interface CETv22DomainEffort {
  domain: string;
  totalEffort: number;
  roleBreakdown: CETv22RoleEffort[];
  percentage: number;
}
```

### 2. Parser Service Updates (`src/services/cet-v22-parser.ts`)

Enhanced the `createResourceDemand` method to extract domain and total mandate effort:

```typescript
private createResourceDemand(row: any[], headers: string[], sheetName: string): CETv22ResourceDemand | null {
  // ... existing logic ...
  
  // Extract domain and total mandate effort for Ph1Demand sheet
  let domain: string | undefined;
  let totalMandateEffort: number | undefined;
  
  if (sheetName === 'Ph1Demand') {
    domain = this.getCellValue(row, headers, 'Domain') || this.getCellValueByIndex(row, 12); // Column M
    const totalEffortStr = this.getCellValue(row, headers, 'Total') || this.getCellValueByIndex(row, 14); // Column O
    totalMandateEffort = parseFloat(totalEffortStr) || undefined;
  }
  
  return {
    // ... existing fields ...
    domain,
    totalMandateEffort
  };
}

// Added utility method for direct column access
private getCellValueByIndex(row: any[], index: number): string {
  return index < row.length ? String(row[index]) : '';
}
```

### 3. Analyzer Service Updates (`src/services/cet-v22-analyzer.ts`)

Added domain breakdown analysis to the `analyzeResources` method:

```typescript
private analyzeResources(demands: any[], jobProfiles: any[]): CETv22ResourceAnalysis {
  // ... existing logic ...
  
  return {
    // ... existing fields ...
    domainBreakdown: this.analyzeDomainBreakdown(demands)
  };
}

// New method for domain analysis
private analyzeDomainBreakdown(demands: any[]): CETv22DomainEffort[] {
  const domainMap = new Map<string, { totalEffort: number; roleEfforts: Map<string, number> }>();
  
  // Filter only Ph1Demand data for domain analysis
  const ph1Demands = demands.filter(d => d.phaseNumber === 1 && d.domain && d.totalMandateEffort);
  
  // Aggregate data by domain and role
  ph1Demands.forEach(demand => {
    const domain = demand.domain || 'Unknown';
    const totalEffort = demand.totalMandateEffort || 0;
    const role = demand.jobProfile || 'Unknown';
    
    // ... aggregation logic ...
  });
  
  return Array.from(domainMap.entries()).map(([domain, data]) => ({
    domain,
    totalEffort: data.totalEffort,
    percentage: totalDomainEffort > 0 ? (data.totalEffort / totalDomainEffort) * 100 : 0,
    roleBreakdown: Array.from(data.roleEfforts.entries()).map(([role, effort]) => ({
      role,
      effort,
      percentage: data.totalEffort > 0 ? (effort / data.totalEffort) * 100 : 0
    }))
  }));
}
```

### 4. UI Component Updates (`src/components/cet-v22/CETv22ResourceDashboard.tsx`)

Added a new "Domain Breakdown & Total Mandate Effort" section to the Resources tab:

```typescript
{/* Domain Breakdown */}
{resourceAnalysis.domainBreakdown && resourceAnalysis.domainBreakdown.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle>Domain Breakdown & Total Mandate Effort</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {resourceAnalysis.domainBreakdown.map((domain, index) => (
          <div key={index} className="p-4 border rounded-lg">
            {/* Domain header with total effort */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">{domain.domain}</h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {domain.totalEffort.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
            </div>
            
            {/* Domain share progress bar */}
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
            
            {/* Role breakdown within domain */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Role Breakdown:</h4>
              {domain.roleBreakdown.map((role, roleIndex) => (
                <div key={roleIndex} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{role.role}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">{role.effort.toLocaleString()}h</span>
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
)}
```

## Data Flow

```
Ph1Demand Worksheet
├── Column A: Project Role
├── Column M: Domain
└── Column O: Total Mandate Effort
    ↓
Parser Service
├── Extract domain and total effort
├── Create CETv22ResourceDemand objects
└── Include domain and totalMandateEffort fields
    ↓
Analyzer Service
├── Filter Ph1Demand data
├── Aggregate by domain
├── Calculate role breakdown within domains
└── Generate CETv22DomainEffort objects
    ↓
ResourceDashboard Component
├── Display domain cards
├── Show total mandate effort per domain
├── Display domain share percentages
└── Show role breakdown within each domain
```

## Features

### 1. **Domain Cards**
- Each domain gets its own card with clear visual separation
- Domain name prominently displayed
- Total mandate effort shown in large, bold numbers

### 2. **Domain Share Visualization**
- Progress bar showing each domain's percentage of total effort
- Percentage values displayed numerically
- Visual representation of effort distribution

### 3. **Role Breakdown Within Domains**
- List of all roles within each domain
- Individual role effort hours
- Role percentage within the domain
- Badge indicators for quick reference

### 4. **Responsive Design**
- Cards adapt to different screen sizes
- Consistent spacing and typography
- Clear visual hierarchy

## Data Validation

The implementation includes several validation checks:

1. **Sheet Validation**: Only processes Ph1Demand worksheet data
2. **Data Completeness**: Requires both domain and totalMandateEffort to be present
3. **Numerical Validation**: Ensures totalMandateEffort is a valid number
4. **Fallback Handling**: Provides default values for missing data

## Error Handling

- Graceful handling of missing domain or effort data
- Fallback to column index-based extraction if header-based extraction fails
- Console warnings for parsing errors
- UI gracefully handles empty or invalid data

## Testing Considerations

To test this functionality:

1. **Upload a CET v22.0 file** with Ph1Demand worksheet containing:
   - Column A: Project Role data
   - Column M: Domain data
   - Column O: Total mandate effort data

2. **Verify the Resources tab** displays:
   - Domain breakdown cards
   - Total mandate effort estimates
   - Role breakdown within each domain
   - Percentage calculations

3. **Check data accuracy** by comparing:
   - Extracted values with Excel file
   - Calculated percentages
   - Aggregated totals

## Future Enhancements

Potential improvements for future iterations:

1. **Multi-Phase Support**: Extend domain analysis to other phases
2. **Interactive Charts**: Add charts and graphs for better visualization
3. **Export Functionality**: Allow export of domain breakdown data
4. **Filtering Options**: Add filters by domain, role, or effort range
5. **Comparison Views**: Compare domains side by side

## Summary

The Resources tab has been successfully updated to:

✅ **Extract domain information** from Ph1Demand worksheet (Column M)
✅ **Extract total mandate effort** from Ph1Demand worksheet (Column O)  
✅ **Aggregate data by domain** with role breakdowns
✅ **Display comprehensive domain analysis** in the Resources tab
✅ **Maintain existing functionality** without breaking other features
✅ **Provide clear visual representation** of domain and effort data

The implementation follows the existing code patterns and maintains consistency with the current UI design while adding the requested domain and total mandate effort functionality.
