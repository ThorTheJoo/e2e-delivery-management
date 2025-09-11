# CET v22.0 Data Mapping Strategy

## Overview

This document outlines the comprehensive data mapping strategy for transforming CET v22.0 Excel data into your E2E Delivery Management System. The mapping strategy ensures data integrity, maintains business logic, and provides seamless integration between systems.

## Data Mapping Principles

### 1. **Preservation of Business Logic**

- Maintain original CET calculations and relationships
- Preserve phase-based delivery structure
- Keep resource allocation patterns intact
- Respect product-specific configurations

### 2. **Data Quality Assurance**

- Validate data before mapping
- Provide confidence scores for mappings
- Handle missing or invalid data gracefully
- Maintain audit trails for all transformations

### 3. **Flexibility and Customization**

- Allow manual overrides where appropriate
- Provide mapping configuration options
- Support different mapping strategies
- Enable user-defined mapping rules

## Core Data Mappings

### 1. **Project Information Mapping**

#### CET Project → Delivery System Project

```typescript
interface ProjectMapping {
  cetField: string;
  deliverySystemField: string;
  transformation: (value: any) => any;
  validation: (value: any) => boolean;
  required: boolean;
  confidence: number;
}

const projectMappings: ProjectMapping[] = [
  {
    cetField: 'Customer Name',
    deliverySystemField: 'customer',
    transformation: (value) => value?.trim() || 'Unknown Customer',
    validation: (value) => typeof value === 'string' && value.length > 0,
    required: true,
    confidence: 0.95,
  },
  {
    cetField: 'Project Name',
    deliverySystemField: 'name',
    transformation: (value) => value?.trim() || 'CET Project',
    validation: (value) => typeof value === 'string' && value.length > 0,
    required: true,
    confidence: 0.95,
  },
  {
    cetField: 'Digital Telco',
    deliverySystemField: 'metadata.digitalTelco',
    transformation: (value) => value?.trim() || 'Standard',
    validation: (value) => typeof value === 'string',
    required: false,
    confidence: 0.9,
  },
  {
    cetField: 'Region',
    deliverySystemField: 'metadata.region',
    transformation: (value) => value?.trim() || 'Global',
    validation: (value) => typeof value === 'string',
    required: false,
    confidence: 0.85,
  },
];
```

#### Mapping Implementation

```typescript
class ProjectMapper {
  mapCETToProject(cetData: CETProjectData): Project {
    const project: Partial<Project> = {
      id: generateProjectId(),
      status: 'Draft',
      startDate: calculateProjectStartDate(cetData),
      endDate: calculateProjectEndDate(cetData),
      duration: calculateProjectDuration(cetData),
      teamSize: calculateTeamSize(cetData),
      workingDaysPerMonth: 20,
    };

    // Apply mappings
    projectMappings.forEach((mapping) => {
      const cetValue = this.extractCETValue(cetData, mapping.cetField);

      if (mapping.validation(cetValue)) {
        const transformedValue = mapping.transformation(cetValue);
        this.setProjectValue(project, mapping.deliverySystemField, transformedValue);
      } else if (mapping.required) {
        throw new MappingError(`Required field ${mapping.cetField} is invalid`);
      }
    });

    return project as Project;
  }

  private extractCETValue(cetData: CETProjectData, field: string): any {
    // Navigate CET data structure to extract value
    const path = field.split('.');
    let value = cetData;

    for (const segment of path) {
      value = value?.[segment];
      if (value === undefined) break;
    }

    return value;
  }

  private setProjectValue(project: Partial<Project>, field: string, value: any): void {
    // Navigate project structure to set value
    const path = field.split('.');
    let current = project;

    for (let i = 0; i < path.length - 1; i++) {
      const segment = path[i];
      if (!current[segment]) {
        current[segment] = {};
      }
      current = current[segment];
    }

    current[path[path.length - 1]] = value;
  }
}
```

