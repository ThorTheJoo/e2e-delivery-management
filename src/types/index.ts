// Core project types
export interface Project {
  id: string;
  name: string;
  customer: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  duration: string;
  teamSize: number;
  workingDaysPerMonth: number;
}

export type ProjectStatus = 'Pre-CR' | 'CR' | 'In Progress' | 'Completed' | 'On Hold';

// TMF ODA Domain and Capability Management
export interface TMFOdaDomain {
  id: string;
  name: string;
  description: string;
  capabilities: TMFOdaCapability[];
  isSelected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TMFOdaCapability {
  id: string;
  name: string;
  description: string;
  domainId: string;
  isSelected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TMFOdaState {
  domains: TMFOdaDomain[];
  selectedDomainIds: string[];
  selectedCapabilityIds: string[];
}

// TMF Capabilities
export interface TMFCapability {
  id: string;
  name: string;
  description: string;
  segments: string[];
  baseEffort: EffortBreakdown;
  complexityFactors: ComplexityFactors;
}

export interface EffortBreakdown {
  businessAnalyst: number;
  solutionArchitect: number;
  developer: number;
  qaEngineer: number;
}

export interface ComplexityFactors {
  [key: string]: number;
}

// eTOM Processes
export interface ETOMProcess {
  id: string;
  name: string;
  description: string;
  level: number;
  category: string;
  subProcesses: ETOMProcess[];
  baseEffort: EffortBreakdown;
  complexityFactors: ComplexityFactors;
}

// Work Breakdown Structure
export interface WorkPackage {
  id: string;
  name: string;
  description: string;
  type: WorkPackageType;
  effort: EffortBreakdown;
  dependencies: string[];
  milestones: Milestone[];
  risks: Risk[];
  status: WorkPackageStatus;
}

export type WorkPackageType = 'Analysis' | 'Design' | 'Development' | 'Testing' | 'Deployment' | 'Documentation';
export type WorkPackageStatus = 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';

// Milestones
export interface Milestone {
  id: string;
  name: string;
  description: string;
  date: string;
  type: MilestoneType;
  status: MilestoneStatus;
  deliverables: string[];
}

export type MilestoneType = 'Project' | 'Phase' | 'Release' | 'Go-Live';
export type MilestoneStatus = 'Planned' | 'In Progress' | 'Completed' | 'Delayed';

// Risks
export interface Risk {
  id: string;
  name: string;
  description: string;
  probability: RiskProbability;
  impact: RiskImpact;
  severity: RiskSeverity;
  mitigation: string;
  owner: string;
  status: RiskStatus;
}

export type RiskProbability = 'Low' | 'Medium' | 'High';
export type RiskImpact = 'Low' | 'Medium' | 'High';
export type RiskSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type RiskStatus = 'Identified' | 'Mitigated' | 'Closed' | 'Escalated';

// Dependencies
export interface Dependency {
  id: string;
  name: string;
  description: string;
  type: DependencyType;
  source: string;
  target: string;
  criticality: DependencyCriticality;
  status: DependencyStatus;
}

export type DependencyType = 'Technical' | 'Business' | 'Resource' | 'External';
export type DependencyCriticality = 'Low' | 'Medium' | 'High' | 'Critical';
export type DependencyStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

// Documents
export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  version: string;
  lastModified: string;
  owner: string;
  tags: string[];
  url?: string;
}

export type DocumentType = 'Requirements' | 'Design' | 'Test Plan' | 'User Guide' | 'API Documentation' | 'Architecture';
export type DocumentStatus = 'Draft' | 'In Review' | 'Approved' | 'Published';

// Estimation
export interface Estimation {
  id: string;
  workPackageId: string;
  baseEffort: EffortBreakdown;
  complexityMultiplier: number;
  riskMultiplier: number;
  totalEffort: EffortBreakdown;
  confidence: EstimationConfidence;
  assumptions: string[];
}

export type EstimationConfidence = 'Low' | 'Medium' | 'High';

// Scheduling
export interface Schedule {
  id: string;
  workPackageId: string;
  startDate: string;
  endDate: string;
  duration: number;
  resources: Resource[];
  constraints: Constraint[];
}

export interface Resource {
  id: string;
  name: string;
  role: string;
  availability: number;
  cost: number;
}

export interface Constraint {
  id: string;
  type: ConstraintType;
  description: string;
  impact: 'Low' | 'Medium' | 'High';
}

export type ConstraintType = 'Resource' | 'Time' | 'Budget' | 'Technical' | 'Business';

// Commercial Model
export interface CommercialModel {
  id: string;
  name: string;
  type: CommercialType;
  baseCost: number;
  riskContingency: number;
  profitMargin: number;
  totalCost: number;
  currency: string;
  assumptions: string[];
}

export type CommercialType = 'Fixed Price' | 'Time & Materials' | 'Milestone Based' | 'Risk & Reward';

// Navigation and UI
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  children?: NavigationItem[];
  isActive?: boolean;
}

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: string;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox';
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: any;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// SpecSync types
export interface SpecSyncItem {
  id: string;
  requirementId: string;
  rephrasedRequirementId: string;
  domain: string;
  vertical: string;
  functionName: string;
  afLevel2: string;
  capability: string;
  referenceCapability: string;
  usecase1: string;
  description?: string;
  priority?: string;
  status?: string;
}

