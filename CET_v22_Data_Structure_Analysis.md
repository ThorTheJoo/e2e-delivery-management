# CET v22 Data Structure Analysis

## Executive Summary

This document provides a comprehensive analysis of the CET (Cost Estimation Template) v22 Excel file structure, which serves as the foundation for our traceability system between Specsync requirements and estimation processes. The CET v22 file is a critical **demand planner** that quantifies delivery services for telecommunications transformation programs and large projects in our software vendor delivery methodology.

### **Business Context: Software Vendor Delivery Workflow**

The CET v22 file operates at the **presales phase** of our delivery methodology, serving as the bridge between:

1. **Requirements Analysis** → **Functional Scope Estimation** → **Service Design** → **Commercial Modeling**
2. **Resource Demand Planning** → **Pricing Strategy** → **Competitive Positioning** → **Contract Negotiation**

This file enables us to quantify delivery efforts across the entire project lifecycle, from analysis and design through production deployment, ensuring competitive pricing while maintaining profitability.

## File Overview

- **File Name**: CET v22.xlsx
- **Total Sheets**: 27
- **Total Rows**: 10,062
- **Total Columns**: 224 (maximum)
- **Purpose**: **Demand Planning & Resource Quantification Template** for Telecommunications Transformation Programs
- **Business Role**: Presales Resource Demand Planner for Commercial Modeling & Pricing Strategy
- **Delivery Phase**: Service Design Phase (Post-Requirements, Pre-Contract)
- **Analysis Date**: September 2, 2025

## Software Vendor Delivery Methodology Context

### **Presales Workflow Integration**

The CET v22 file serves as the **quantification engine** in our software vendor delivery methodology:

#### **Phase 1: Requirements Analysis & Functional Scope**

- **Input**: Specsync-generated requirements from RFP analysis
- **Process**: Functional scope breakdown and estimation
- **Output**: High-level effort estimates and scope boundaries

#### **Phase 2: Service Design & Resource Quantification** ⭐ **CET v22 Role**

- **Input**: Functional scope and requirements breakdown
- **Process**: Detailed resource demand planning across all delivery activities
- **Output**: Quantified delivery efforts for commercial modeling

#### **Phase 3: Commercial Modeling & Pricing Strategy**

- **Input**: CET v22 resource demand data
- **Process**: Cost calculation, margin analysis, competitive positioning
- **Output**: Final pricing strategy for contract negotiation

### **Delivery Activities Quantified in CET v22**

The file breaks down resource demand across these key delivery areas:

#### **Core Implementation Activities**

- **Analysis & Definition**: Requirements analysis, business process mapping
- **Design & Architecture**: Solution design, technical architecture, data modeling
- **Development & Building**: Custom development, configuration, integration
- **Testing & Quality Assurance**: Unit testing, integration testing, performance testing
- **Training & Knowledge Transfer**: End-user training, administrator training
- **Migration & Cutover**: Data migration, system cutover, production deployment
- **Infrastructure & Environments**: Environment setup, infrastructure provisioning

#### **Project Management & Governance**

- **Program Management**: Overall program coordination and oversight
- **Project Management**: Individual project planning and execution
- **Governance Activities**: Risk management, compliance, stakeholder management
- **Change Management**: Organizational change, process transformation

## Sheet Structure Analysis

### 1. Core Configuration Sheets

#### **Instructions Sheet**

- **Purpose**: User guidance and sheet navigation
- **Rows**: 32
- **Columns**: 3
- **Key Content**:
  - Blue tab identification for input requirements
  - Instructions for each functional area
  - Navigation guidance for users

#### **Attributes Sheet**

- **Purpose**: Project configuration and customer attributes
- **Rows**: 293
- **Columns**: 7
- **Key Fields**:
  - Customer Name
  - Digital Telco
  - Project Name (e.g., "BSS Transformation")
  - SFDC Type (e.g., "Type 2b")
  - Customer Facing Language (e.g., "English")
  - Region (e.g., "AMER")

#### **Summary Sheet**

- **Purpose**: High-level project overview and phase summary
- **Rows**: 47
- **Columns**: 7
- **Key Content**:
  - Project Name and Type
  - Phase Attributes (Phase 1-4 + Total Program)
  - Totals alignment indicators

### 2. Project Planning Sheets

#### **Project View Sheet**

- **Purpose**: Timeline and milestone planning
- **Rows**: 57
- **Columns**: 207
- **Structure**: Week-based timeline (1-207 weeks)
- **Key Features**:
  - Week-by-week project planning
  - Milestone tracking
  - Resource allocation timeline

#### **TurboProformaInput Sheet**

- **Purpose**: High-level project input parameters
- **Rows**: 123
- **Columns**: 7
- **Content**: Project configuration parameters for estimation

### 3. Phase-Based Demand Sheets

#### **Phase Demand Sheets (Ph1Demand, Ph2Demand, Ph3Demand, Ph4Demand)**