### 2. **Resource Demand Mapping**

#### CET Resource Demand → Work Package

```typescript
interface ResourceDemandMapping {
  cetSheet: string;
  cetColumns: string[];
  workPackageFields: string[];
  transformation: (row: any[], headers: string[]) => Partial<WorkPackage>;
  validation: (row: any[], headers: string[]) => boolean;
}

const resourceDemandMappings: ResourceDemandMapping[] = [
  {
    cetSheet: 'Ph1Demand',
    cetColumns: ['Week Number', 'Job Profile', 'Effort Hours', 'Resource Count'],
    workPackageFields: ['name', 'effort', 'resources', 'timeline'],
    transformation: (row, headers) => ({
      name: `Phase 1 - ${row[getColumnIndex(headers, 'Job Profile')]}`,
      type: 'Development',
      effort: {
        businessAnalyst: calculateRoleEffort(row, headers, 'Business Analyst'),
        solutionArchitect: calculateRoleEffort(row, headers, 'Solution Architect'),
        developer: calculateRoleEffort(row, headers, 'Developer'),
        qaEngineer: calculateRoleEffort(row, headers, 'QA Engineer'),
      },
      dependencies: [],
      milestones: [],
      risks: [],
      status: 'Not Started',
    }),
    validation: (row, headers) => {
      const weekNumber = parseInt(row[getColumnIndex(headers, 'Week Number')]);
      const effortHours = parseFloat(row[getColumnIndex(headers, 'Effort Hours')]);
      return !isNaN(weekNumber) && !isNaN(effortHours) && effortHours > 0;
    },
  },
  // Additional phase mappings...
];

function calculateRoleEffort(row: any[], headers: string[], role: string): number {
  const jobProfile = row[getColumnIndex(headers, 'Job Profile')];
  const effortHours = parseFloat(row[getColumnIndex(headers, 'Effort Hours')]);

  // Role-based effort distribution
  const roleDistribution = {
    'Business Analyst': 0.15,
    'Solution Architect': 0.2,
    Developer: 0.5,
    'QA Engineer': 0.15,
  };

  return Math.round(effortHours * (roleDistribution[role] || 0.25));
}
```

#### Work Package Generation

```typescript
class WorkPackageMapper {
  mapCETToWorkPackages(cetData: CETResourceDemandData): WorkPackage[] {
    const workPackages: WorkPackage[] = [];

    // Process each phase
    ['Ph1Demand', 'Ph2Demand', 'Ph3Demand', 'Ph4Demand'].forEach((phaseSheet) => {
      if (cetData[phaseSheet]) {
        const phaseWorkPackages = this.processPhaseSheet(cetData[phaseSheet], phaseSheet);
        workPackages.push(...phaseWorkPackages);
      }
    });

    // Process product-specific demands
    ['GovDemand', 'ENCDemand', 'ASCDemand', 'CMADemand'].forEach((productSheet) => {
      if (cetData[productSheet]) {
        const productWorkPackages = this.processProductSheet(cetData[productSheet], productSheet);
        workPackages.push(...productWorkPackages);
      }
    });

    return this.consolidateWorkPackages(workPackages);
  }

  private processPhaseSheet(sheetData: any[][], sheetName: string): WorkPackage[] {
    const headers = sheetData[0];
    const workPackages: WorkPackage[] = [];

    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];

      // Find matching mapping
      const mapping = resourceDemandMappings.find((m) => m.cetSheet === sheetName);
      if (mapping && mapping.validation(row, headers)) {
        const workPackage = mapping.transformation(row, headers);
        workPackage.id = generateWorkPackageId();
        workPackages.push(workPackage as WorkPackage);
      }
    }

    return workPackages;
  }

  private consolidateWorkPackages(workPackages: WorkPackage[]): WorkPackage[] {
    // Group by name and consolidate effort
    const consolidated = new Map<string, WorkPackage>();

    workPackages.forEach((wp) => {
      if (consolidated.has(wp.name)) {
        const existing = consolidated.get(wp.name)!;
        existing.effort = this.mergeEffort(existing.effort, wp.effort);
      } else {
        consolidated.set(wp.name, { ...wp });
      }
    });

    return Array.from(consolidated.values());
  }

  private mergeEffort(existing: EffortBreakdown, newEffort: EffortBreakdown): EffortBreakdown {
    return {
      businessAnalyst: existing.businessAnalyst + newEffort.businessAnalyst,
      solutionArchitect: existing.solutionArchitect + newEffort.solutionArchitect,
      developer: existing.developer + newEffort.developer,
      qaEngineer: existing.qaEngineer + newEffort.qaEngineer,
    };
  }
}
```

