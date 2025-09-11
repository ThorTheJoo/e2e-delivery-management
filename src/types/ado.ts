// Azure DevOps (ADO) Integration Types

// ADO Configuration
export interface ADOConfiguration {
  organization: string;
  project: string;
  areaPath: string;
  iterationPath: string;
  authentication: {
    type: 'PAT' | 'OAuth';
    token?: string;
    clientId?: string;
    clientSecret?: string;
  };
  mapping: {
    epicTemplate: string;
    featureTemplate: string;
    userStoryTemplate: string;
    taskTemplate: string;
  };
  customFields: {
    tmfLevel: string;
    domainId: string;
    capabilityId: string;
    requirementId: string;
    projectId: string;
    customer: string;
  };
}

// ADO Work Item Types
export type ADOWorkItemTypeName = 'epic' | 'feature' | 'User Story' | 'task' | 'bug' | 'testcase';

// ADO Work Item Field Operations
export type ADOFieldOperation = 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';

// ADO Work Item Field
export interface ADOWorkItemField {
  op: ADOFieldOperation;
  path: string;
  value: unknown;
  from?: string;
}

// ADO Work Item Relationship
export interface ADORelationship {
  rel: string;
  url: string;
  attributes?: {
    name?: string;
    isLocked?: boolean;
  };
}

// ADO Work Item
export interface ADOWorkItem {
  id?: number;
  type: ADOWorkItemTypeName;
  title: string;
  description: string;
  fields: Record<string, unknown>;
  relationships?: ADORelationship[];
  url?: string;
  rev?: number;
  _links?: Record<string, unknown>;
}

// ADO Work Item Creation Request
export interface ADOCreateWorkItemRequest {
  workItemType: string;
  fields: ADOWorkItemField[];
  relationships?: ADORelationship[];
}

// ADO Work Item Update Request
export interface ADOUpdateWorkItemRequest {
  operations: ADOWorkItemField[];
}

// ADO API Response
export interface ADOApiResponse<T> {
  count: number;
  value: T[];
}

// ADO Work Item Response
export interface ADOWorkItemResponse {
  id: number;
  rev: number;
  fields: Record<string, unknown>;
  _links: Record<string, unknown>;
  url: string;
}

// ADO Project
export interface ADOProject {
  id: string;
  name: string;
  description: string;
  url: string;
  state: string;
  revision: number;
  visibility: string;
  lastUpdateTime: string;
}

// ADO Work Item Type
export interface ADOWorkItemType {
  name: string;
  referenceName: string;
  description: string;
  color: string;
  icon: string;
  isDisabled: boolean;
  xmlForm: string;
  fields: ADOWorkItemTypeField[];
}

// ADO Work Item Type Field
export interface ADOWorkItemTypeField {
  name: string;
  referenceName: string;
  type: string;
  description: string;
  required: boolean;
  allowedValues?: string[];
  defaultValue?: unknown;
}

// ADO Area Path
export interface ADOAreaPath {
  id: string;
  name: string;
  path: string;
  url: string;
}

// ADO Iteration Path
export interface ADOIterationPath {
  id: string;
  name: string;
  path: string;
  url: string;
  startDate?: string;
  finishDate?: string;
}

// ADO Integration State
export interface ADOIntegrationState {
  configuration: ADOConfiguration;
  selectedDomains: string[];
  selectedCapabilities: string[];
  selectedRequirements: string[];
  workItemMappings: ADOWorkItemMapping[];
  validation: ADOValidationResult;
  exportStatus: ADOExportStatus;
}

// ADO Work Item Mapping
export interface ADOWorkItemMapping {
  sourceType: 'project' | 'domain' | 'capability' | 'requirement';
  sourceId: string;
  sourceName: string;
  targetType: ADOWorkItemTypeName;
  targetTitle: string;
  targetDescription: string;
  targetFields: Record<string, string | number | boolean | null>;
  relationships: string[];
  estimatedEffort?: number;
  storyPoints?: number;
  priority?: string;
  tags?: string[];
}

// ADO Validation Result
export interface ADOValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

// ADO Export Status
export interface ADOExportStatus {
  status: 'idle' | 'preparing' | 'exporting' | 'completed' | 'completed_with_errors' | 'failed';
  progress: number;
  totalItems: number;
  processedItems: number;
  errors: string[];
  exportedItems: ADOWorkItemResponse[];
}

// ADO Preview Data
export interface ADOPreviewData {
  epics: ADOWorkItemMapping[];
  features: ADOWorkItemMapping[];
  userStories: ADOWorkItemMapping[];
  tasks: ADOWorkItemMapping[];
  summary: {
    totalItems: number;
    totalEffort: number;
    totalStoryPoints: number;
    breakdown: Record<string, number>;
  };
}

// ADO Template
export interface ADOTemplate {
  id: string;
  name: string;
  description: string;
  type: ADOWorkItemTypeName;
  fields: Record<string, unknown>;
  relationships: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ADO Integration Settings
export interface ADOIntegrationSettings {
  autoSync: boolean;
  syncInterval: number; // minutes
  batchSize: number;
  retryAttempts: number;
  retryDelay: number; // seconds
  enableLogging: boolean;
  enableNotifications: boolean;
}

// ADO Error Response
export interface ADOErrorResponse {
  id: string;
  innerException: unknown;
  message: string;
  typeName: string;
  typeKey: string;
  errorCode: number;
  eventId: number;
}

// ADO Authentication Status
export interface ADOAuthStatus {
  isAuthenticated: boolean;
  organization: string;
  project: string;
  user: string;
  permissions: string[];
  lastChecked: string;
}

// ADO Work Item Link
export interface ADOWorkItemLink {
  sourceId: number;
  targetId: number;
  linkType: string;
  attributes?: Record<string, unknown>;
}

// ADO Bulk Operation
export interface ADOBulkOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'link';
  workItems: ADOWorkItem[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  results: ADOBulkOperationResult[];
  startedAt: string;
  completedAt?: string;
}

// ADO Bulk Operation Result
export interface ADOBulkOperationResult {
  workItemId: string;
  status: 'success' | 'failed' | 'skipped';
  message?: string;
  adoId?: number;
  adoUrl?: string;
}

// ADO Field Mapping
export interface ADOFieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: 'none' | 'uppercase' | 'lowercase' | 'capitalize' | 'custom';
  customTransform?: (value: unknown) => unknown;
  defaultValue?: unknown;
  required: boolean;
}

// ADO Work Item Template
export interface ADOWorkItemTemplate {
  name: string;
  type: ADOWorkItemTypeName;
  fields: ADOFieldMapping[];
  relationships: string[];
  tags: string[];
  description: string;
}

// ADO Integration Log Entry
export interface ADOIntegrationLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  details?: unknown;
  workItemId?: string;
  operation?: string;
  duration?: number;
}

// ADO Notification
export interface ADONotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  details?: unknown;
  timestamp: string;
  read: boolean;
}
