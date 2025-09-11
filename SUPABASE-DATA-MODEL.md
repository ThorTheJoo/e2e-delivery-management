# 📊 Supabase Data Model Design

## Entity Relationship Overview

### Core Entities

```
Projects (1) ──┐
              ├── User Domains (1:N)
              ├── SpecSync Items (1:N)
              ├── CETv22 Data (1:1)
              ├── Blue Dolphin Objects (1:N)
              ├── Work Packages (1:N)
              ├── Bill of Materials (1:N)
              └── Integration Configs (1:N)
```

### Reference Data

```
TMF Reference Domains (1) ──┐
                            ├── TMF Reference Capabilities (1:N)
                            └── User Domains (1:1) [via reference_domain_id]

TMF Reference Capabilities (1) ─── User Capabilities (1:1) [via reference_capability_id]
```

## Detailed Table Specifications

### 1. Core Tables

#### **projects**
- **Purpose**: Main project containers
- **Key Fields**: id, name, customer, status, dates
- **Relationships**: One-to-many with all project data
- **Flexibility**: metadata JSONB for custom fields

#### **tmf_reference_domains** (Enhanced)
- **Purpose**: TMF ODA reference domains
- **Key Fields**: id, name, description, category, version
- **Enhancements**: metadata JSONB, version tracking, category classification
- **Flexibility**: Dynamic field support via metadata

#### **tmf_reference_capabilities** (Enhanced)
- **Purpose**: TMF ODA reference capabilities
- **Key Fields**: id, name, description, domain_id, level
- **Enhancements**: metadata JSONB, level classification, category support
- **Flexibility**: Dynamic field support via metadata

### 2. User Data Tables

#### **user_domains**
- **Purpose**: User-selected and custom domains
- **Key Fields**: id, project_id, name, description, reference_domain_id
- **State Fields**: is_selected, is_expanded, requirement_count
- **Flexibility**: metadata JSONB for custom attributes

#### **user_capabilities**
- **Purpose**: User-selected and custom capabilities
- **Key Fields**: id, domain_id, name, description, reference_capability_id
- **State Fields**: is_selected, requirement_count
- **Flexibility**: metadata JSONB for custom attributes

### 3. Integration Data Tables

#### **specsync_items**
- **Purpose**: Imported SpecSync requirements
- **Key Fields**: id, project_id, requirement_id, function_name, capability
- **Effort Fields**: effort_ba, effort_sa, effort_dev, effort_qa
- **Use Case Fields**: usecase1, usecase2, usecase3
- **Flexibility**: metadata JSONB for additional fields

#### **cetv22_data**
- **Purpose**: CETv22 project analysis data
- **Key Fields**: id, project_id, customer_name, project_name
- **Complex Data**: phases, products, job_profiles, resource_demands (JSONB)
- **Analysis Data**: analysis_result (JSONB)
- **Flexibility**: Full JSONB support for complex structures

#### **blue_dolphin_objects**
- **Purpose**: Blue Dolphin enterprise architecture objects
- **Key Fields**: id, project_id, blue_dolphin_id, title, object_type
- **Raw Data**: raw_data (JSONB) for complete object data
- **Flexibility**: metadata JSONB for additional attributes

### 4. Project Management Tables

#### **work_packages**
- **Purpose**: Project work breakdown structure
- **Key Fields**: id, project_id, name, description, type, status
- **Effort Fields**: effort_ba, effort_sa, effort_dev, effort_qa
- **Relationships**: dependencies (UUID array), milestones (JSONB)
- **Flexibility**: metadata JSONB for custom fields

#### **bill_of_materials**
- **Purpose**: Resource and component tracking
- **Key Fields**: id, project_id, tmf_domain, capability, requirement
- **Effort Fields**: effort_ba, effort_sa, effort_dev, effort_qa
- **Service Data**: service_delivery_services (JSONB)
- **Flexibility**: metadata JSONB for additional attributes

### 5. Configuration Tables

