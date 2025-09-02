# CET v22.0 Development Guide

## Quick Start

This guide provides everything you need to implement the CET v22.0 integration into your E2E Delivery Management System. Follow the phases outlined below to build a robust, scalable integration.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Next.js 14+ project setup
- TypeScript 5.0+
- Access to CET v22.0 Excel files for testing

### Installation
```bash
# Install core dependencies
npm install xlsx zod @types/xlsx

# Install development dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Install UI components (if not already present)
npm install @radix-ui/react-* class-variance-authority clsx tailwind-merge
```

## 📁 Project Structure

```
src/
├── components/
│   └── cet-v22/                    # CET integration components
│       ├── CETv22MainContainer.tsx # Main container component
│       ├── CETv22FileUpload.tsx    # File upload interface
│       ├── CETv22AnalysisDashboard.tsx # Analysis results display
│       └── CETv22IntegrationPanel.tsx  # Integration management
├── services/
│   └── cet-v22/                    # Business logic services
│       ├── FileParserService.ts     # Excel file parsing
│       ├── DataAnalyzerService.ts   # Data analysis engine
│       └── IntegrationService.ts    # System integration
├── types/
│   └── cet-v22.ts                  # TypeScript type definitions
├── utils/
│   └── cet-v22/                    # Utility functions
│       ├── dataTransformers.ts     # Data transformation logic
│       ├── validators.ts           # Data validation
│       └── calculators.ts          # Business calculations
└── api/
    └── cet-v22/                    # API endpoints
        ├── upload.ts               # File upload handler
        ├── analyze.ts              # Analysis trigger
        └── integrate.ts            # Integration execution
```

## 🔧 Core Implementation

### 1. **Type Definitions**

Start by defining your core types in `src/types/cet-v22.ts`:

```typescript
// Core CET data structures
export interface CETData {
  project: CETProject;
  phases: CETPhase[];
  products: CETProduct[];
  jobProfiles: CETJobProfile[];
  resourceDemands: CETResourceDemand[];
  lookupValues: CETLookupValue[];
  dealTypes: CETDealType[];
}

export interface CETProject {
  customerName: string;
  projectName: string;
  digitalTelco: string;
  region: string;
  language: string;
  sfdcType: string;
  createdDate: string;
  status: string;
}

export interface CETResourceDemand {
  weekNumber: number;
  weekDate: string;
  jobProfile: string;
  effortHours: number;
  resourceCount: number;
  productType: string;
  phaseNumber: number;
}

// Integration mapping types
export interface IntegrationMappings {
  toWorkPackages: WorkPackageMapping[];
  toMilestones: MilestoneMapping[];
  toResources: ResourceMapping[];
  toRisks: RiskMapping[];
  confidence: MappingConfidence;
}
```

### 2. **File Parser Service**

Implement the core Excel parsing logic in `src/services/cet-v22/FileParserService.ts`:

