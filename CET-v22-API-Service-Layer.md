# CET v22.0 API Service Layer

## Service Architecture Overview

The CET v22.0 API service layer provides a robust backend infrastructure for processing Excel files, analyzing data, and integrating with your delivery management system. This layer follows RESTful principles with comprehensive error handling and validation.

## Core Service Components

### 1. **File Processing Service**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  File Upload   │───▶│  File Parser    │───▶│  Data Validator │
│   Handler      │    │   Service       │    │   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2. **Analysis Service**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Raw Data      │───▶│  Data Analyzer  │───▶│  Report         │
│  Processor     │    │   Service       │    │  Generator      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 3. **Integration Service**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Analysis      │───▶│  Data Mapper    │───▶│  Delivery       │
│  Results       │    │   Service       │    │  System         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## API Endpoints

### 1. **File Management Endpoints**

#### POST `/api/cet/upload`
```typescript
// Upload CET Excel file
interface UploadRequest {
  file: File;
  projectId?: string;
  options: {
    validateOnly: boolean;
    createDraft: boolean;
    overwriteExisting: boolean;
    processImmediately: boolean;
  };
}

interface UploadResponse {
  success: boolean;
  fileId: string;
  fileName: string;
  fileSize: number;
  uploadTime: string;
  validationResult: ValidationResult;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errors: string[];
  warnings: string[];
}

// Response Example
{
  "success": true,
  "fileId": "cet_20250115_123456",
  "fileName": "CET_v22_Test_Load.xlsx",
  "fileSize": 946176,
  "uploadTime": "2025-01-15T12:34:56Z",
  "validationResult": {
    "isValid": true,
    "sheetCount": 27,
    "dataRows": 2006,
    "validationErrors": []
  },
  "processingStatus": "pending",
  "errors": [],
  "warnings": []
}
```

#### GET `/api/cet/files/{fileId}`
```typescript
// Get file information
interface FileInfoResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  uploadTime: string;
  lastModified: string;
  processingStatus: ProcessingStatus;
  analysisResult?: CETAnalysisResult;
  integrationStatus?: IntegrationStatus;
  metadata: {
    customerName: string;
    projectName: string;
    digitalTelco: string;
    region: string;
  };
}
```

#### DELETE `/api/cet/files/{fileId}`
```typescript
// Delete uploaded file
interface DeleteResponse {
  success: boolean;
  message: string;
  deletedAt: string;
}
```

### 2. **Analysis Endpoints**

#### POST `/api/cet/analyze/{fileId}`
```typescript
// Trigger file analysis
interface AnalysisRequest {
  options: {
    includeValidation: boolean;
    includeEffortCalculation: boolean;
    includeRiskAssessment: boolean;
    includeResourceMapping: boolean;
    analysisDepth: 'basic' | 'standard' | 'comprehensive';
  };
}

interface AnalysisResponse {
  success: boolean;
  analysisId: string;
  fileId: string;
  analysisStatus: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedCompletion: string;
  results?: CETAnalysisResult;
  errors: string[];
  warnings: string[];
}
```

#### GET `/api/cet/analyze/{fileId}/status`
```typescript
// Get analysis status
interface AnalysisStatusResponse {
  analysisId: string;
  fileId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  estimatedCompletion: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}
```

#### GET `/api/cet/analyze/{fileId}/results`
```typescript
// Get analysis results
interface AnalysisResultsResponse {
  success: boolean;
  analysisId: string;
  fileId: string;
  analysisTime: string;
  processingTime: number;
  results: CETAnalysisResult;
  confidence: {
    overall: number;
    projectInfo: number;
    resourceDemands: number;
    effortEstimates: number;
    riskAssessment: number;
  };
}
```

### 3. **Integration Endpoints**