export interface SpecSyncState {
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

// CET v22.0 Types for Service Design
export interface CETv22Data {
  project: CETv22Project;
  phases: CETv22Phase[];
  products: CETv22Product[];
  jobProfiles: CETv22JobProfile[];
  resourceDemands: CETv22ResourceDemand[];
  lookupValues: CETv22LookupValue[];
  dealTypes: CETv22DealType[];
}

export interface CETv22Project {
  customerName: string;
  projectName: string;
  digitalTelco: string;
  region: string;
  language: string;
  sfdcType: string;
  createdDate: string;
  status: string;
}

export interface CETv22Phase {
  phaseNumber: number;
  phaseName: string;
  startWeek: number;
  endWeek: number;
  totalEffort: number;
  resourceCount: number;
  complexityLevel: 'Low' | 'Medium' | 'High';
  deliverables: string[];
}

export interface CETv22Product {
  name: string;
  type: string;
  totalEffort: number;
  resourceCount: number;
  complexityLevel: 'Low' | 'Medium' | 'High';
  phases: number[];
}

export interface CETv22JobProfile {
  id: string;
  productService: string;
  projectTeam: string;
  projectRole: string;
  salesRegion: string;
  salesTerritory: string;
  supervisoryOrganization: string;
  workdayJobProfile: string;
  resourceLevel: string;
  resourceCostRegion: string;
  demandLocationCountryCode: string;
  workerType: string;
  hourlyRate: number;
  availability: number;
}

export interface CETv22ResourceDemand {
  weekNumber: number;
  weekDate: string;
  jobProfile: string;
  effortHours: number;
  resourceCount: number;
  productType: string;
  phaseNumber: number;
  complexityLevel?: string;
}

export interface CETv22LookupValue {
  key: string;
  value: string;
  category: string;
  description?: string;
}

export interface CETv22DealType {
  id: string;
  name: string;
  description: string;
  commercialModel: string;
  riskFactors: string[];
}

// CET v22.0 Analysis Types
export interface CETv22AnalysisResult {
  project: CETv22ProjectAnalysis;
  resources: CETv22ResourceAnalysis;
  effort: CETv22EffortAnalysis;
  phases: CETv22PhaseAnalysis[];
  products: CETv22ProductAnalysis[];
  risks: CETv22RiskAnalysis[];
  metadata: CETv22AnalysisMetadata;
}

export interface CETv22ProjectAnalysis {
  customerName: string;
  projectName: string;
  digitalTelco: string;
  region: string;
  language: string;
  sfdcType: string;
  createdDate: string;
  status: string;
  complexity: 'Low' | 'Medium' | 'High';
  riskFactors: string[];
}

export interface CETv22ResourceAnalysis {
  totalEffort: number;
  peakResources: number;
  averageResources: number;
  resourceUtilization: number;
  roleBreakdown: CETv22RoleEffort[];
  timelineAnalysis: CETv22TimelineData[];
  domainBreakdown?: CETv22DomainEffort[];
}

export interface CETv22RoleEffort {
  role: string;
  effort: number;
  percentage: number;
}

export interface CETv22DomainEffort {
  domain: string;
  totalEffort: number;
  resourceCount: number;
  percentage: number;
  roleBreakdown: CETv22RoleEffort[];
  phases: number[];
}

export interface CETv22TimelineData {
  weekNumber: number;
  totalEffort: number;
  resourceCount: number;
  date: string;
}

export interface CETv22EffortAnalysis {
  phaseBreakdown: CETv22PhaseEffort[];
  weeklyBreakdown: CETv22WeeklyEffort[];
  totalEffort: number;
  effortTrends: CETv22EffortTrend[];
}

export interface CETv22PhaseEffort {
  phaseNumber: number;
  totalEffort: number;
  percentage: number;
}

export interface CETv22WeeklyEffort {
  weekNumber: number;
  totalEffort: number;
}

export interface CETv22EffortTrend {
  week: number;
  effort: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface CETv22PhaseAnalysis {
  phaseNumber: number;
  phaseName: string;
  totalEffort: number;
  resourceCount: number;
  duration: number;
  complexity: 'Low' | 'Medium' | 'High';
  deliverables: string[];
  riskFactors: string[];
}

export interface CETv22ProductAnalysis {
  name: string;
  type: string;
  totalEffort: number;
  resourceCount: number;
  complexity: 'Low' | 'Medium' | 'High';
  phases: number[];
  riskFactors: string[];
}

export interface CETv22RiskAnalysis {
  source: string;
  riskName: string;
  probability: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High';
  mitigation: string;
}

export interface CETv22AnalysisMetadata {
  analyzedAt: string;
  analysisTime: number;
  confidence: number;
  dataQuality: 'Poor' | 'Fair' | 'Good' | 'Excellent';
}

// CET v22.0 Integration Types
export interface CETv22IntegrationMappings {
  toWorkPackages: CETv22WorkPackageMapping[];
  toMilestones: CETv22MilestoneMapping[];
  toResources: CETv22ResourceMapping[];
  toRisks: CETv22RiskMapping[];
  confidence: CETv22MappingConfidence;
}

export interface CETv22WorkPackageMapping {
  cetProduct: string;
  workPackageName: string;
  estimatedEffort: EffortBreakdown;
  confidence: 'Low' | 'Medium' | 'High';
  dependencies: string[];
  milestones: string[];
}

export interface CETv22MilestoneMapping {
  cetPhase: number;
  milestoneName: string;
  estimatedDate: string;
  deliverables: string[];
  dependencies: string[];
}

export interface CETv22ResourceMapping {
  cetJobProfile: string;
  resourceRole: string;
  skillLevel: string;
  costCenter: string;
  availability: number;
}

export interface CETv22RiskMapping {
  cetSource: string;
  riskName: string;
  probability: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High';
  mitigation: string;
}

export interface CETv22MappingConfidence {
  overall: number;
  workPackages: number;
  milestones: number;
  resources: number;
  risks: number;
}

// CET v22.0 UI Component Props
export interface CETv22FileUploadProps {
  onFileProcessed: (data: CETv22Data) => void;
  onError: (error: Error) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
  dragAndDrop?: boolean;
  disabled?: boolean;
}

export interface CETv22AnalysisDashboardProps {
  analysisResult: CETv22AnalysisResult;
  onIntegrationRequest: (options: CETv22IntegrationOptions) => void;
  onExportRequest: (format: 'json' | 'csv' | 'excel') => void;
}

export interface CETv22EffortAnalysisProps {
  effortAnalysis: CETv22EffortAnalysis;
}

export interface CETv22RiskAssessmentProps {
  riskAnalysis: CETv22RiskAnalysis[];
  projectAnalysis: CETv22ProjectAnalysis;
}

export interface CETv22IntegrationOptions {
  createWorkPackages: boolean;
  createMilestones: boolean;
  allocateResources: boolean;
  identifyRisks: boolean;
  updateExisting: boolean;
  createDraft: boolean;
  validateOnly: boolean;
}

// CET v22.0 Error Types
export class CETv22Error extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CETv22Error';
  }
}