```typescript
import * as XLSX from 'xlsx';
import { CETData, CETProject, CETResourceDemand } from '@/types/cet-v22';

export class FileParserService {
  async parseExcelFile(fileBuffer: Buffer): Promise<CETData> {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheets = this.extractSheets(workbook);
      
      return {
        project: this.extractProjectInfo(sheets.Attributes),
        resourceDemands: this.extractResourceDemands(sheets),
        jobProfiles: this.extractJobProfiles(sheets.JobProfiles),
        phases: this.analyzePhases(sheets),
        products: this.analyzeProducts(sheets),
        lookupValues: this.extractLookupValues(sheets),
        dealTypes: this.extractDealTypes(sheets)
      };
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }

  private extractSheets(workbook: XLSX.WorkBook): Record<string, any[][]> {
    const sheets: Record<string, any[][]> = {};
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    });
    
    return sheets;
  }

  private extractProjectInfo(attributesSheet: any[][]): CETProject {
    // Implementation for extracting project information
    // Navigate the sheet structure to find key project data
    return {
      customerName: this.findCellValue(attributesSheet, 'Customer Name'),
      projectName: this.findCellValue(attributesSheet, 'Project Name'),
      digitalTelco: this.findCellValue(attributesSheet, 'Digital Telco'),
      region: this.findCellValue(attributesSheet, 'Region'),
      language: this.findCellValue(attributesSheet, 'Language'),
      sfdcType: this.findCellValue(attributesSheet, 'SFDC Type'),
      createdDate: this.findCellValue(attributesSheet, 'Created Date'),
      status: this.findCellValue(attributesSheet, 'Status')
    };
  }

  private extractResourceDemands(sheets: Record<string, any[][]>): CETResourceDemand[] {
    const demands: CETResourceDemand[] = [];
    const demandSheets = ['Ph1Demand', 'Ph2Demand', 'Ph3Demand', 'Ph4Demand'];
    
    demandSheets.forEach(sheetName => {
      if (sheets[sheetName]) {
        const sheetDemands = this.processDemandSheet(sheets[sheetName], sheetName);
        demands.push(...sheetDemands);
      }
    });
    
    return demands;
  }

  private processDemandSheet(sheetData: any[][], sheetName: string): CETResourceDemand[] {
    const demands: CETResourceDemand[] = [];
    const headers = sheetData[0];
    
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (this.isValidDemandRow(row, headers)) {
        demands.push({
          weekNumber: parseInt(row[this.getColumnIndex(headers, 'Week Number')]),
          weekDate: row[this.getColumnIndex(headers, 'Week Date')],
          jobProfile: row[this.getColumnIndex(headers, 'Job Profile')],
          effortHours: parseFloat(row[this.getColumnIndex(headers, 'Effort Hours')]),
          resourceCount: parseInt(row[this.getColumnIndex(headers, 'Resource Count')]),
          productType: this.getProductTypeFromSheet(sheetName),
          phaseNumber: this.getPhaseFromSheet(sheetName)
        });
      }
    }
    
    return demands;
  }

  private findCellValue(sheet: any[][], searchTerm: string): string {
    for (const row of sheet) {
      const index = row.findIndex(cell => 
        typeof cell === 'string' && cell.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (index !== -1 && row[index + 1]) {
        return row[index + 1].toString();
      }
    }
    return '';
  }

  private getColumnIndex(headers: string[], columnName: string): number {
    return headers.findIndex(header => 
      header.toLowerCase().includes(columnName.toLowerCase())
    );
  }

  private isValidDemandRow(row: any[], headers: string[]): boolean {
    const weekIndex = this.getColumnIndex(headers, 'Week Number');
    const effortIndex = this.getColumnIndex(headers, 'Effort Hours');
    
    return weekIndex !== -1 && 
           effortIndex !== -1 && 
           !isNaN(parseInt(row[weekIndex])) && 
           !isNaN(parseFloat(row[effortIndex]));
  }

  private getProductTypeFromSheet(sheetName: string): string {
    const mapping: Record<string, string> = {
      'Ph1Demand': 'Phase 1',
      'Ph2Demand': 'Phase 2',
      'Ph3Demand': 'Phase 3',
      'Ph4Demand': 'Phase 4',
      'GovDemand': 'Governance',
      'ENCDemand': 'Encompass',
      'ASCDemand': 'Ascendon',
      'CMADemand': 'CMA'
    };
    return mapping[sheetName] || sheetName;
  }

  private getPhaseFromSheet(sheetName: string): number {
    if (sheetName.includes('Ph1')) return 1;
    if (sheetName.includes('Ph2')) return 2;
    if (sheetName.includes('Ph3')) return 3;
    if (sheetName.includes('Ph4')) return 4;
    return 1;
  }
}
```

### 3. **Data Analyzer Service**

Implement the analysis logic in `src/services/cet-v22/DataAnalyzerService.ts`:

