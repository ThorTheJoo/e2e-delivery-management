# CET v22.0 Domain Breakdown - Complete Build Prompt

## 🎯 **Project Objective**
Build a complete CET v22.0 Service Design application with **Resource Domain Breakdown** functionality that aggregates "Project Role total days effort" data by "Domain" from Excel files.

## 📋 **Core Requirements**

### **Primary Functionality**
- Parse Excel files containing 'Ph1Demand' worksheet
- Extract data from specific columns:
  - **Column A (index 0)**: Project Role
  - **Column M (index 12)**: Domain  
  - **Column O (index 14)**: Total effort (mandays)
- Aggregate effort by domain and role
- Display breakdown in modern, responsive UI

### **Data Structure**
The system must handle Excel data starting from **row 6** (index 5) in the 'Ph1Demand' worksheet, with headers in row 3 (index 2).

## 🏗️ **Technical Architecture**

### **Technology Stack**
- **Frontend**: Next.js 14+ with React Server Components (RSC)
- **UI Framework**: Shadcn UI + Radix UI + Tailwind CSS
- **Language**: TypeScript (strict mode)
- **Data Processing**: Excel parsing with xlsx library
- **State Management**: React hooks (useState, useEffect, useCallback)

### **Project Structure**
```
src/
├── app/                    # Next.js App Router
├── components/            # React components
│   ├── ui/               # Shadcn UI primitives
│   └── cet-v22/          # CET-specific components
├── services/              # Business logic services
├── types/                 # TypeScript interfaces
├── lib/                   # Utilities and helpers
└── styles/                # Tailwind configuration
```

## 📊 **Data Models & Types**

### **Core Interfaces**
```typescript
interface CETv22ResourceDemand {
  weekNumber: number;
  weekDate: string;
  jobProfile: string;
  effortHours: number;
  resourceCount: number;
  productType: string;
  phaseNumber: number;
  complexityLevel?: string;
  domain?: string;                    // Column M from Ph1Demand
  totalMandateEffort?: number;        // Column O from Ph1Demand
}

interface CETv22DomainEffort {
  domain: string;
  totalEffort: number;
  percentage: number;
  roleBreakdown: CETv22RoleEffort[];
}

interface CETv22ResourceAnalysis {
  totalEffort: number;
  peakResources: number;
  averageResources: number;
  resourceUtilization: number;
  roleBreakdown: CETv22RoleEffort[];
  timelineAnalysis: CETv22TimelineData[];
  domainBreakdown: CETv22DomainEffort[];  // Key field for domain aggregation
}
```

## 🔧 **Core Services Implementation**

### **1. Excel Parser Service (`cet-v22-parser.ts`)**
**Critical Implementation Details:**
- **Header Detection**: Headers are in row 3 (index 2), data starts from row 6 (index 5)
- **Column Mapping**: Use direct indices, not header names (unreliable in Excel)
- **Ph1Demand Special Handling**: 
  - Set default values: `weekNumber = 1`, `effortHours = 0`, `resourceCount = 1`
  - Extract `jobProfile` from column A (index 0)
  - Extract `domain` from column M (index 12)
  - Extract `totalMandateEffort` from column O (index 14)

**Key Methods:**
```typescript
private processDemandSheet(worksheet: XLSX.WorkSheet, sheetName: string): CETv22ResourceDemand[] {
  // Start from row 6 (index 5), headers in row 3 (index 2)
  const dataRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }).slice(5);
  const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[2];
  
  return dataRows
    .filter(row => this.isValidDemandRow(row, headers))
    .map(row => this.createResourceDemand(row, headers, sheetName))
    .filter(Boolean);
}

private isValidDemandRow(row: any[], headers: string[]): boolean {
  if (headers.length > 14 && row.length > 14) {
    const domain = String(row[12] || '').trim();        // Column M
    const totalEffort = parseFloat(String(row[14] || '')); // Column O
    return domain.length > 0 && !isNaN(totalEffort) && totalEffort > 0;
  }
  // Fallback for other sheets
  return false;
}
```

### **2. Data Analyzer Service (`cet-v22-analyzer.ts`)**
**Domain Breakdown Logic:**
```typescript
private analyzeDomainBreakdown(demands: any[]): CETv22DomainEffort[] {
  const domainMap = new Map<string, { totalEffort: number; roleEfforts: Map<string, number> }>();
  
  // Filter only Ph1Demand data with domain and totalMandateEffort
  const ph1Demands = demands.filter(d => 
    d.phaseNumber === 1 && d.domain && d.totalMandateEffort
  );
  
  ph1Demands.forEach(demand => {
    const domain = demand.domain || 'Unknown';
    const effort = demand.totalMandateEffort || 0;
    
    if (!domainMap.has(domain)) {
      domainMap.set(domain, { totalEffort: 0, roleEfforts: new Map<string, number>() });
    }
    
    const domainData = domainMap.get(domain)!;
    domainData.totalEffort += effort;
    
    const role = demand.jobProfile || 'Unknown';
    if (!domainData.roleEfforts.has(role)) {
      domainData.roleEfforts.set(role, 0);
    }
    domainData.roleEfforts.set(role, domainData.roleEfforts.get(role)! + effort);
  });
  
  const totalEffort = Array.from(domainMap.values())
    .reduce((sum, data) => sum + data.totalEffort, 0);
  
  return Array.from(domainMap.entries()).map(([domain, data]) => ({
    domain,
    totalEffort: data.totalEffort,
    percentage: totalEffort > 0 ? (data.totalEffort / totalEffort) * 100 : 0,
    roleBreakdown: Array.from(data.roleEfforts.entries()).map(([role, effort]) => ({
      role,
      effort,
      percentage: totalEffort > 0 ? (effort / totalEffort) * 100 : 0
    }))
  }));
}
```