#### **integration_configs**
- **Purpose**: Integration settings and configurations
- **Key Fields**: id, project_id, integration_type, config_name, is_active
- **Config Data**: config_data (JSONB) for flexible configuration storage
- **Flexibility**: Full JSONB support for any integration type

#### **user_preferences**
- **Purpose**: User-specific settings and preferences
- **Key Fields**: id, project_id, preference_key, preference_value
- **Flexibility**: JSONB value storage for any preference type

## Data Flexibility Strategy

### 1. JSONB Metadata Pattern

Every table includes a `metadata` JSONB column that can store:

```json
{
  "schemaVersion": "1.0",
  "customFields": [
    {
      "name": "customField1",
      "type": "string",
      "value": "custom value"
    }
  ],
  "integrationData": {
    "sourceSystem": "external-system",
    "lastSync": "2025-01-01T00:00:00Z"
  },
  "userDefined": {
    "priority": "high",
    "tags": ["urgent", "customer-facing"]
  }
}
```

### 2. Dynamic Field Management

#### **Field Definition Storage**
```typescript
interface FieldDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}
```

#### **Dynamic Field Processing**
```typescript
class DynamicFieldProcessor {
  static processEntity<T>(entity: T, fieldDefinitions: FieldDefinition[]): T {
    const processed = { ...entity };
    
    fieldDefinitions.forEach(field => {
      if (field.required && !processed[field.name]) {
        processed[field.name] = field.defaultValue;
      }
      
      if (processed[field.name] && field.validation) {
        this.validateField(processed[field.name], field.validation);
      }
    });
    
    return processed;
  }
}
```

### 3. Version Management

#### **Schema Versioning**
```typescript
interface SchemaVersion {
  version: string;
  appliedAt: string;
  changes: SchemaChange[];
}

interface SchemaChange {
  type: 'ADD_COLUMN' | 'MODIFY_COLUMN' | 'ADD_INDEX' | 'ADD_CONSTRAINT';
  table: string;
  details: any;
}
```

#### **Data Migration Support**
```typescript
class DataMigrator {
  async migrateEntity<T>(
    entity: T,
    fromVersion: string,
    toVersion: string
  ): Promise<T> {
    const migrationPath = this.getMigrationPath(fromVersion, toVersion);
    
    let migratedEntity = entity;
    for (const migration of migrationPath) {
      migratedEntity = await migration.apply(migratedEntity);
    }
    
    return migratedEntity;
  }
}
```

## Query Optimization

### 1. Indexing Strategy

#### **Primary Indexes**
```sql
-- Projects
CREATE INDEX idx_projects_customer ON projects(customer);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- SpecSync Items
CREATE INDEX idx_specsync_items_project_id ON specsync_items(project_id);
CREATE INDEX idx_specsync_items_capability ON specsync_items(capability);
CREATE INDEX idx_specsync_items_priority ON specsync_items(priority);

-- User Domains
CREATE INDEX idx_user_domains_project_id ON user_domains(project_id);
CREATE INDEX idx_user_domains_reference_id ON user_domains(reference_domain_id);

-- Blue Dolphin Objects
CREATE INDEX idx_blue_dolphin_objects_project_id ON blue_dolphin_objects(project_id);
CREATE INDEX idx_blue_dolphin_objects_type ON blue_dolphin_objects(object_type);
```

#### **Composite Indexes**
```sql
-- Project + Status queries
CREATE INDEX idx_projects_customer_status ON projects(customer, status);

-- SpecSync + Project + Capability queries
CREATE INDEX idx_specsync_project_capability ON specsync_items(project_id, capability);

-- User Domains + Project + Selection queries
CREATE INDEX idx_user_domains_project_selected ON user_domains(project_id, is_selected);
```

### 2. Query Patterns

#### **Efficient Project Data Loading**
```sql
-- Load complete project with all related data
WITH project_data AS (
  SELECT p.*, 
         json_agg(DISTINCT ud.*) as domains,
         json_agg(DISTINCT si.*) as specsync_items,
         json_agg(DISTINCT bdo.*) as blue_dolphin_objects
  FROM projects p
  LEFT JOIN user_domains ud ON p.id = ud.project_id
  LEFT JOIN specsync_items si ON p.id = si.project_id
  LEFT JOIN blue_dolphin_objects bdo ON p.id = bdo.project_id
  WHERE p.id = $1
  GROUP BY p.id
)
SELECT * FROM project_data;
```