```typescript
import { CETData, CETAnalysisResult } from '@/types/cet-v22';

export class DataAnalyzerService {
  async analyzeCETData(rawData: CETData): Promise<CETAnalysisResult> {
    try {
      const analysisStart = Date.now();
      
      const projectAnalysis = this.analyzeProject(rawData.project);
      const resourceAnalysis = this.analyzeResources(rawData.resourceDemands);
      const effortAnalysis = this.analyzeEffort(rawData.resourceDemands);
      const phaseAnalysis = this.analyzePhases(rawData.resourceDemands);
      const productAnalysis = this.analyzeProducts(rawData.resourceDemands);
      const riskAnalysis = this.analyzeRisks(rawData.resourceDemands, rawData.jobProfiles);
      
      const analysisTime = Date.now() - analysisStart;
      
      return {
        project: projectAnalysis,
        resources: resourceAnalysis,
        effort: effortAnalysis,
        phases: phaseAnalysis,
        products: productAnalysis,
        risks: riskAnalysis,
        metadata: {
          analyzedAt: new Date().toISOString(),
          analysisTime,
          confidence: this.calculateConfidence(rawData),
          dataQuality: this.assessDataQuality(rawData)
        }
      };
    } catch (error) {
      throw new Error(`Failed to analyze CET data: ${error.message}`);
    }
  }

  private analyzeProject(projectInfo: any): any {
    return {
      customerName: projectInfo.customerName,
      projectName: projectInfo.projectName,
      digitalTelco: projectInfo.digitalTelco,
      region: projectInfo.region,
      complexity: this.assessProjectComplexity(projectInfo),
      riskFactors: this.identifyProjectRisks(projectInfo)
    };
  }

  private analyzeResources(demands: any[]): any {
    const totalEffort = demands.reduce((sum, demand) => sum + demand.effortHours, 0);
    const peakResources = Math.max(...demands.map(d => d.resourceCount));
    const avgResources = demands.reduce((sum, demand) => sum + demand.resourceCount, 0) / demands.length;
    
    return {
      totalEffort,
      peakResources,
      averageResources: Math.round(avgResources),
      resourceUtilization: this.calculateResourceUtilization(demands),
      roleBreakdown: this.analyzeRoleBreakdown(demands)
    };
  }

  private analyzeEffort(demands: any[]): any {
    const phaseEfforts = new Map<number, number>();
    const weeklyEfforts = new Map<number, number>();
    
    demands.forEach(demand => {
      const currentPhaseEffort = phaseEfforts.get(demand.phaseNumber) || 0;
      phaseEfforts.set(demand.phaseNumber, currentPhaseEffort + demand.effortHours);
      
      const currentWeeklyEffort = weeklyEfforts.get(demand.weekNumber) || 0;
      weeklyEfforts.set(demand.weekNumber, currentWeeklyEffort + demand.effortHours);
    });
    
    return {
      phaseBreakdown: Array.from(phaseEfforts.entries()).map(([phase, effort]) => ({
        phaseNumber: phase,
        totalEffort: effort,
        percentage: (effort / this.calculateTotalEffort(demands)) * 100
      })),
      weeklyBreakdown: Array.from(weeklyEfforts.entries()).map(([week, effort]) => ({
        weekNumber: week,
        totalEffort: effort
      })),
      totalEffort: this.calculateTotalEffort(demands)
    };
  }

  private calculateTotalEffort(demands: any[]): number {
    return demands.reduce((sum, demand) => sum + demand.effortHours, 0);
  }

  private calculateResourceUtilization(demands: any[]): number {
    const totalEffort = this.calculateTotalEffort(demands);
    const totalResources = demands.reduce((sum, demand) => sum + demand.resourceCount, 0);
    const avgResources = totalResources / demands.length;
    
    return totalEffort / (avgResources * 40); // Assuming 40 hours per week
  }

  private analyzeRoleBreakdown(demands: any[]): any {
    const roleEfforts = new Map<string, number>();
    
    demands.forEach(demand => {
      const currentEffort = roleEfforts.get(demand.jobProfile) || 0;
      roleEfforts.set(demand.jobProfile, currentEffort + demand.effortHours);
    });
    
    return Array.from(roleEfforts.entries()).map(([role, effort]) => ({
      role,
      effort,
      percentage: (effort / this.calculateTotalEffort(demands)) * 100
    }));
  }

  private assessProjectComplexity(projectInfo: any): string {
    // Implement complexity assessment logic
    return 'Medium';
  }

  private identifyProjectRisks(projectInfo: any): string[] {
    // Implement risk identification logic
    return [];
  }

  private calculateConfidence(rawData: CETData): number {
    // Implement confidence calculation logic
    return 0.85;
  }

  private assessDataQuality(rawData: CETData): string {
    // Implement data quality assessment logic
    return 'Good';
  }
}
```