#### POST `/api/cet/integrate/{fileId}`
```typescript
// Integrate CET data with delivery system
interface IntegrationRequest {
  options: {
    createWorkPackages: boolean;
    createMilestones: boolean;
    allocateResources: boolean;
    identifyRisks: boolean;
    updateExisting: boolean;
    createDraft: boolean;
    validateOnly: boolean;
  };
  mappings: {
    workPackageMappings: WorkPackageMapping[];
    milestoneMappings: MilestoneMapping[];
    resourceMappings: ResourceMapping[];
    riskMappings: RiskMapping[];
  };
}

interface IntegrationResponse {
  success: boolean;
  integrationId: string;
  fileId: string;
  integrationStatus: 'pending' | 'processing' | 'completed' | 'failed';
  results: {
    created: {
      workPackages: number;
      milestones: number;
      resources: number;
      risks: number;
    };
    updated: {
      workPackages: number;
      milestones: number;
      resources: number;
      risks: number;
    };
    skipped: {
      workPackages: number;
      milestones: number;
      resources: number;
      risks: number;
    };
  };
  errors: string[];
  warnings: string[];
  conflicts: IntegrationConflict[];
}
```

#### GET `/api/cet/integrate/{fileId}/status`
```typescript
// Get integration status
interface IntegrationStatusResponse {
  integrationId: string;
  fileId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  estimatedCompletion: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  conflicts: IntegrationConflict[];
}
```

### 4. **Data Export Endpoints**

#### GET `/api/cet/export/{fileId}/json`
```typescript
// Export analysis results as JSON
interface JSONExportResponse {
  success: boolean;
  fileId: string;
  exportTime: string;
  data: CETAnalysisResult;
  metadata: {
    version: string;
    exportFormat: 'json';
    totalRecords: number;
  };
}
```

#### GET `/api/cet/export/{fileId}/csv`
```typescript
// Export analysis results as CSV
interface CSVExportResponse {
  success: boolean;
  fileId: string;
  exportTime: string;
  downloadUrl: string;
  metadata: {
    version: string;
    exportFormat: 'csv';
    totalRecords: number;
    sheets: string[];
  };
}
```

#### GET `/api/cet/export/{fileId}/excel`
```typescript
// Export analysis results as Excel
interface ExcelExportResponse {
  success: boolean;
  fileId: string;
  exportTime: string;
  downloadUrl: string;
  metadata: {
    version: string;
    exportFormat: 'excel';
    totalRecords: number;
    sheets: string[];
  };
}
```

## Service Implementation

### 1. **File Processing Service**

#### FileParserService
```typescript
class FileParserService {
  async parseExcelFile(fileBuffer: Buffer): Promise<CETRawData> {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheets = this.extractSheets(workbook);
      const projectInfo = this.extractProjectInfo(sheets.Attributes);
      const resourceDemands = this.extractResourceDemands(sheets);
      const jobProfiles = this.extractJobProfiles(sheets.JobProfiles);
      
      return {
        projectInfo,
        resourceDemands,
        jobProfiles,
        sheets,
        metadata: {
          parsedAt: new Date().toISOString(),
          totalSheets: Object.keys(sheets).length,
          totalRows: this.calculateTotalRows(sheets)
        }
      };
    } catch (error) {
      throw new CETParsingError('Failed to parse Excel file', error);
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

  private extractProjectInfo(attributesSheet: any[][]): CETProjectInfo {
    // Implementation for extracting project information
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
}
```

### 2. **Data Analysis Service**

