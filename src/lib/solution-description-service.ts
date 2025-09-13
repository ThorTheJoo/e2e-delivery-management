/**
 * Solution Description Generation Service
 * 
 * This service generates comprehensive solution descriptions based on:
 * - SpecSync requirements
 * - TMF function mappings
 * - Blue Dolphin traversal results (business processes, application services, interfaces)
 * 
 * Creates professional solution description documents with full traceability
 */

import { MappingResult, TraversalResultWithPayloads } from '@/types/blue-dolphin-relationships';
import { SpecSyncItem } from '@/types';

export interface SolutionDescriptionData {
  projectName: string;
  projectDescription: string;
  generatedDate: string;
  version: string;
  
  // Requirements and Functions
  requirements: SpecSyncItem[];
  tmfFunctions: TMFFunction[];
  
  // Architecture Components
  businessProcesses: ArchitectureComponent[];
  applicationServices: ArchitectureComponent[];
  applicationInterfaces: ArchitectureComponent[];
  applicationFunctions: ArchitectureComponent[];
  
  // Traceability
  traceabilityMap: TraceabilityMapping[];
  
  // Statistics
  statistics: {
    totalRequirements: number;
    totalTMFunctions: number;
    totalBusinessProcesses: number;
    totalApplicationServices: number;
    totalApplicationInterfaces: number;
    totalApplicationFunctions: number;
  };
}

export interface TMFFunction {
  id: string;
  name: string;
  domain: string;
  capability: string;
  description: string;
  requirements: string[];
  relatedObjects: string[];
}

export interface ArchitectureComponent {
  id: string;
  title: string;
  definition: string;
  description?: string;
  workspace: string;
  status: string;
  requirements: string[];
  relatedFunctions: string[];
  properties?: Record<string, any>;
}

export interface TraceabilityMapping {
  requirementId: string;
  requirementText: string;
  tmfFunction: string;
  businessProcesses: string[];
  applicationServices: string[];
  applicationInterfaces: string[];
  applicationFunctions: string[];
}

export class SolutionDescriptionService {
  
  /**
   * Generate solution description data from traversal results
   */
  static generateSolutionDescription(
    mappingResults: MappingResult[],
    traversalResults: TraversalResultWithPayloads[],
    requirements: SpecSyncItem[],
    projectName: string = 'E2E Delivery Management Solution'
  ): SolutionDescriptionData {
    
    // Extract TMF functions from mapping results
    const tmfFunctions = this.extractTMFFunctions(mappingResults, requirements);
    
    // Extract architecture components from traversal results
    const businessProcesses = this.extractArchitectureComponents(traversalResults, 'Business Process');
    const applicationServices = this.extractArchitectureComponents(traversalResults, 'Application Service');
    const applicationInterfaces = this.extractArchitectureComponents(traversalResults, 'Application Interface');
    const applicationFunctions = this.extractArchitectureComponents(traversalResults, 'Application Function');
    
    // Create traceability mapping
    const traceabilityMap = this.createTraceabilityMapping(
      mappingResults,
      traversalResults,
      requirements
    );
    
    // Calculate statistics
    const statistics = {
      totalRequirements: requirements.length,
      totalTMFunctions: tmfFunctions.length,
      totalBusinessProcesses: businessProcesses.length,
      totalApplicationServices: applicationServices.length,
      totalApplicationInterfaces: applicationInterfaces.length,
      totalApplicationFunctions: applicationFunctions.length
    };
    
    return {
      projectName,
      projectDescription: 'Comprehensive solution architecture derived from TMF-aligned requirements and Blue Dolphin architecture traversal',
      generatedDate: new Date().toISOString(),
      version: '1.0.0',
      requirements,
      tmfFunctions,
      businessProcesses,
      applicationServices,
      applicationInterfaces,
      applicationFunctions,
      traceabilityMap,
      statistics
    };
  }
  