### 3. **Phase Mapping**

#### CET Phase → Milestone

```typescript
interface PhaseMapping {
  cetPhase: number;
  milestoneName: string;
  milestoneType: MilestoneType;
  deliverables: string[];
  dependencies: string[];
  estimatedDate: string;
}

const phaseMappings: PhaseMapping[] = [
  {
    cetPhase: 1,
    milestoneName: 'Phase 1 Completion',
    milestoneType: 'Phase',
    deliverables: [
      'Requirements Document',
      'Project Charter',
      'Team Setup',
      'Initial Architecture',
    ],
    dependencies: [],
    estimatedDate: 'calculated',
  },
  {
    cetPhase: 2,
    milestoneName: 'Phase 2 Completion',
    milestoneType: 'Phase',
    deliverables: [
      'Technical Design',
      'Architecture Document',
      'Development Plan',
      'Test Strategy',
    ],
    dependencies: ['Phase 1 Completion'],
    estimatedDate: 'calculated',
  },
  {
    cetPhase: 3,
    milestoneName: 'Phase 3 Completion',
    milestoneType: 'Phase',
    deliverables: ['Core Implementation', 'Unit Tests', 'Integration Tests', 'User Documentation'],
    dependencies: ['Phase 2 Completion'],
    estimatedDate: 'calculated',
  },
  {
    cetPhase: 4,
    milestoneName: 'Phase 4 Completion',
    milestoneType: 'Phase',
    deliverables: [
      'System Testing',
      'User Acceptance Testing',
      'Go-Live Preparation',
      'Production Deployment',
    ],
    dependencies: ['Phase 3 Completion'],
    estimatedDate: 'calculated',
  },
];
```

#### Milestone Generation

```typescript
class MilestoneMapper {
  mapCETToMilestones(cetData: CETPhaseData): Milestone[] {
    const milestones: Milestone[] = [];

    phaseMappings.forEach((mapping) => {
      const phaseData = this.extractPhaseData(cetData, mapping.cetPhase);
      const milestone: Milestone = {
        id: generateMilestoneId(),
        name: mapping.milestoneName,
        description: `Completion of Phase ${mapping.cetPhase} deliverables`,
        date: this.calculatePhaseEndDate(phaseData),
        type: mapping.milestoneType,
        status: 'Planned',
        deliverables: mapping.deliverables,
      };

      milestones.push(milestone);
    });

    return this.resolveDependencies(milestones);
  }

  private extractPhaseData(cetData: CETPhaseData, phaseNumber: number): any {
    const phaseSheet = `Ph${phaseNumber}Demand`;
    return cetData[phaseSheet] || [];
  }

  private calculatePhaseEndDate(phaseData: any[]): string {
    if (phaseData.length === 0) return new Date().toISOString().split('T')[0];

    // Find the latest week number
    const weekNumbers = phaseData.map((row) => parseInt(row[0])).filter((n) => !isNaN(n));
    const maxWeek = Math.max(...weekNumbers);

    // Calculate end date based on project start and week number
    const projectStart = new Date('2025-01-15'); // Default project start
    const endDate = new Date(projectStart.getTime() + maxWeek * 7 * 24 * 60 * 60 * 1000);

    return endDate.toISOString().split('T')[0];
  }

  private resolveDependencies(milestones: Milestone[]): Milestone[] {
    // Resolve milestone dependencies
    milestones.forEach((milestone) => {
      const mapping = phaseMappings.find((m) => m.milestoneName === milestone.name);
      if (mapping?.dependencies.length) {
        milestone.dependencies = mapping.dependencies
          .map((depName) => {
            const depMilestone = milestones.find((m) => m.name === depName);
            return depMilestone?.id || '';
          })
          .filter((id) => id);
      }
    });

    return milestones;
  }
}
```