#### DataAnalyzerService
```typescript
class DataAnalyzerService {
  async analyzeCETData(rawData: CETRawData): Promise<CETAnalysisResult> {
    try {
      const analysisStart = Date.now();
      
      // Perform comprehensive analysis
      const projectAnalysis = this.analyzeProject(rawData.projectInfo);
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
      throw new CETAnalysisError('Failed to analyze CET data', error);
    }
  }

  private analyzeProject(projectInfo: CETProjectInfo): ProjectAnalysis {
    return {
      customerName: projectInfo.customerName,
      projectName: projectInfo.projectName,
      digitalTelco: projectInfo.digitalTelco,
      region: projectInfo.region,
      language: projectInfo.language,
      sfdcType: projectInfo.sfdcType,
      createdDate: projectInfo.createdDate,
      status: projectInfo.status,
      complexity: this.assessProjectComplexity(projectInfo),
      riskFactors: this.identifyProjectRisks(projectInfo)
    };
  }

  private analyzeResources(demands: CETResourceDemand[]): ResourceAnalysis {
    const totalEffort = demands.reduce((sum, demand) => sum + demand.effortHours, 0);
    const peakResources = Math.max(...demands.map(d => d.resourceCount));
    const avgResources = demands.reduce((sum, demand) => sum + demand.resourceCount, 0) / demands.length;
    
    return {
      totalEffort,
      peakResources,
      averageResources: Math.round(avgResources),
      resourceUtilization: this.calculateResourceUtilization(demands),
      roleBreakdown: this.analyzeRoleBreakdown(demands),
      timelineAnalysis: this.analyzeResourceTimeline(demands)
    };
  }

  private analyzeEffort(demands: CETResourceDemand[]): EffortAnalysis {
    const phaseEfforts = new Map<number, number>();
    const weeklyEfforts = new Map<number, number>();
    
    demands.forEach(demand => {
      // Aggregate phase efforts
      const currentPhaseEffort = phaseEfforts.get(demand.phaseNumber) || 0;
      phaseEfforts.set(demand.phaseNumber, currentPhaseEffort + demand.effortHours);
      
      // Aggregate weekly efforts
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
      totalEffort: this.calculateTotalEffort(demands),
      effortTrends: this.analyzeEffortTrends(weeklyEfforts)
    };
  }
}
```

### 3. **Integration Service**

#### IntegrationService
```typescript
class IntegrationService {
  async integrateCETData(
    analysisResult: CETAnalysisResult,
    options: IntegrationOptions
  ): Promise<IntegrationResult> {
    try {
      const integrationStart = Date.now();
      const integrationId = this.generateIntegrationId();
      
      // Validate integration options
      this.validateIntegrationOptions(options);
      
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
      throw new CETIntegrationError('Failed to integrate CET data', error);
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

  private mapToWorkPackages(analysis: CETAnalysisResult): WorkPackageMapping[] {
    return analysis.products.map(product => ({
      cetProduct: product.name,
      workPackageName: `${product.name} Implementation`,
      estimatedEffort: this.distributeEffortByRole(product.totalEffort),
      confidence: this.assessWorkPackageConfidence(product),
      dependencies: this.identifyWorkPackageDependencies(product),
      milestones: this.identifyWorkPackageMilestones(product)
    }));
  }

  private mapToMilestones(analysis: CETAnalysisResult): MilestoneMapping[] {
    return analysis.phases.map(phase => ({
      cetPhase: phase.phaseNumber,
      milestoneName: `Phase ${phase.phaseNumber} Completion`,
      estimatedDate: this.calculatePhaseEndDate(phase),
      deliverables: this.generatePhaseDeliverables(phase),
      dependencies: this.identifyMilestoneDependencies(phase)
    }));
  }

  private async executeIntegration(
    mappings: IntegrationMappings,
    options: IntegrationOptions
  ): Promise<IntegrationResults> {
    const results: IntegrationResults = {
      created: { workPackages: 0, milestones: 0, resources: 0, risks: 0 },
      updated: { workPackages: 0, milestones: 0, resources: 0, risks: 0 },
      skipped: { workPackages: 0, milestones: 0, resources: 0, risks: 0 }
    };

    if (options.createWorkPackages) {
      results.created.workPackages = await this.createWorkPackages(mappings.toWorkPackages);
    }

    if (options.createMilestones) {
      results.created.milestones = await this.createMilestones(mappings.toMilestones);
    }

    if (options.allocateResources) {
      results.created.resources = await this.allocateResources(mappings.toResources);
    }

    if (options.identifyRisks) {
      results.created.risks = await this.identifyRisks(mappings.toRisks);
    }

    return results;
  }
}
```

## Error Handling & Validation