## 🎨 **UI Components Implementation**

### **1. Main Service Design Component (`CETv22ServiceDesign.tsx`)**
**State Management:**
```typescript
const [activeTab, setActiveTab] = useState('upload');
const [processingState, setProcessingState] = useState<ProcessingState>('idle');
const [progress, setProgress] = useState(0);
const [cetData, setCetData] = useState<CETv22Data | null>(null);
const [analysisResult, setAnalysisResult] = useState<CETv22AnalysisResult | null>(null);
const [error, setError] = useState<string | null>(null);
```

**File Processing Flow:**
1. File upload validation
2. Excel parsing with progress tracking
3. Data analysis and domain breakdown calculation
4. Results display in Resources tab

### **2. Resource Dashboard Component (`CETv22ResourceDashboard.tsx`)**
**Domain Breakdown Section:**
```typescript
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
                <div key={roleIndex} className="flex justify-between text-sm">
                  <span>{role.role}</span>
                  <span>{role.effort.toFixed(1)}h ({role.percentage.toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
) : (
  // Fallback message for no data
)}
```

## 🚀 **Implementation Steps**

### **Phase 1: Project Setup**
1. Create Next.js 14+ project with TypeScript
2. Install dependencies: `xlsx`, `shadcn-ui`, `@radix-ui/react-*`, `tailwindcss`
3. Configure Tailwind CSS and Shadcn UI
4. Set up project structure as outlined above

### **Phase 2: Core Services**
1. Implement `CETv22Parser` service with exact column mapping logic
2. Implement `CETv22Analyzer` service with domain breakdown algorithm
3. Create TypeScript interfaces for all data structures
4. Add comprehensive error handling and validation

### **Phase 3: UI Components**
1. Build main `CETv22ServiceDesign` component with tab navigation
2. Create `CETv22ResourceDashboard` with domain breakdown display
3. Implement file upload with progress tracking
4. Add responsive design and accessibility features

### **Phase 4: Integration & Testing**
1. Connect parser → analyzer → UI data flow
2. Test with sample Excel files containing 'Ph1Demand' worksheet
3. Verify domain breakdown calculations and percentages
4. Test error handling and edge cases

## 🔍 **Critical Success Factors**

### **Data Extraction Accuracy**
- **Row 6 Start**: Data processing must begin from row 6 (index 5)
- **Column Indices**: Use exact indices (A=0, M=12, O=14), not header names
- **Ph1Demand Handling**: Special logic for this worksheet with default values

### **Domain Breakdown Logic**
- Filter only Phase 1 demands with valid domain and effort data
- Calculate percentages based on total effort across all domains
- Provide role-level breakdown within each domain

### **UI Responsiveness**
- Mobile-first design with Tailwind CSS
- Accessible components with ARIA labels
- Loading states and error handling
- Progress indicators for file processing

## 📚 **Reference Documentation**

The following markdown files contain detailed implementation specifications:

1. **`CETv22-Component-Architecture.md`** - Complete component structure and relationships
2. **`CETv22-Excel-Parser-Specification.md`** - Detailed parser implementation with exact column mappings
3. **`CETv22-UI-Components-Specification.md`** - UI component specifications and styling
4. **`CETv22-Data-Analysis-Algorithms.md`** - Domain breakdown calculation algorithms
5. **`CETv22-Project-Setup-Guide.md`** - Project initialization and configuration
6. **`README-CETv22-Implementation.md`** - High-level overview and implementation guide

## 🎯 **Expected Output**

A fully functional web application that:
- Accepts Excel file uploads
- Parses 'Ph1Demand' worksheet data correctly
- Displays domain breakdown with effort totals and percentages
- Shows role-level breakdown within each domain
- Provides responsive, accessible UI
- Handles errors gracefully with user feedback

## ⚠️ **Common Pitfalls to Avoid**

1. **Header Name Dependency**: Don't rely on Excel header names; use column indices
2. **Row Starting Point**: Data starts at row 6, not row 1
3. **Ph1Demand Special Cases**: This worksheet needs default values and special handling
4. **Type Safety**: Use strict TypeScript with proper interfaces
5. **Error Handling**: Implement comprehensive error handling for file parsing and data processing

## 🚀 **Ready to Build**

This prompt provides all the technical details, code examples, and implementation guidance needed to rebuild the CET v22.0 Domain Breakdown functionality. Follow the phases sequentially, reference the markdown files for detailed specifications, and ensure the critical success factors are met for a successful implementation.