### 4. **Integration Service**

Implement the integration logic in `src/services/cet-v22/IntegrationService.ts`:

```typescript
import { CETAnalysisResult, IntegrationMappings, IntegrationResult } from '@/types/cet-v22';

export class IntegrationService {
  async integrateCETData(
    analysisResult: CETAnalysisResult,
    options: any
  ): Promise<IntegrationResult> {
    try {
      const integrationStart = Date.now();
      const integrationId = this.generateIntegrationId();
      
      // Generate integration mappings
      const mappings = this.generateIntegrationMappings(analysisResult);
      
      // Execute integration based on options
      const results = await this.executeIntegration(mappings, options);
      
      const integrationTime = Date.now() - integrationStart;
      
      return {
        integrationId,
        success: true,
        results,
        metadata: {
          integratedAt: new Date().toISOString(),
          integrationTime,
          options,
          mappings
        }
      };
    } catch (error) {
      throw new Error(`Failed to integrate CET data: ${error.message}`);
    }
  }

  private generateIntegrationMappings(analysis: CETAnalysisResult): IntegrationMappings {
    return {
      toWorkPackages: this.mapToWorkPackages(analysis),
      toMilestones: this.mapToMilestones(analysis),
      toResources: this.mapToResources(analysis),
      toRisks: this.mapToRisks(analysis),
      confidence: this.calculateMappingConfidence(analysis)
    };
  }

  private mapToWorkPackages(analysis: CETAnalysisResult): any[] {
    return analysis.products.map(product => ({
      cetProduct: product.name,
      workPackageName: `${product.name} Implementation`,
      estimatedEffort: this.distributeEffortByRole(product.totalEffort),
      confidence: this.assessWorkPackageConfidence(product),
      dependencies: [],
      milestones: []
    }));
  }

  private mapToMilestones(analysis: CETAnalysisResult): any[] {
    return analysis.phases.map(phase => ({
      cetPhase: phase.phaseNumber,
      milestoneName: `Phase ${phase.phaseNumber} Completion`,
      estimatedDate: this.calculatePhaseEndDate(phase),
      deliverables: this.generatePhaseDeliverables(phase.phaseNumber),
      dependencies: []
    }));
  }

  private mapToResources(analysis: CETAnalysisResult): any[] {
    return analysis.resources.roleBreakdown.map(role => ({
      cetJobProfile: role.role,
      resourceRole: role.role,
      skillLevel: 'Intermediate',
      costCenter: 'Default',
      availability: 40
    }));
  }

  private mapToRisks(analysis: CETAnalysisResult): any[] {
    const risks: any[] = [];
    
    // Identify risks based on effort concentration
    analysis.products.forEach(product => {
      if (product.totalEffort > 2000) {
        risks.push({
          source: product.name,
          riskName: `${product.name} Complexity Risk`,
          probability: 'Medium',
          impact: 'High',
          mitigation: `Implement phased delivery approach for ${product.name}`
        });
      }
    });
    
    return risks;
  }

  private distributeEffortByRole(totalEffort: number): any {
    return {
      businessAnalyst: Math.round(totalEffort * 0.15),
      solutionArchitect: Math.round(totalEffort * 0.20),
      developer: Math.round(totalEffort * 0.50),
      qaEngineer: Math.round(totalEffort * 0.15)
    };
  }

  private assessWorkPackageConfidence(product: any): string {
    if (product.totalEffort > 1000) return 'High';
    if (product.totalEffort > 500) return 'Medium';
    return 'Low';
  }

  private calculatePhaseEndDate(phase: any): string {
    // Implementation for calculating phase end date
    return new Date().toISOString().split('T')[0];
  }

  private generatePhaseDeliverables(phaseNumber: number): string[] {
    const deliverables: Record<number, string[]> = {
      1: ['Requirements Document', 'Project Charter', 'Team Setup'],
      2: ['Technical Design', 'Architecture Document', 'Development Plan'],
      3: ['Core Implementation', 'Unit Tests', 'Integration Tests'],
      4: ['System Testing', 'User Acceptance Testing', 'Go-Live Preparation']
    };
    return deliverables[phaseNumber] || [`Phase ${phaseNumber} Deliverables`];
  }

  private calculateMappingConfidence(analysis: CETAnalysisResult): any {
    return {
      overall: 0.85,
      workPackages: 0.90,
      milestones: 0.85,
      resources: 0.80,
      risks: 0.75
    };
  }

  private async executeIntegration(mappings: IntegrationMappings, options: any): Promise<any> {
    const results = {
      created: { workPackages: 0, milestones: 0, resources: 0, risks: 0 },
      updated: { workPackages: 0, milestones: 0, resources: 0, risks: 0 },
      skipped: { workPackages: 0, milestones: 0, resources: 0, risks: 0 }
    };

    if (options.createWorkPackages) {
      results.created.workPackages = mappings.toWorkPackages.length;
    }

    if (options.createMilestones) {
      results.created.milestones = mappings.toMilestones.length;
    }

    if (options.allocateResources) {
      results.created.resources = mappings.toResources.length;
    }

    if (options.identifyRisks) {
      results.created.risks = mappings.toRisks.length;
    }

    return results;
  }

  private generateIntegrationId(): string {
    return `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## 🎨 UI Components