### 1. **Custom Error Classes**
```typescript
class CETError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CETError';
  }
}

class CETParsingError extends CETError {
  constructor(message: string, public originalError?: Error) {
    super(message, 'PARSING_ERROR', { originalError });
    this.name = 'CETParsingError';
  }
}

class CETAnalysisError extends CETError {
  constructor(message: string, public originalError?: Error) {
    super(message, 'ANALYSIS_ERROR', { originalError });
    this.name = 'CETAnalysisError';
  }
}

class CETIntegrationError extends CETError {
  constructor(message: string, public originalError?: Error) {
    super(message, 'INTEGRATION_ERROR', { originalError });
    this.name = 'CETIntegrationError';
  }
}
```

### 2. **Validation Middleware**
```typescript
const validateCETFile = (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    
    if (!file) {
      throw new CETError('No file provided', 'MISSING_FILE');
    }
    
    // Validate file type
    if (!['.xlsx', '.xls'].includes(path.extname(file.originalname).toLowerCase())) {
      throw new CETError('Invalid file type', 'INVALID_FILE_TYPE');
    }
    
    // Validate file size
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      throw new CETError('File too large', 'FILE_TOO_LARGE');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

const validateAnalysisRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { options } = req.body;
    
    if (!options || typeof options !== 'object') {
      throw new CETError('Invalid options', 'INVALID_OPTIONS');
    }
    
    // Validate analysis depth
    if (options.analysisDepth && !['basic', 'standard', 'comprehensive'].includes(options.analysisDepth)) {
      throw new CETError('Invalid analysis depth', 'INVALID_ANALYSIS_DEPTH');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};
```

## Performance Optimization

### 1. **Caching Strategy**
```typescript
class CETCacheService {
  private cache = new Map<string, { data: any; expiry: number }>();
  private readonly TTL = 30 * 60 * 1000; // 30 minutes

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.TTL
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}
```

### 2. **Background Processing**
```typescript
class CETBackgroundProcessor {
  private queue: ProcessingJob[] = [];
  private isProcessing = false;

  async addJob(job: ProcessingJob): Promise<string> {
    const jobId = this.generateJobId();
    job.id = jobId;
    job.status = 'queued';
    job.createdAt = new Date();
    
    this.queue.push(job);
    
    if (!this.isProcessing) {
      this.processQueue();
    }
    
    return jobId;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const job = this.queue.shift()!;
      await this.processJob(job);
    }
    
    this.isProcessing = false;
  }

  private async processJob(job: ProcessingJob): Promise<void> {
    try {
      job.status = 'processing';
      job.startedAt = new Date();
      
      // Process the job based on type
      switch (job.type) {
        case 'analysis':
          await this.processAnalysisJob(job);
          break;
        case 'integration':
          await this.processIntegrationJob(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }
      
      job.status = 'completed';
      job.completedAt = new Date();
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.failedAt = new Date();
    }
  }
}
```

## Security & Authentication

### 1. **Authentication Middleware**
```typescript
const authenticateCETRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new CETError('Authentication required', 'AUTHENTICATION_REQUIRED');
    }
    
    const user = await verifyToken(token);
    req.user = user;
    
    next();
  } catch (error) {
    next(new CETError('Authentication failed', 'AUTHENTICATION_FAILED'));
  }
};
```

### 2. **Rate Limiting**
```typescript
import rateLimit from 'express-rate-limit';

const cetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply to CET endpoints
app.use('/api/cet', cetRateLimiter);
```

## Monitoring & Logging

### 1. **Request Logging**
```typescript
const logCETRequest = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    };
    
    logger.info('CET API Request', logData);
  });
  
  next();
};
```

### 2. **Performance Monitoring**
```typescript
const monitorCETPerformance = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to milliseconds
    
    // Record performance metrics
    metrics.recordApiCall({
      endpoint: req.url,
      method: req.method,
      duration,
      statusCode: res.statusCode
    });
  });
  
  next();
};
```

---

*This API service layer provides a comprehensive foundation for building robust and scalable CET v22.0 integration services.*