export class CETv22ParsingError extends CETv22Error {
  constructor(message: string, public originalError?: Error) {
    super(message, 'PARSING_ERROR', { originalError });
    this.name = 'CETv22ParsingError';
  }
}

export class CETv22AnalysisError extends CETv22Error {
  constructor(message: string, public originalError?: Error) {
    super(message, 'ANALYSIS_ERROR', { originalError });
    this.name = 'CETv22AnalysisError';
  }
}

export class CETv22IntegrationError extends CETv22Error {
  constructor(message: string, public originalError?: Error) {
    super(message, 'INTEGRATION_ERROR', { originalError });
    this.name = 'CETv22IntegrationError';
  }
}

// Bill of Materials (BOM) Types
export interface BOMItem {
  id: string;
  tmfDomain: string;
  capability: string;
  requirement: string;
  applicationComponent?: string;
  useCase?: string;
  cutEffort?: number; // CUT effort in mandays
  resourceDomain?: string;
  resourceBreakdown?: ResourceBreakdown;
  serviceDeliveryServices: ServiceDeliveryService[];
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Identified' | 'In Progress' | 'Completed' | 'On Hold';
  source: 'SpecSync' | 'SET' | 'CETv22' | 'Manual';
  createdAt: string;
  updatedAt: string;
}

export interface ResourceBreakdown {
  businessAnalyst: number;
  solutionArchitect: number;
  developer: number;
  qaEngineer: number;
  projectManager: number;
  totalEffort: number;
}

export interface ServiceDeliveryService {
  id: string;
  name: string;
  category: ServiceDeliveryCategory;
  effort: number;
  cost: number;
  isIncluded: boolean;
  description?: string;
}

export type ServiceDeliveryCategory = 
  | 'Migration'
  | 'Training'
  | 'Development'
  | 'Build'
  | 'Test'
  | 'Release'
  | 'Project Management'
  | 'Program Management'
  | 'Stakeholder Management'
  | 'Governance'
  | 'Architecture'
  | 'Design'
  | 'Integration'
  | 'Platform Engineering'
  | 'Platform Architecture'
  | 'Environments'
  | 'Release Deployment'
  | 'Production Cutover'
  | 'Warranty'
  | 'Hypercare';

export interface BOMState {
  items: BOMItem[];
  filters: BOMFilters;
  summary: BOMSummary;
  lastUpdated: string;
}

export interface BOMFilters {
  domains: string[];
  capabilities: string[];
  priorities: string[];
  sources: string[];
  statuses: string[];
}

export interface BOMSummary {
  totalItems: number;
  totalEffort: number;
  totalCost: number;
  domainBreakdown: Record<string, number>;
  capabilityBreakdown: Record<string, number>;
  serviceBreakdown: Record<ServiceDeliveryCategory, number>;
}