### 1. **Main Container Component**

Create the main container in `src/components/cet-v22/CETv22MainContainer.tsx`:

```typescript
'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CETv22FileUpload } from './CETv22FileUpload';
import { CETv22AnalysisDashboard } from './CETv22AnalysisDashboard';
import { CETv22IntegrationPanel } from './CETv22IntegrationPanel';
import { CETv22ResultsViewer } from './CETv22ResultsViewer';
import { CETData, CETAnalysisResult, IntegrationMappings } from '@/types/cet-v22';

interface CETv22MainContainerProps {
  onIntegrationComplete?: (result: any) => void;
  onError?: (error: Error) => void;
}

export const CETv22MainContainer: React.FC<CETv22MainContainerProps> = ({
  onIntegrationComplete,
  onError
}) => {
  const [cetData, setCetData] = useState<CETData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CETAnalysisResult | null>(null);
  const [integrationMappings, setIntegrationMappings] = useState<IntegrationMappings | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

  const handleFileProcessed = useCallback((data: CETData) => {
    setCetData(data);
    setActiveTab('analysis');
  }, []);

  const handleAnalysisComplete = useCallback((result: CETAnalysisResult) => {
    setAnalysisResult(result);
    setActiveTab('integration');
  }, []);

  const handleIntegrationComplete = useCallback((mappings: IntegrationMappings) => {
    setIntegrationMappings(mappings);
    setActiveTab('results');
    onIntegrationComplete?.(mappings);
  }, [onIntegrationComplete]);

  const handleError = useCallback((error: Error) => {
    onError?.(error);
  }, [onError]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 CET v22.0 Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload">File Upload</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="integration">Integration</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <CETv22FileUpload
                onFileProcessed={handleFileProcessed}
                onError={handleError}
              />
            </TabsContent>

            <TabsContent value="analysis">
              {cetData && (
                <CETv22AnalysisDashboard
                  cetData={cetData}
                  onAnalysisComplete={handleAnalysisComplete}
                  onError={handleError}
                />
              )}
            </TabsContent>

            <TabsContent value="integration">
              {analysisResult && (
                <CETv22IntegrationPanel
                  analysisResult={analysisResult}
                  onIntegrationComplete={handleIntegrationComplete}
                  onError={handleError}
                />
              )}
            </TabsContent>

            <TabsContent value="results">
              {integrationMappings && (
                <CETv22ResultsViewer
                  mappings={integrationMappings}
                  onExport={() => {/* Implement export logic */}}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 2. **File Upload Component**

Create the file upload component in `src/components/cet-v22/CETv22FileUpload.tsx`:

```typescript
'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { CETData } from '@/types/cet-v22';