- **Purpose**: **Core Resource Demand Planning** for Commercial Modeling & Pricing
- **Business Impact**: Directly influences cost structure, margin analysis, and competitive positioning
- **Rows**: 85 each
- **Columns**: 223-224
- **Structure**:
  - **Resource Demand Quantification**: Skill-specific resource requirements by week
  - **Effort Estimation Breakdown**: Hours/days per role per activity
  - **Timeline Allocation**: Week-by-week resource allocation (1-207 weeks)
  - **Cost Driver Mapping**: Resource rates, effort multipliers, complexity factors

#### **Key Phase Demand Characteristics**:

- **Phase 1**: 85 rows × 223 columns
- **Phase 2**: 85 rows × 224 columns
- **Phase 3**: 85 rows × 224 columns
- **Phase 4**: 85 rows × 224 columns

### 4. Product/Service Configuration Sheets

#### **Governance Sheet**

- **Purpose**: Governance framework configuration
- **Rows**: 19
- **Columns**: 111
- **Content**: Governance rules, policies, and procedures

#### **Encompass Sheet**

- **Purpose**: Encompass product configuration
- **Rows**: 76
- **Columns**: 111
- **Content**: Product features, modules, and configuration options

#### **Ascendon Sheet**

- **Purpose**: Ascendon product configuration
- **Rows**: 55
- **Columns**: 109
- **Content**: Product features, modules, and configuration options

#### **CMA Sheet**

- **Purpose**: CMA product configuration
- **Rows**: 20
- **Columns**: 114
- **Content**: Product features, modules, and configuration options

#### **ManagedService Sheet**

- **Purpose**: Managed service configuration
- **Rows**: 30
- **Columns**: 42
- **Content**: Service level agreements and service definitions

### 5. Demand and Reference Data Sheets

#### **Demand Sheets (GovDemand, ENCDemand, ASCDemand, CMADemand)**

- **Purpose**: Detailed resource demand by product/service area
- **Structure**:
  - **GovDemand**: 629 rows × 223 columns
  - **ENCDemand**: 2,917 rows × 223 columns
  - **ASCDemand**: 2,085 rows × 223 columns
  - **CMADemand**: 629 rows × 223 columns

#### **Reference Data Sheets**

- **GovRefData**: 55 rows × 28 columns
- **ENCRefData**: 259 rows × 28 columns
- **ASCRefData**: 172 rows × 27 columns
- **CMARefData**: 52 rows × 27 columns
- **MSRefData**: 269 rows × 12 columns

### 6. Resource and Role Management

#### **JobProfiles Sheet**

- **Purpose**: **Resource Rate Structure & Skill Matrix** for Commercial Modeling
- **Business Impact**: Defines cost structure, resource availability, and competitive positioning
- **Rows**: 1,501
- **Columns**: 12
- **Key Fields**:
  - **Product / Service**: Product-specific resource requirements
  - **Project Team**: Team structure and composition
  - **Project Role**: Role definitions and responsibilities
  - **Sales Region**: Regional resource rates and availability
  - **Skill Requirements**: Skill matrix for resource allocation
  - **Resource Rates**: Cost per hour/day for commercial modeling
  - **Availability**: Resource availability by region and skill

#### **LookupValues Sheet**

- **Purpose**: Standardized lookup values and factors
- **Rows**: 341
- **Columns**: 5
- **Key Fields**:
  - Factor Name
  - Value
  - Standardized reference data

#### **Deal Types Definition Sheet**

- **Purpose**: Deal type classifications and definitions
- **Rows**: 8
- **Columns**: 7
- **Content**: SFDC deal type definitions and mappings

## Data Structure Patterns

### 1. Header Pattern Analysis

#### **Identification Fields**

- Customer Name, Project Name, SFDC Type
- Product/Service identifiers
- Phase identifiers (Phase 1-4)

#### **Configuration Fields**

- Region, Language, Digital Telco indicators
- Product-specific configuration options
- Service level parameters

#### **Timeline Fields**

- Week-based planning (1-207 weeks)
- Phase-based milestones
- Resource allocation periods

#### **Resource Fields**

- Job profiles and roles
- Skill requirements
- Effort estimates
- Cost factors

### 2. Data Organization Patterns

#### **Hierarchical Structure**

- Project → Phase → Product → Service → Role → Skill
- Customer → Region → Deal Type → Project Type
- Configuration → Demand → Reference Data

#### **Cross-Reference Patterns**

- Lookup values for standardization
- Reference data for validation
- Demand sheets linked to configuration sheets

#### **Calculation Patterns**

- Phase-based aggregation
- Product-based resource allocation
- Cost and effort calculations

## Commercial & Pricing Strategy Implications

### **Cost Structure & Margin Analysis**

The CET v22 file provides the foundation for our commercial modeling:

#### **Resource Cost Calculation**

- **Base Resource Costs**: Job profile rates × effort estimates
- **Complexity Multipliers**: Risk factors, technical complexity, regional adjustments
- **Overhead Allocation**: Project management, governance, infrastructure costs
- **Margin Structure**: Target margins by product, region, and deal type

#### **Competitive Positioning Factors**

- **Resource Efficiency**: Optimized resource allocation and skill utilization
- **Regional Cost Advantages**: Leveraging regional resource rate differences
- **Product Expertise**: Specialized knowledge reducing implementation time
- **Risk Management**: Accurate estimation reducing contingency requirements