  /**
   * Extract TMF functions from mapping results
   */
  private static extractTMFFunctions(
    mappingResults: MappingResult[],
    requirements: SpecSyncItem[]
  ): TMFFunction[] {
    const functionMap = new Map<string, TMFFunction>();
    
    mappingResults.forEach(mapping => {
      const functionKey = mapping.specSyncFunctionName;
      
      if (!functionMap.has(functionKey)) {
        // Find the requirement for this mapping
        const requirement = requirements.find(req => 
          req.requirementId === mapping.specSyncRequirementId
        );
        
        functionMap.set(functionKey, {
          id: mapping.blueDolphinObject.ID,
          name: mapping.specSyncFunctionName,
          domain: mapping.blueDolphinObject.Workspace || 'Unknown',
          capability: mapping.blueDolphinObject.Title,
          description: mapping.blueDolphinObject.Description || 'No description available',
          requirements: [mapping.specSyncRequirementId],
          relatedObjects: [mapping.blueDolphinObject.ID]
        });
      } else {
        // Add requirement to existing function
        const existingFunction = functionMap.get(functionKey)!;
        if (!existingFunction.requirements.includes(mapping.specSyncRequirementId)) {
          existingFunction.requirements.push(mapping.specSyncRequirementId);
        }
      }
    });
    
    return Array.from(functionMap.values());
  }
  
  /**
   * Extract architecture components by type from traversal results
   */
  private static extractArchitectureComponents(
    traversalResults: TraversalResultWithPayloads[],
    definition: string
  ): ArchitectureComponent[] {
    const components: ArchitectureComponent[] = [];
    const seenIds = new Set<string>();
    
    traversalResults.forEach(result => {
      // Extract from business processes
      if (definition === 'Business Process' && result.businessProcesses) {
        const allProcesses = [
          ...result.businessProcesses.topLevel,
          ...result.businessProcesses.childLevel,
          ...result.businessProcesses.grandchildLevel
        ];
        
        allProcesses.forEach(process => {
          if (!seenIds.has(process.ID) && process.Definition === definition) {
            components.push({
              id: process.ID,
              title: process.Title,
              definition: process.Definition,
              description: process.Description,
              workspace: process.Workspace || 'Unknown',
              status: process.Status || 'Unknown',
              requirements: this.extractRequirementsFromObject(process),
              relatedFunctions: [result.applicationFunction.ID],
              properties: process
            });
            seenIds.add(process.ID);
          }
        });
      }
      
      // Extract from application services
      if (definition === 'Application Service' && result.applicationServices) {
        const allServices = [
          ...result.applicationServices.topLevel,
          ...result.applicationServices.childLevel,
          ...result.applicationServices.grandchildLevel
        ];
        
        allServices.forEach(service => {
          if (!seenIds.has(service.ID) && service.Definition === definition) {
            components.push({
              id: service.ID,
              title: service.Title,
              definition: service.Definition,
              description: service.Description,
              workspace: service.Workspace || 'Unknown',
              status: service.Status || 'Unknown',
              requirements: this.extractRequirementsFromObject(service),
              relatedFunctions: [result.applicationFunction.ID],
              properties: service
            });
            seenIds.add(service.ID);
          }
        });
      }
      
      // Extract from application interfaces
      if (definition === 'Application Interface' && result.applicationInterfaces) {
        const allInterfaces = [
          ...result.applicationInterfaces.topLevel,
          ...result.applicationInterfaces.childLevel,
          ...result.applicationInterfaces.grandchildLevel
        ];
        
        allInterfaces.forEach(interface_ => {
          if (!seenIds.has(interface_.ID) && interface_.Definition === definition) {
            components.push({
              id: interface_.ID,
              title: interface_.Title,
              definition: interface_.Definition,
              description: interface_.Description,
              workspace: interface_.Workspace || 'Unknown',
              status: interface_.Status || 'Unknown',
              requirements: this.extractRequirementsFromObject(interface_),
              relatedFunctions: [result.applicationFunction.ID],
              properties: interface_
            });
            seenIds.add(interface_.ID);
          }
        });
      }
      
      // Extract from application functions
      if (definition === 'Application Function' && result.relatedApplicationFunctions) {
        result.relatedApplicationFunctions.forEach(func => {
          if (!seenIds.has(func.ID) && func.Definition === definition) {
            components.push({
              id: func.ID,
              title: func.Title,
              definition: func.Definition,
              description: func.Description,
              workspace: func.Workspace || 'Unknown',
              status: func.Status || 'Unknown',
              requirements: this.extractRequirementsFromObject(func),
              relatedFunctions: [result.applicationFunction.ID],
              properties: func
            });
            seenIds.add(func.ID);
          }
        });
      }
    });
    
    return components;
  }
  
