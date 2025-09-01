export interface BlueDolphinDomain {
  id: string;
  name: string;
  description: string;
  type: 'TMF_ODA_DOMAIN' | 'CUSTOM_DOMAIN';
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  metadata?: {
    tmfVersion?: string;
    category?: string;
    parentDomain?: string;
  };
}

export interface BlueDolphinCapability {
  id: string;
  name: string;
  description: string;
  domainId: string;
  type: 'TMF_ODA_CAPABILITY' | 'CUSTOM_CAPABILITY';
  level: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  metadata?: {
    effortEstimate?: string;
    complexity?: 'LOW' | 'MEDIUM' | 'HIGH';
    dependencies?: string[];
    useCases?: string[];
  };
}

export interface BlueDolphinRequirement {
  id: string;
  name: string;
  description: string;
  type: 'FUNCTIONAL_REQUIREMENT' | 'NON_FUNCTIONAL_REQUIREMENT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  domainId?: string;
  capabilityId?: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  metadata?: {
    source?: string;
    sourceId?: string;
    effortEstimate?: string;
    useCases?: string[];
  };
}

export interface BlueDolphinUseCase {
  id: string;
  name: string;
  title: string;
  description: string;
  actors: string[];
  preconditions: string[];
  postconditions: string[];
  domainId?: string;
  capabilityId?: string;
  requirements?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BlueDolphinApplicationFunction {
  id: string;
  name: string;
  description: string;
  type: 'MICROSERVICE' | 'API' | 'DATABASE' | 'UI_COMPONENT';
  technology?: string;
  domainId?: string;
  capabilityId?: string;
  interfaces?: Array<{
    name: string;
    type: string;
    version: string;
  }>;
  dependencies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BlueDolphinObject {
  ID: string;
  Title: string;
  Definition: string;
  Description?: string;
  ArchimateType?: string;
  Status?: string;
  CreatedOn?: string;
  ChangedOn?: string;
  Workspace?: string;
  Category?: string;
  ConditionalColor?: string;
  ObjectLifecycleState?: string;
  Completeness?: number;
  CreatedBy?: string;
  ChangedBy?: string;
  ArchivedOn?: string;
  ArchivedBy?: string;
}

export interface BlueDolphinObjectEnhanced extends BlueDolphinObject {
  // Enhanced properties (confirmed via CLI testing)
  Object_Properties_Name?: string;
  Object_Properties_AMEFF_Import_Identifier?: string;
  Deliverable_Object_Status_Status?: string;
  Object_Properties_Deliverable_Object_Status?: string;
  Object_Properties_User_Interface_Integration?: string;
  Object_Properties_Documentation?: string;
  Object_Properties_Provided_by?: string;
  Object_Properties_Supplied_By?: string;
  Object_Properties_Questions?: string;
  Object_Properties_Action_Items?: string;
  
  // Deliverable Status Properties
  Deliverable_Object_Status_Architectural_Decision_Log?: string;
  
  // AMEFF Properties (25+ fields confirmed)
  Ameff_properties_Reportx3AModelx3ACoverx3ABackground?: string;
  Ameff_properties_Reportx3AModelx3AHeaderx3ABackground?: string;
  Ameff_properties_Reportx3AModelx3AHidex3AApplication?: string;
  Ameff_properties_Reportx3AModelx3AHidex3ABusiness?: string;
  Ameff_properties_Reportx3AModelx3AHidex3AImplementationx26Migration?: string;
  Ameff_properties_Reportx3AModelx3AHidex3AMotivation?: string;
  Ameff_properties_Reportx3AModelx3AHidex3AOther?: string;
  Ameff_properties_Reportx3AModelx3AHidex3ARelations?: string;
  Ameff_properties_Reportx3AModelx3AHidex3ATechnologyx26Physical?: string;
  Ameff_properties_Reportx3AModelx3AHidex3AViewNumbering?: string;
  Ameff_properties_Reportx3AModelx3AHidex3AViews?: string;
  Ameff_properties_Reportx3AViewx3ADetailed?: string;
  Ameff_properties_Reportx3AViewx3AHide?: string;
  Ameff_properties_Reportx3AViewx3AHidex3ADiagram?: string;
  Ameff_properties_Reportx3AViewx3ATag?: string;
  Ameff_properties_Documentation?: string;
  Ameff_properties_Hide_Business?: string;
  Ameff_properties_Hide_Application?: string;
  Ameff_properties_Hide_Technology?: string;
  Ameff_properties_Hide_Motivation?: string;
  Ameff_properties_Show_Views?: string;
  Ameff_properties_Domain?: string;
  Ameff_properties_Category?: string;
  Ameff_properties_Source_ID?: string;
  Ameff_properties_Compliance?: string;
}

// Request/Response types
export interface CreateDomainRequest {
  name: string;
  description: string;
  type: BlueDolphinDomain['type'];
  metadata?: BlueDolphinDomain['metadata'];
}

export interface CreateCapabilityRequest {
  name: string;
  description: string;
  type: BlueDolphinCapability['type'];
  level: BlueDolphinCapability['level'];
  metadata?: BlueDolphinCapability['metadata'];
}

export interface CreateRequirementRequest {
  name: string;
  description: string;
  type: BlueDolphinRequirement['type'];
  priority: BlueDolphinRequirement['priority'];
  domainId?: string;
  capabilityId?: string;
  metadata?: BlueDolphinRequirement['metadata'];
}

export interface PaginationInfo {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationInfo;
}

export interface ODataResponse<T> {
  '@odata.context': string;
  value: T[];
  '@odata.count'?: number;
}

// Configuration types
export interface BlueDolphinConfig {
  apiUrl: string;
  odataUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  protocol: 'REST' | 'ODATA' | 'HYBRID';
}

// Sync operation types
export interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC';
  entityType: 'DOMAIN' | 'CAPABILITY' | 'REQUIREMENT' | 'USECASE';
  entityId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  errors: string[];
  operations: SyncOperation[];
}