### **Deal Structuring & Contract Negotiation**

The quantified resource demand enables:

#### **Pricing Strategy Development**

- **Fixed Price Contracts**: Accurate cost estimation for fixed-price proposals
- **Time & Materials**: Resource rate structure for T&M engagements
- **Hybrid Models**: Combination approaches based on project complexity
- **Volume Discounts**: Multi-phase project pricing optimization

#### **Risk Mitigation & Contingency Planning**

- **Resource Availability**: Ensuring resource availability for committed timelines
- **Skill Gap Analysis**: Identifying and planning for skill shortages
- **Regional Considerations**: Managing resource availability across regions
- **Escalation Planning**: Resource escalation costs and availability

## Key Insights for Application Development

### 1. Data Import Strategy

#### **Primary Input Sheet**

- **Attributes Sheet**: Main configuration input (293 rows × 7 columns)
- **Focus**: Customer, project, and product configuration

#### **Secondary Input Sheets**

- **Phase Demand Sheets**: Detailed resource requirements
- **Product Configuration Sheets**: Feature and module selection

### 2. Data Validation Requirements

#### **Reference Data Validation**

- Use LookupValues sheet for standardized values
- Validate against Reference Data sheets
- Ensure consistency across phases

#### **Cross-Sheet Validation**

- Phase totals alignment with project summary
- Product configuration consistency
- Resource allocation validation

### 3. Output Generation Strategy

#### **Estimation File Structure**

- Phase-based breakdown (4 phases)
- Product-specific resource allocation
- Role and skill mapping
- Timeline and milestone planning

#### **Template Customization**

- Customer-specific configuration
- Product module selection
- Service level customization
- Regional and language adaptation

## Application Architecture Implications

### 1. Data Model Design

#### **Core Entities**

- **Project**: Customer, type, region, language
- **Phase**: 1-4 phases with timeline
- **Product**: Encompass, Ascendon, CMA, Managed Service
- **Resource**: Job profiles, skills, effort estimates
- **Configuration**: Product features, service levels

#### **Relationships**

- Project → Phases (1:4)
- Phase → Products (1:many)
- Product → Resources (1:many)
- Configuration → Demand (1:1)

### 2. File Processing Requirements

#### **Input Processing**

- Excel file parsing (27 sheets)
- Data validation and consistency checks
- Cross-sheet relationship mapping
- Reference data validation

#### **Output Generation**

- Phase-based estimation templates
- Product-specific configurations
- Resource allocation matrices
- Timeline and milestone planning

### 3. User Interface Design

#### **Configuration Interface**

- Project setup wizard
- Product selection interface
- Phase configuration
- Resource allocation

#### **Validation Interface**

- Data consistency checks
- Cross-reference validation
- Error reporting and resolution
- Preview and confirmation

## Next Steps for Development

### 1. Immediate Actions

1. **Data Model Creation**: Define database schema based on identified entities
2. **Import Engine**: Build Excel processing for 27-sheet structure
3. **Validation Engine**: Implement cross-sheet validation rules
4. **Template Engine**: Create phase-based estimation templates

### 2. Phase 1 Development

1. **Core Infrastructure**: Database, file processing, validation
2. **Basic Import**: Attributes sheet processing
3. **Data Validation**: Reference data and consistency checks
4. **Simple Output**: Basic estimation file generation

### 3. Phase 2 Development

1. **Full Import**: All 27 sheets processing
2. **Advanced Validation**: Cross-sheet relationships
3. **Template Customization**: Product and phase-specific templates
4. **User Interface**: Configuration and validation interfaces

### 4. Phase 3 Development

1. **Advanced Features**: Timeline planning, resource allocation
2. **Reporting**: Phase summaries, cost analysis
3. **Integration**: External system connectivity
4. **Performance**: Large file optimization

## Conclusion

The CET v22 file represents a comprehensive **demand planning and resource quantification system** that is critical to our software vendor delivery methodology and commercial success. With 27 interconnected sheets covering project configuration, product setup, resource allocation, and phase-based planning, this file serves as the foundation for:

### **Business Value & Strategic Importance**

1. **Presales Excellence**: Accurate resource demand planning for competitive proposals
2. **Commercial Modeling**: Foundation for cost structure, margin analysis, and pricing strategy
3. **Risk Management**: Comprehensive resource planning reducing project delivery risks
4. **Competitive Positioning**: Optimized resource allocation for market competitiveness

### **Technical Capabilities Required**

1. **Process Complex Excel Files**: Handle 27-sheet structures with 10,000+ rows
2. **Maintain Data Integrity**: Validate cross-sheet relationships and reference data
3. **Generate Commercial Outputs**: Create pricing models and resource allocation matrices
4. **Support Traceability**: Link Specsync requirements to quantified delivery efforts

### **Strategic Integration**

The modular architecture of the file (phases, products, services) aligns perfectly with our traceability system requirements, enabling seamless mapping from Specsync requirements through detailed resource demand planning to final commercial proposals. This integration is essential for maintaining our competitive position in telecommunications transformation programs while ensuring profitable delivery execution.