  /**
   * Extract requirements from an object (placeholder - would need actual implementation)
   */
  private static extractRequirementsFromObject(obj: any): string[] {
    // This would need to be implemented based on how requirements are linked to objects
    // For now, return empty array
    return [];
  }
  
  /**
   * Create traceability mapping between requirements and architecture components
   */
  private static createTraceabilityMapping(
    mappingResults: MappingResult[],
    traversalResults: TraversalResultWithPayloads[],
    requirements: SpecSyncItem[]
  ): TraceabilityMapping[] {
    const traceabilityMap: TraceabilityMapping[] = [];
    
    mappingResults.forEach(mapping => {
      const requirement = requirements.find(req => 
        req.requirementId === mapping.specSyncRequirementId
      );
      
      if (requirement) {
        // Find the traversal result for this function
        const traversalResult = traversalResults.find(result => 
          result.applicationFunction.ID === mapping.blueDolphinObject.ID
        );
        
        const traceabilityMapping: TraceabilityMapping = {
          requirementId: mapping.specSyncRequirementId,
          requirementText: requirement.usecase1 || requirement.functionName,
          tmfFunction: mapping.specSyncFunctionName,
          businessProcesses: traversalResult ? [
            ...traversalResult.businessProcesses.topLevel,
            ...traversalResult.businessProcesses.childLevel,
            ...traversalResult.businessProcesses.grandchildLevel
          ].map(p => p.Title) : [],
          applicationServices: traversalResult ? [
            ...traversalResult.applicationServices.topLevel,
            ...traversalResult.applicationServices.childLevel,
            ...traversalResult.applicationServices.grandchildLevel
          ].map(s => s.Title) : [],
          applicationInterfaces: traversalResult ? [
            ...traversalResult.applicationInterfaces.topLevel,
            ...traversalResult.applicationInterfaces.childLevel,
            ...traversalResult.applicationInterfaces.grandchildLevel
          ].map(i => i.Title) : [],
          applicationFunctions: traversalResult?.relatedApplicationFunctions?.map(f => f.Title) || []
        };
        
        traceabilityMap.push(traceabilityMapping);
      }
    });
    
    return traceabilityMap;
  }
  
  /**
   * Generate markdown solution description document
   */
  static generateMarkdownDocument(data: SolutionDescriptionData): string {
    const sections = [
      this.generateDocumentHeader(data),
      this.generateExecutiveSummary(data),
      this.generateSolutionOverview(data),
      this.generateFunctionalScope(data),
      this.generateArchitectureComponents(data),
      this.generateTraceabilityMatrix(data),
      this.generateTechnicalSpecifications(data),
      this.generateImplementationPlan(data),
      this.generateAdditionalContent()
    ];
    
    return sections.join('\n\n');
  }
  
