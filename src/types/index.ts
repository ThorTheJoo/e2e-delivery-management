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