interface CETv22FileUploadProps {
  onFileProcessed: (data: CETData) => void;
  onError: (error: Error) => void;
}

export const CETv22FileUpload: React.FC<CETv22FileUploadProps> = ({
  onFileProcessed,
  onError
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  }, []);

  const handleFileProcess = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      setProgress(0);
      setError(null);

      // Simulate file processing with progress updates
      setProgress(25);
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress(50);
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress(75);
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress(100);

      // Mock data for demonstration
      const mockData: CETData = {
        project: {
          customerName: 'Demo Customer',
          projectName: 'Demo Project',
          digitalTelco: 'Standard',
          region: 'Global',
          language: 'English',
          sfdcType: 'New Business',
          createdDate: '2025-01-15',
          status: 'Draft'
        },
        phases: [],
        products: [],
        jobProfiles: [],
        resourceDemands: [],
        lookupValues: [],
        dealTypes: []
      };

      onFileProcessed(mockData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error.message);
      onError(error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, onFileProcessed, onError]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload CET v22.0 Excel File</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="cet-file" className="cursor-pointer">
              <span className="text-sm text-gray-600">
                Click to select or drag and drop
              </span>
              <input
                id="cet-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Supports .xlsx and .xls files up to 50MB
          </p>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <FileText className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">{selectedFile.name}</span>
            <span className="text-xs text-gray-500">
              ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
        )}

        {error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing file...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        <Button
          onClick={handleFileProcess}
          disabled={!selectedFile || isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : 'Process File'}
        </Button>
      </CardContent>
    </Card>
  );
};
```

## 🔌 API Integration

### 1. **File Upload API**

Create the upload API endpoint in `src/app/api/cet-v22/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { FileParserService } from '@/services/cet-v22/FileParserService';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!['.xlsx', '.xls'].includes(file.name.toLowerCase().substring(file.name.lastIndexOf('.')))) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .xlsx and .xls files are supported.' },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the Excel file
    const parser = new FileParserService();
    const cetData = await parser.parseExcelFile(buffer);

    return NextResponse.json({
      success: true,
      data: cetData,
      fileName: file.name,
      fileSize: file.size,
      processedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}
```

### 2. **Analysis API**

Create the analysis API endpoint in `src/app/api/cet-v22/analyze/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { DataAnalyzerService } from '@/services/cet-v22/DataAnalyzerService';

export async function POST(request: NextRequest) {
  try {
    const { cetData } = await request.json();
    
    if (!cetData) {
      return NextResponse.json(
        { error: 'No CET data provided' },
        { status: 400 }
      );
    }

    // Analyze the CET data
    const analyzer = new DataAnalyzerService();
    const analysisResult = await analyzer.analyzeCETData(cetData);

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze data' },
      { status: 500 }
    );
  }
}
```

### 3. **Integration API**

Create the integration API endpoint in `src/app/api/cet-v22/integrate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { IntegrationService } from '@/services/cet-v22/IntegrationService';