#### **Flexible Filtering with JSONB**
```sql
-- Filter by custom metadata fields
SELECT * FROM specsync_items 
WHERE project_id = $1 
  AND metadata->>'customField' = 'customValue'
  AND metadata->>'priority' = 'high';

-- Search within JSONB arrays
SELECT * FROM work_packages 
WHERE project_id = $1 
  AND milestones @> '[{"status": "completed"}]';
```

## Real-time Features

### 1. Real-time Subscriptions

#### **Project-level Subscriptions**
```typescript
// Subscribe to all project data changes
const subscription = supabase
  .channel('project-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'projects',
    filter: `id=eq.${projectId}`
  }, (payload) => {
    handleProjectChange(payload);
  })
  .subscribe();
```

#### **Entity-specific Subscriptions**
```typescript
// Subscribe to SpecSync items changes
const specSyncSubscription = supabase
  .channel('specsync-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'specsync_items',
    filter: `project_id=eq.${projectId}`
  }, (payload) => {
    handleSpecSyncChange(payload);
  })
  .subscribe();
```

### 2. Collaborative Features

#### **Multi-user Editing**
```typescript
interface CollaborationState {
  userId: string;
  entityId: string;
  entityType: string;
  lastModified: string;
  isEditing: boolean;
}

class CollaborationManager {
  async startEditing(entityId: string, entityType: string): Promise<void> {
    await supabase.from('collaboration_states').upsert({
      user_id: this.userId,
      entity_id: entityId,
      entity_type: entityType,
      is_editing: true,
      last_modified: new Date().toISOString()
    });
  }
  
  async stopEditing(entityId: string): Promise<void> {
    await supabase.from('collaboration_states')
      .delete()
      .eq('user_id', this.userId)
      .eq('entity_id', entityId);
  }
}
```

## Security Model

### 1. Row Level Security (RLS)

#### **Project-based Access Control**
```sql
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE specsync_items ENABLE ROW LEVEL SECURITY;

-- Project access policies
CREATE POLICY "Users can access their projects" ON projects
  FOR ALL USING (auth.uid() = created_by);

-- Related data access policies
CREATE POLICY "Users can access project domains" ON user_domains
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE auth.uid() = created_by
    )
  );
```

#### **Integration-specific Security**
```sql
-- SpecSync items access
CREATE POLICY "Users can access project specsync items" ON specsync_items
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE auth.uid() = created_by
    )
  );

-- Blue Dolphin objects access
CREATE POLICY "Users can access project blue dolphin objects" ON blue_dolphin_objects
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE auth.uid() = created_by
    )
  );
```

### 2. Data Validation

#### **Database Constraints**
```sql
-- Status value constraints
ALTER TABLE projects ADD CONSTRAINT check_project_status 
  CHECK (status IN ('Planning', 'In Progress', 'Completed', 'On Hold'));

-- Priority value constraints
ALTER TABLE specsync_items ADD CONSTRAINT check_priority 
  CHECK (priority IN ('Low', 'Medium', 'High', 'Critical'));

-- Effort value constraints
ALTER TABLE work_packages ADD CONSTRAINT check_effort_positive 
  CHECK (effort_ba >= 0 AND effort_sa >= 0 AND effort_dev >= 0 AND effort_qa >= 0);
```

#### **Application-level Validation**
```typescript
class EntityValidator {
  static validateProject(project: Partial<Project>): ValidationResult {
    const errors: string[] = [];
    
    if (!project.name || project.name.trim().length === 0) {
      errors.push('Project name is required');
    }
    
    if (project.status && !['Planning', 'In Progress', 'Completed', 'On Hold'].includes(project.status)) {
      errors.push('Invalid project status');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

This data model provides a comprehensive, flexible, and scalable foundation for the E2E Delivery Management System's data persistence needs while maintaining full compatibility with existing functionality.