### 4. **Resource Mapping**

#### CET Job Profile → Resource

```typescript
interface ResourceMapping {
  cetField: string;
  resourceField: string;
  transformation: (value: any) => any;
  validation: (value: any) => boolean;
}

const resourceMappings: ResourceMapping[] = [
  {
    cetField: 'Project Role',
    resourceField: 'role',
    transformation: (value) => value?.trim() || 'Team Member',
    validation: (value) => typeof value === 'string' && value.length > 0
  },
  {
    cetField: 'Resource Level',
    resourceField: 'skillLevel',
    transformation: (value) => this.mapSkillLevel(value),
    validation: (value) => typeof value === 'string'
  },
  {
    cetField: 'Resource Cost Region',
    resourceField: 'costCenter',
    transformation: (value) => value?.trim() || 'Default',
    validation: (value) => typeof value === 'string'
  },
  {
    cetField: 'Worker Type',
    resourceField: 'employmentType',
    transformation: (value) => this.mapWorkerType(value),
    validation: (value) => typeof value === 'string'
  }
];

private mapSkillLevel(cetLevel: string): string {
  const levelMapping: Record<string, string> = {
    'Junior': 'Entry',
    'Mid': 'Intermediate',
    'Senior': 'Advanced',
    'Lead': 'Expert',
    'Principal': 'Expert'
  };

  return levelMapping[cetLevel] || 'Intermediate';
}

private mapWorkerType(cetType: string): string {
  const typeMapping: Record<string, string> = {
    'Full Time': 'Full-Time',
    'Part Time': 'Part-Time',
    'Contractor': 'Contract',
    'Consultant': 'Consultant'
  };

  return typeMapping[cetType] || 'Full-Time';
}
```

#### Resource Allocation

```typescript
class ResourceMapper {
  mapCETToResources(cetData: CETJobProfileData): Resource[] {
    const resources: Resource[] = [];
    const uniqueProfiles = this.identifyUniqueProfiles(cetData);

    uniqueProfiles.forEach((profile) => {
      const resource: Resource = {
        id: generateResourceId(),
        name: profile.projectRole,
        role: profile.projectRole,
        availability: this.calculateAvailability(profile),
        cost: this.calculateResourceCost(profile),
      };

      resources.push(resource);
    });

    return resources;
  }

  private identifyUniqueProfiles(jobProfiles: any[]): any[] {
    const unique = new Map<string, any>();

    jobProfiles.forEach((profile) => {
      const key = `${profile.projectRole}-${profile.resourceLevel}`;
      if (!unique.has(key)) {
        unique.set(key, profile);
      }
    });

    return Array.from(unique.values());
  }

  private calculateAvailability(profile: any): number {
    // Calculate availability based on worker type and resource level
    const baseAvailability = 40; // hours per week

    const typeMultiplier = {
      'Full Time': 1.0,
      'Part Time': 0.5,
      Contractor: 0.8,
      Consultant: 0.9,
    };

    const levelMultiplier = {
      Junior: 0.9,
      Mid: 1.0,
      Senior: 0.95,
      Lead: 0.9,
      Principal: 0.85,
    };

    const typeMultiplierValue = typeMultiplier[profile.workerType] || 1.0;
    const levelMultiplierValue = levelMultiplier[profile.resourceLevel] || 1.0;

    return Math.round(baseAvailability * typeMultiplierValue * levelMultiplierValue);
  }

  private calculateResourceCost(profile: any): number {
    // Calculate hourly rate based on resource level and cost region
    const baseRates = {
      Junior: 75,
      Mid: 100,
      Senior: 125,
      Lead: 150,
      Principal: 175,
    };

    const regionMultipliers = {
      US: 1.0,
      Europe: 0.9,
      Asia: 0.7,
      Global: 1.0,
    };

    const baseRate = baseRates[profile.resourceLevel] || 100;
    const regionMultiplier = regionMultipliers[profile.resourceCostRegion] || 1.0;

    return Math.round(baseRate * regionMultiplier);
  }
}
```