  private static generateDocumentHeader(data: SolutionDescriptionData): string {
    return `# Solution Description Document

**Project:** ${data.projectName}  
**Version:** ${data.version}  
**Generated:** ${new Date(data.generatedDate).toLocaleDateString()}  
**Document Type:** TMF-Aligned Solution Architecture

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Solution Overview](#solution-overview)
3. [Functional Scope](#functional-scope)
4. [Architecture Components](#architecture-components)
5. [Traceability Matrix](#traceability-matrix)
6. [Technical Specifications](#technical-specifications)
7. [Implementation Plan](#implementation-plan)
8. [Appendices](#appendices)

---`;
  }
  
  private static generateExecutiveSummary(data: SolutionDescriptionData): string {
    return `## Executive Summary

### Project Overview
${data.projectDescription}

### Key Statistics
- **Total Requirements:** ${data.statistics.totalRequirements}
- **TMF Functions Mapped:** ${data.statistics.totalTMFunctions}
- **Business Processes:** ${data.statistics.totalBusinessProcesses}
- **Application Services:** ${data.statistics.totalApplicationServices}
- **Application Interfaces:** ${data.statistics.totalApplicationInterfaces}
- **Application Functions:** ${data.statistics.totalApplicationFunctions}

### Solution Scope
This solution provides comprehensive TMF-aligned architecture covering ${data.statistics.totalTMFunctions} core functions across multiple business processes and application services. The architecture ensures full traceability from business requirements through to technical implementation.

### Business Value
- **Standardized Architecture:** TMF-aligned design ensures industry best practices
- **Complete Traceability:** Full mapping from requirements to technical components
- **Scalable Foundation:** Architecture supports future enhancements and integrations
- **Risk Mitigation:** Comprehensive coverage reduces implementation risks`;
  }
  
  private static generateSolutionOverview(data: SolutionDescriptionData): string {
    return `## Solution Overview

### Architecture Approach
The solution follows TMF Open Digital Architecture (ODA) principles, providing a standardized approach to telecom service management and delivery orchestration.

### Core Components
The solution architecture includes:

1. **Business Processes** (${data.statistics.totalBusinessProcesses} identified)
   - End-to-end business workflows
   - Process automation and optimization
   - Integration with external systems

2. **Application Services** (${data.statistics.totalApplicationServices} identified)
   - Service-oriented architecture components
   - Reusable business logic
   - API-based integration points

3. **Application Interfaces** (${data.statistics.totalApplicationInterfaces} identified)
   - Standardized communication protocols
   - Data exchange mechanisms
   - Integration endpoints

4. **Application Functions** (${data.statistics.totalApplicationFunctions} identified)
   - Core business functionality
   - TMF-aligned function mapping
   - Requirement implementation

### Integration Strategy
The solution integrates with existing enterprise systems through:
- Standardized APIs and interfaces
- TMF-compliant data models
- Blue Dolphin architecture repository
- SpecSync requirements management

### Use Case Integration
**Note**: This section should be populated with content from the "E2E Use Case.docx" document. Please provide the following information:

#### Primary Use Cases
- [ ] **Use Case 1**: [Description from E2E Use Case.docx]
- [ ] **Use Case 2**: [Description from E2E Use Case.docx]
- [ ] **Use Case 3**: [Description from E2E Use Case.docx]

#### Business Scenarios
- [ ] **Scenario 1**: [Description from E2E Use Case.docx]
- [ ] **Scenario 2**: [Description from E2E Use Case.docx]

### Product Description Integration
**Note**: This section should be populated with content from the "Encompass 12 Product Description Jan 2025.docx" document. Please provide the following information:

#### Product Overview
- [ ] **Product Name**: [From Encompass 12 Product Description]
- [ ] **Product Version**: [From Encompass 12 Product Description]
- [ ] **Key Features**: [From Encompass 12 Product Description]

#### Technical Specifications
- [ ] **Architecture**: [From Encompass 12 Product Description]
- [ ] **Integration Points**: [From Encompass 12 Product Description]
- [ ] **Performance Requirements**: [From Encompass 12 Product Description]`;
  }
  