export async function POST(request: NextRequest) {
  try {
    const { analysisResult, options } = await request.json();
    
    if (!analysisResult) {
      return NextResponse.json(
        { error: 'No analysis result provided' },
        { status: 400 }
      );
    }

    // Execute integration
    const integration = new IntegrationService();
    const integrationResult = await integration.integrateCETData(analysisResult, options);

    return NextResponse.json({
      success: true,
      integration: integrationResult,
      integratedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Integration error:', error);
    return NextResponse.json(
      { error: 'Failed to integrate data' },
      { status: 500 }
    );
  }
}
```

## 🧪 Testing

### 1. **Unit Tests**

Create test files for your services:

```typescript
// src/services/cet-v22/__tests__/FileParserService.test.ts
import { FileParserService } from '../FileParserService';

describe('FileParserService', () => {
  let service: FileParserService;

  beforeEach(() => {
    service = new FileParserService();
  });

  describe('parseExcelFile', () => {
    it('should parse valid Excel file', async () => {
      // Create mock Excel buffer
      const mockBuffer = Buffer.from('mock excel data');
      
      // Mock XLSX.read to return test data
      jest.mock('xlsx', () => ({
        read: jest.fn().mockReturnValue({
          SheetNames: ['Attributes', 'Ph1Demand'],
          Sheets: {
            Attributes: {},
            Ph1Demand: {}
          }
        }),
        utils: {
          sheet_to_json: jest.fn().mockReturnValue([])
        }
      }));

      const result = await service.parseExcelFile(mockBuffer);
      
      expect(result).toBeDefined();
      expect(result.project).toBeDefined();
      expect(result.resourceDemands).toBeDefined();
    });

    it('should handle parsing errors gracefully', async () => {
      const invalidBuffer = Buffer.from('invalid data');
      
      await expect(service.parseExcelFile(invalidBuffer))
        .rejects
        .toThrow('Failed to parse Excel file');
    });
  });
});
```

### 2. **Integration Tests**

Test the complete workflow:

```typescript
// src/components/cet-v22/__tests__/CETv22MainContainer.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CETv22MainContainer } from '../CETv22MainContainer';

describe('CETv22MainContainer', () => {
  it('should render all tabs', () => {
    render(<CETv22MainContainer />);
    
    expect(screen.getByText('File Upload')).toBeInTheDocument();
    expect(screen.getByText('Analysis')).toBeInTheDocument();
    expect(screen.getByText('Integration')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
  });

  it('should start with upload tab active', () => {
    render(<CETv22MainContainer />);
    
    expect(screen.getByText('Upload CET v22.0 Excel File')).toBeInTheDocument();
  });
});
```

## 🚀 Deployment

### 1. **Environment Configuration**

Create environment variables:

```bash
# .env.local
CET_MAX_FILE_SIZE=52428800
CET_ALLOWED_FILE_TYPES=.xlsx,.xls
CET_PROCESSING_TIMEOUT=300000
CET_CACHE_TTL=1800000
```

### 2. **Build Configuration**

Update your `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['xlsx']
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false
    };
    return config;
  }
};

module.exports = nextConfig;
```

### 3. **Production Considerations**

- Implement proper error logging and monitoring
- Add rate limiting for file uploads
- Set up file size limits appropriate for your infrastructure
- Implement proper security headers
- Add health checks for the integration services

## 📚 Additional Resources

### 1. **Documentation Files**
- `CET-v22-Analysis-Overview.md` - High-level overview
- `CET-v22-Data-Structure-Analysis.md` - Detailed data analysis
- `CET-v22-Integration-Architecture.md` - System architecture
- `CET-v22-UI-Component-Design.md` - UI component specifications
- `CET-v22-API-Service-Layer.md` - API service details
- `CET-v22-Implementation-Roadmap.md` - Development timeline
- `CET-v22-Data-Mapping-Strategy.md` - Data transformation logic

### 2. **Key Dependencies**
- **XLSX.js**: Excel file processing
- **Zod**: Data validation
- **Radix UI**: Accessible UI components
- **Tailwind CSS**: Styling
- **TypeScript**: Type safety

### 3. **Testing Strategy**
- Unit tests for all services
- Integration tests for API endpoints
- Component tests for UI elements
- End-to-end tests for complete workflows

## 🔍 Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check file size limits
   - Verify file type restrictions
   - Ensure proper error handling

2. **Parsing Errors**
   - Validate Excel file structure
   - Check for required sheets
   - Verify data format consistency

3. **Integration Failures**
   - Check mapping configurations
   - Validate data transformations
   - Review error logs

### Debug Mode

Enable debug logging:

```typescript
// Add to your environment
DEBUG_CET=true

// Use in your services
if (process.env.DEBUG_CET) {
  console.log('CET Debug:', { data, step, result });
}
```

---

*This development guide provides everything you need to implement the CET v22.0 integration. Follow the phases, implement the components, and test thoroughly before deployment.*