## Advanced Mapping Features

### 1. **Confidence Scoring**

#### Mapping Confidence Calculation

```typescript
interface MappingConfidence {
  overall: number;
  projectInfo: number;
  resourceDemands: number;
  effortEstimates: number;
  phaseMapping: number;
  resourceMapping: number;
}

class ConfidenceCalculator {
  calculateMappingConfidence(cetData: CETData, mappings: IntegrationMappings): MappingConfidence {
    return {
      projectInfo: this.calculateProjectInfoConfidence(cetData),
      resourceDemands: this.calculateResourceDemandConfidence(cetData),
      effortEstimates: this.calculateEffortEstimateConfidence(cetData),
      phaseMapping: this.calculatePhaseMappingConfidence(mappings),
      resourceMapping: this.calculateResourceMappingConfidence(mappings),
      overall: 0, // Calculated as weighted average
    };
  }

  private calculateProjectInfoConfidence(cetData: CETData): number {
    const requiredFields = ['Customer Name', 'Project Name'];
    const optionalFields = ['Digital Telco', 'Region', 'Language'];

    let confidence = 0;
    let totalFields = requiredFields.length + optionalFields.length;

    // Required fields have higher weight
    requiredFields.forEach((field) => {
      if (this.isFieldValid(cetData, field)) {
        confidence += 0.4; // 40% weight for required fields
      }
    });

    // Optional fields have lower weight
    optionalFields.forEach((field) => {
      if (this.isFieldValid(cetData, field)) {
        confidence += 0.1; // 10% weight for optional fields
      }
    });

    return Math.min(confidence, 1.0);
  }

  private calculateResourceDemandConfidence(cetData: CETData): number {
    const demandSheets = ['Ph1Demand', 'Ph2Demand', 'Ph3Demand', 'Ph4Demand'];
    let totalConfidence = 0;

    demandSheets.forEach((sheet) => {
      if (cetData[sheet] && cetData[sheet].length > 1) {
        const sheetData = cetData[sheet];
        const validRows = sheetData.filter((row, index) => index > 0 && this.isValidDemandRow(row));
        const confidence = validRows.length / (sheetData.length - 1);
        totalConfidence += confidence;
      }
    });

    return totalConfidence / demandSheets.length;
  }

  private isFieldValid(cetData: CETData, field: string): boolean {
    const value = this.extractFieldValue(cetData, field);
    return value && typeof value === 'string' && value.trim().length > 0;
  }

  private isValidDemandRow(row: any[]): boolean {
    return (
      row.length >= 4 &&
      !isNaN(parseInt(row[0])) &&
      !isNaN(parseFloat(row[2])) &&
      !isNaN(parseInt(row[3]))
    );
  }
}
```

### 2. **Conflict Resolution**

#### Mapping Conflict Detection