  private static generateFunctionalScope(data: SolutionDescriptionData): string {
    const functionsList = data.tmfFunctions.map(func => 
      `- **${func.name}** (${func.domain})
    - Capability: ${func.capability}
    - Requirements: ${func.requirements.length}
    - Description: ${func.description}`
    ).join('\n');
    
    return `## Functional Scope

### TMF Function Mapping
The solution implements the following TMF functions:

${functionsList}

### Requirement Coverage
Each TMF function addresses specific business requirements:

${data.tmfFunctions.map(func => 
  `#### ${func.name}
**Domain:** ${func.domain}  
**Capability:** ${func.capability}

**Requirements Addressed:**
${func.requirements.map(reqId => {
  const req = data.requirements.find(r => r.requirementId === reqId);
  return `- ${reqId}: ${req?.usecase1 || req?.functionName || 'No description'}`
}).join('\n')}

**Description:** ${func.description}`
).join('\n\n')}`;
  }
  
  private static generateArchitectureComponents(data: SolutionDescriptionData): string {
    const businessProcessesList = data.businessProcesses.map(process => 
      `- **${process.title}**
    - Workspace: ${process.workspace}
    - Status: ${process.status}
    - Description: ${process.description || 'No description available'}`
    ).join('\n');
    
    const applicationServicesList = data.applicationServices.map(service => 
      `- **${service.title}**
    - Workspace: ${service.workspace}
    - Status: ${service.status}
    - Description: ${service.description || 'No description available'}`
    ).join('\n');
    
    const applicationInterfacesList = data.applicationInterfaces.map(interface_ => 
      `- **${interface_.title}**
    - Workspace: ${interface_.workspace}
    - Status: ${interface_.status}
    - Description: ${interface_.description || 'No description available'}`
    ).join('\n');
    
    return `## Architecture Components

### Business Processes
${data.statistics.totalBusinessProcesses} business processes have been identified:

${businessProcessesList}

### Application Services
${data.statistics.totalApplicationServices} application services provide core functionality:

${applicationServicesList}

### Application Interfaces
${data.statistics.totalApplicationInterfaces} application interfaces enable system integration:

${applicationInterfacesList}

### Application Functions
${data.statistics.totalApplicationFunctions} application functions implement business logic:

${data.applicationFunctions.map(func => 
  `- **${func.title}**
    - Workspace: ${func.workspace}
    - Status: ${func.status}
    - Description: ${func.description || 'No description available'}`
).join('\n')}`;
  }
  
  private static generateTraceabilityMatrix(data: SolutionDescriptionData): string {
    const matrixRows = data.traceabilityMap.map(mapping => 
      `| ${mapping.requirementId} | ${mapping.requirementText} | ${mapping.tmfFunction} | ${mapping.businessProcesses.join(', ')} | ${mapping.applicationServices.join(', ')} | ${mapping.applicationInterfaces.join(', ')} |`
    ).join('\n');
    
    return `## Traceability Matrix

This section provides complete traceability from business requirements through to technical implementation.

| Requirement ID | Requirement Text | TMF Function | Business Processes | Application Services | Application Interfaces |
|---|---|---|---|---|---|
${matrixRows}

### Traceability Summary
- **Total Requirements Mapped:** ${data.traceabilityMap.length}
- **Requirements with Business Processes:** ${data.traceabilityMap.filter(m => m.businessProcesses.length > 0).length}
- **Requirements with Application Services:** ${data.traceabilityMap.filter(m => m.applicationServices.length > 0).length}
- **Requirements with Application Interfaces:** ${data.traceabilityMap.filter(m => m.applicationInterfaces.length > 0).length}`;
  }
  