```typescript
interface MappingConflict {
  type: 'duplicate' | 'overlap' | 'inconsistency' | 'missing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedItems: string[];
  suggestedResolution: string;
}

class ConflictDetector {
  detectConflicts(mappings: IntegrationMappings): MappingConflict[] {
    const conflicts: MappingConflict[] = [];

    // Detect duplicate work packages
    conflicts.push(...this.detectDuplicateWorkPackages(mappings.toWorkPackages));

    // Detect milestone overlaps
    conflicts.push(...this.detectMilestoneOverlaps(mappings.toMilestones));

    // Detect resource conflicts
    conflicts.push(...this.detectResourceConflicts(mappings.toResources));

    // Detect data inconsistencies
    conflicts.push(...this.detectDataInconsistencies(mappings));

    return conflicts;
  }

  private detectDuplicateWorkPackages(workPackages: WorkPackageMapping[]): MappingConflict[] {
    const conflicts: MappingConflict[] = [];
    const seen = new Set<string>();

    workPackages.forEach((wp) => {
      const key = wp.workPackageName.toLowerCase();
      if (seen.has(key)) {
        conflicts.push({
          type: 'duplicate',
          severity: 'medium',
          description: `Duplicate work package name: ${wp.workPackageName}`,
          affectedItems: [wp.workPackageName],
          suggestedResolution: 'Rename one of the work packages or merge them',
        });
      } else {
        seen.add(key);
      }
    });

    return conflicts;
  }

  private detectMilestoneOverlaps(milestones: MilestoneMapping[]): MappingConflict[] {
    const conflicts: MappingConflict[] = [];

    // Check for overlapping milestone dates
    for (let i = 0; i < milestones.length; i++) {
      for (let j = i + 1; j < milestones.length; j++) {
        const m1 = milestones[i];
        const m2 = milestones[j];

        if (this.datesOverlap(m1.estimatedDate, m2.estimatedDate)) {
          conflicts.push({
            type: 'overlap',
            severity: 'high',
            description: `Milestone dates overlap: ${m1.milestoneName} and ${m2.milestoneName}`,
            affectedItems: [m1.milestoneName, m2.milestoneName],
            suggestedResolution: 'Adjust milestone dates to avoid overlap',
          });
        }
      }
    }

    return conflicts;
  }

  private datesOverlap(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 7; // Consider overlap if within 7 days
  }
}
```

### 3. **Data Validation**

#### Comprehensive Validation Rules

```typescript
interface ValidationRule {
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  validate: (data: any) => ValidationResult;
}

const validationRules: ValidationRule[] = [
  {
    name: 'Required Fields',
    description: 'All required fields must be present and valid',
    severity: 'error',
    validate: (data) => {
      const requiredFields = ['Customer Name', 'Project Name'];
      const missing = requiredFields.filter((field) => !data[field]);

      return {
        isValid: missing.length === 0,
        errors: missing.map((field) => `Missing required field: ${field}`),
        warnings: [],
      };
    },
  },
  {
    name: 'Effort Consistency',
    description: 'Total effort must match sum of weekly efforts',
    severity: 'warning',
    validate: (data) => {
      // Implementation for effort validation
      return { isValid: true, errors: [], warnings: [] };
    },
  },
  {
    name: 'Phase Sequence',
    description: 'Phases must be sequential and logical',
    severity: 'error',
    validate: (data) => {
      // Implementation for phase validation
      return { isValid: true, errors: [], warnings: [] };
    },
  },
];

class DataValidator {
  validateCETData(cetData: CETData): ValidationResult {
    const results: ValidationResult[] = [];

    validationRules.forEach((rule) => {
      const result = rule.validate(cetData);
      results.push(result);
    });

    return this.consolidateValidationResults(results);
  }

  private consolidateValidationResults(results: ValidationResult[]): ValidationResult {
    const allErrors = results.flatMap((r) => r.errors);
    const allWarnings = results.flatMap((r) => r.warnings);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      severity: this.calculateOverallSeverity(allErrors, allWarnings),
    };
  }

  private calculateOverallSeverity(
    errors: string[],
    warnings: string[],
  ): 'error' | 'warning' | 'info' {
    if (errors.length > 0) return 'error';
    if (warnings.length > 0) return 'warning';
    return 'info';
  }
}
```