  private static generateTechnicalSpecifications(data: SolutionDescriptionData): string {
    return `## Technical Specifications

### Architecture Principles
- **TMF ODA Compliance:** Full alignment with TMF Open Digital Architecture
- **Service-Oriented Design:** Modular, reusable components
- **API-First Approach:** Standardized integration interfaces
- **Cloud-Native:** Scalable, resilient architecture

### Technology Stack
- **Frontend:** Next.js 14, React 18, TypeScript
- **UI Framework:** TailwindCSS, shadcn UI, Radix UI
- **Backend:** Node.js, TypeScript
- **Database:** Supabase (PostgreSQL)
- **Integration:** Blue Dolphin OData API, SpecSync
- **Visualization:** Miro API
- **Delivery:** Azure DevOps

### Data Models
- **Requirements:** SpecSync-compliant requirement structure
- **Architecture:** Blue Dolphin object model
- **TMF Mapping:** Standardized function and domain mapping
- **Traceability:** Bidirectional requirement-to-implementation mapping

### Integration Points
- **Blue Dolphin:** Architecture repository and relationship traversal
- **SpecSync:** Requirements management and import/export
- **Miro:** Collaborative architecture visualization
- **Azure DevOps:** Delivery orchestration and work item management`;
  }
  
  private static generateImplementationPlan(data: SolutionDescriptionData): string {
    return `## Implementation Plan

### Phase 1: Foundation (Weeks 1-2)
- TMF function mapping and validation
- Core architecture component identification
- Initial traceability mapping

### Phase 2: Architecture Development (Weeks 3-4)
- Business process definition and optimization
- Application service design and specification
- Interface definition and API design

### Phase 3: Implementation (Weeks 5-8)
- Core functionality development
- Integration implementation
- Testing and validation

### Phase 4: Deployment (Weeks 9-10)
- System deployment and configuration
- User training and documentation
- Go-live support

### Success Criteria
- All requirements mapped to TMF functions
- Complete traceability matrix established
- Architecture components validated
- Integration points tested and verified`;
  }
  
  private static generateAdditionalContent(): string {
    return `## Additional Content Integration

### Freedom Modernization Solution Description
**Note**: This section should be populated with content from the "Freedom Modernization Solution Description v1.0 - Final.docx" document. Please provide the following information:

#### Solution Architecture
- [ ] **Architecture Overview**: [From Freedom Modernization document]
- [ ] **Key Components**: [From Freedom Modernization document]
- [ ] **Integration Patterns**: [From Freedom Modernization document]

#### Modernization Strategy
- [ ] **Migration Approach**: [From Freedom Modernization document]
- [ ] **Risk Mitigation**: [From Freedom Modernization document]
- [ ] **Success Metrics**: [From Freedom Modernization document]

### SV Solution Description Generator
**Note**: This section should be populated with content from the "SV Solution Description Generator.docx" document. Please provide the following information:

#### Generator Specifications
- [ ] **Tool Overview**: [From SV Solution Description Generator document]
- [ ] **Input Requirements**: [From SV Solution Description Generator document]
- [ ] **Output Format**: [From SV Solution Description Generator document]

#### Usage Guidelines
- [ ] **Step-by-Step Process**: [From SV Solution Description Generator document]
- [ ] **Best Practices**: [From SV Solution Description Generator document]
- [ ] **Troubleshooting**: [From SV Solution Description Generator document]

---

## Content Integration Instructions

To complete this solution description document, please:

1. **Open each Word document** listed above
2. **Copy the relevant content** from each document
3. **Replace the placeholder text** in the corresponding sections above
4. **Update the checkboxes** to reflect completed sections
5. **Review and validate** the integrated content for accuracy

### Document Mapping
- **E2E Use Case.docx** → Use Case Integration section
- **Encompass 12 Product Description Jan 2025.docx** → Product Description Integration section  
- **Freedom Modernization Solution Description v1.0 - Final.docx** → Additional Content Integration section
- **SV Solution Description Generator.docx** → Additional Content Integration section

---

## Next Steps

To complete this solution description document, please follow the Content Integration Instructions above to incorporate the content from your Word documents.`;
  }
}