## Mapping Configuration

### 1. **User-Defined Mapping Rules**

```typescript
interface UserMappingRule {
  id: string;
  name: string;
  description: string;
  sourceField: string;
  targetField: string;
  transformation: string; // JavaScript expression
  conditions: MappingCondition[];
  priority: number;
}

interface MappingCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'regex';
  value: any;
}

class UserMappingEngine {
  applyUserRules(data: any, rules: UserMappingRule[]): any {
    // Sort rules by priority
    const sortedRules = rules.sort((a, b) => b.priority - a.priority);

    sortedRules.forEach((rule) => {
      if (this.evaluateConditions(data, rule.conditions)) {
        data = this.applyTransformation(data, rule);
      }
    });

    return data;
  }

  private evaluateConditions(data: any, conditions: MappingCondition[]): boolean {
    return conditions.every((condition) => {
      const value = this.extractFieldValue(data, condition.field);

      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return String(value).includes(String(condition.value));
        case 'greater':
          return Number(value) > Number(condition.value);
        case 'less':
          return Number(value) < Number(condition.value);
        case 'regex':
          return new RegExp(condition.value).test(String(value));
        default:
          return false;
      }
    });
  }

  private applyTransformation(data: any, rule: UserMappingRule): any {
    try {
      // Safely evaluate transformation expression
      const transformedValue = this.safeEval(rule.transformation, { value: data });
      this.setFieldValue(data, rule.targetField, transformedValue);
    } catch (error) {
      console.warn(`Failed to apply transformation rule: ${rule.name}`, error);
    }

    return data;
  }

  private safeEval(expression: string, context: any): any {
    // Implement safe evaluation of transformation expressions
    // This should use a sandboxed environment or expression parser
    return eval(expression); // Note: In production, use a safer alternative
  }
}
```

### 2. **Mapping Templates**

```typescript
interface MappingTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  projectType: string;
  mappings: {
    project: ProjectMapping[];
    workPackages: WorkPackageMapping[];
    milestones: MilestoneMapping[];
    resources: ResourceMapping[];
  };
  validationRules: ValidationRule[];
}

const mappingTemplates: MappingTemplate[] = [
  {
    id: 'telco-standard',
    name: 'Telecommunications Standard',
    description: 'Standard mapping for telco projects',
    industry: 'Telecommunications',
    projectType: 'BSS Transformation',
    mappings: {
      project: standardProjectMappings,
      workPackages: standardWorkPackageMappings,
      milestones: standardMilestoneMappings,
      resources: standardResourceMappings,
    },
    validationRules: standardValidationRules,
  },
  {
    id: 'enterprise-custom',
    name: 'Enterprise Custom',
    description: 'Customizable mapping for enterprise projects',
    industry: 'Enterprise',
    projectType: 'Digital Transformation',
    mappings: {
      project: enterpriseProjectMappings,
      workPackages: enterpriseWorkPackageMappings,
      milestones: enterpriseMilestoneMappings,
      resources: enterpriseResourceMappings,
    },
    validationRules: enterpriseValidationRules,
  },
];
```

## Performance Optimization

### 1. **Batch Processing**

```typescript
class BatchProcessor {
  async processBatch(
    items: any[],
    processor: (item: any) => Promise<any>,
    batchSize: number = 100,
  ): Promise<any[]> {
    const results: any[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);

      // Add small delay to prevent overwhelming the system
      if (i + batchSize < items.length) {
        await this.delay(10);
      }
    }

    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### 2. **Caching Strategy**

```typescript
class MappingCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 300000): void {
    // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
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

---

_This data mapping strategy provides a comprehensive foundation for transforming CET v22.0 data into your delivery management system while maintaining data integrity and business logic._
