# SpecSync Requirements to Domain/Capability Mapping Guide

## Overview

This document outlines how the E2E Delivery Management application processes SpecSync input files to automatically map business requirements to TMF domains and capabilities. The mapping system provides intelligent categorization, effort estimation, and integration with the broader delivery management workflow.

### Recent Enhancements (Latest Update)

- **Badge Counts**: Real-time display of requirement and use case counts for each domain and capability
- **Modifiable Preview Panel**: Inline editing capabilities for imported SpecSync data
- **Enhanced Domain Summary**: Visual grid showing domain-level statistics with badge counts
- **Improved Data Validation**: Better error handling and data quality checks
- **Extensible Field Mapping Framework**: Flexible architecture for future field additions and integrations

## Input File Format & Structure

### Supported File Types

- **CSV**: Primary format with comma-separated values
- **Excel**: .xlsx and .xls files (converted to CSV internally)
- **JSON**: Structured data format (planned)

### Core Data Fields

The system maps the following key fields from SpecSync input files:

#### **Requirement Identification**

- `Rephrased Requirement ID`: Unique identifier for atomic requirements
- `Source Requirement ID`: Original requirement identifier
- `Source`: Origin system identifier
- `Source Category`: High-level requirement category
- `Source Sub-Category`: Detailed classification

#### **Domain & Architecture Classification**

- `Rephrased Domain`: Primary business domain (e.g., Product, Resource, Partner, Enterprise, Integration)
- `Rephrased Vertical`: Business vertical (e.g., Billing, CRM, Order Management)
- `Rephrased AF Lev.1`: Architecture Framework Level 1 (e.g., Rating and Follow up)
- `Rephrased AF Lev.2`: Architecture Framework Level 2 (e.g., Tariff Calculation and Rating)
- `Rephrased Function Name`: Specific function name (e.g., Price and Discount Calculation)

#### **Capability Mapping**

- `Reference Capability Category`: High-level capability grouping
- `Reference Capability`: Specific capability name
- `Reference Capability Description`: Detailed capability description

#### **Additional Metadata**

- `Estimate`: Numeric effort estimation
- `Matching Feature`: Feature mapping
- `Matching Tags`: Tag-based categorization
- `Common Tag 1-5`: Standard categorization tags
- `Additional Tag 1-10`: Extended tagging system

## Extensible Field Mapping Framework

### **Current Field Mapping Architecture**

The system currently implements a flexible header mapping system that can be easily extended:

```typescript
// Current header mapping implementation
const headerMap = {
  rephrasedRequirementId:
    headers.find((h) => /rephrased.*requirement.*id/i.test(h)) || 'Rephrased Requirement ID',
  sourceRequirementId:
    headers.find((h) => /source.*requirement.*id/i.test(h)) || 'Source Requirement ID',
  domain: headers.find((h) => /rephrased.*domain/i.test(h)) || 'Rephrased Domain',
  vertical: headers.find((h) => /rephrased.*vertical/i.test(h)) || 'Rephrased Vertical',
  functionName:
    headers.find((h) => /rephrased.*function.*name/i.test(h)) || 'Rephrased Function Name',
  afLevel2: headers.find((h) => /rephrased.*af.*lev.*2/i.test(h)) || 'Rephrased AF Lev.2',
  capability: headers.find((h) => /reference.*capability/i.test(h)) || 'Reference Capability',
  referenceCapability:
    headers.find((h) => /reference.*capability/i.test(h)) || 'Reference Capability',
  usecase1: headers.find((h) => /usecase.*1/i.test(h)) || 'Usecase 1',
};
```

### **Extensible Field Configuration System**

To support future field additions and integrations, the system implements a configurable field mapping framework:

#### **Field Definition Schema**

```typescript
interface FieldDefinition {
  key: string; // Internal field identifier
  displayName: string; // Human-readable field name
  headerPatterns: string[]; // Regex patterns for header matching
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'array';
  required: boolean; // Whether field is required for processing
  editable: boolean; // Whether field can be edited in UI
  visible: boolean; // Whether field is shown in preview table
  validation?: ValidationRule[]; // Field validation rules
  mapping?: MappingRule[]; // Domain/capability mapping rules
  integration?: IntegrationConfig; // Integration-specific configuration
}

interface ValidationRule {
  type: 'required' | 'format' | 'length' | 'custom';
  value?: any;
  message: string;
}

interface MappingRule {
  type: 'exact' | 'partial' | 'regex' | 'domain-guided';
  pattern: string;
  target: string;
  priority: number;
}

interface IntegrationConfig {
  blueDolphin?: {
    objectType: string;
    propertyMapping: Record<string, string>;
  };
  miro?: {
    cardType: string;
    visualProperties: Record<string, string>;
  };
  ado?: {
    workItemType: string;
    fieldMapping: Record<string, string>;
  };
}
```

#### **Configurable Field Registry**

```typescript
// Extensible field registry for future integrations
const FIELD_REGISTRY: Record<string, FieldDefinition> = {
  // Core requirement fields
  rephrasedRequirementId: {
    key: 'rephrasedRequirementId',
    displayName: 'Requirement ID',
    headerPatterns: [/rephrased.*requirement.*id/i, /requirement.*id/i],
    dataType: 'string',
    required: true,
    editable: true,
    visible: true,
    validation: [
      { type: 'required', message: 'Requirement ID is required' },
      { type: 'format', value: /^[A-Z0-9-]+$/, message: 'Invalid requirement ID format' },
    ],
    integration: {
      blueDolphin: {
        objectType: 'Requirement',
        propertyMapping: { id: 'rephrasedRequirementId' },
      },
      ado: {
        workItemType: 'Requirement',
        fieldMapping: { 'System.Title': 'rephrasedRequirementId' },
      },
    },
  },

  // Domain classification fields
  domain: {
    key: 'domain',
    displayName: 'Domain',
    headerPatterns: [/rephrased.*domain/i, /domain/i],
    dataType: 'string',
    required: false,
    editable: true,
    visible: true,
    mapping: [
      { type: 'exact', pattern: 'product', target: 'product-domain', priority: 1 },
      { type: 'exact', pattern: 'resource', target: 'resource-domain', priority: 1 },
      { type: 'partial', pattern: 'billing|charging', target: 'product-domain', priority: 2 },
      {
        type: 'partial',
        pattern: 'infrastructure|network',
        target: 'resource-domain',
        priority: 2,
      },
    ],
    integration: {
      blueDolphin: {
        objectType: 'Domain',
        propertyMapping: { name: 'domain' },
      },
      miro: {
        cardType: 'domain-frame',
        visualProperties: { backgroundColor: 'domain-color-mapping' },
      },
    },
  },

  // Extended metadata fields (for future use)
  estimate: {
    key: 'estimate',
    displayName: 'Effort Estimate',
    headerPatterns: [/estimate/i, /effort/i, /story.*points/i],
    dataType: 'number',
    required: false,
    editable: true,
    visible: true,
    validation: [{ type: 'format', value: /^\d+(\.\d+)?$/, message: 'Estimate must be a number' }],
    integration: {
      ado: {
        workItemType: 'Task',
        fieldMapping: { 'Microsoft.VSTS.Scheduling.StoryPoints': 'estimate' },
      },
    },
  },

  // Integration-specific fields
  blueDolphinObjectId: {
    key: 'blueDolphinObjectId',
    displayName: 'Blue Dolphin Object ID',
    headerPatterns: [/blue.*dolphin.*id/i, /bd.*id/i],
    dataType: 'string',
    required: false,
    editable: false,
    visible: true,
    integration: {
      blueDolphin: {
        objectType: 'Any',
        propertyMapping: { id: 'blueDolphinObjectId' },
      },
    },
  },

  // Custom metadata fields
  tags: {
    key: 'tags',
    displayName: 'Tags',
    headerPatterns: [/tags/i, /labels/i, /categories/i],
    dataType: 'array',
    required: false,
    editable: true,
    visible: true,
    integration: {
      miro: {
        cardType: 'requirement-card',
        visualProperties: { tags: 'tags' },
      },
    },
  },
};
```

### **Dynamic Field Processing Engine**

The system implements a dynamic field processing engine that can handle new fields without code changes:

```typescript
class DynamicFieldProcessor {
  private fieldRegistry: Record<string, FieldDefinition>;

  constructor(fieldRegistry: Record<string, FieldDefinition>) {
    this.fieldRegistry = fieldRegistry;
  }

  // Process headers and map to field definitions
  processHeaders(headers: string[]): Record<string, string> {
    const headerMap: Record<string, string> = {};

    Object.entries(this.fieldRegistry).forEach(([fieldKey, definition]) => {
      const matchedHeader = headers.find((header) =>
        definition.headerPatterns.some((pattern) => pattern.test(header)),
      );

      if (matchedHeader) {
        headerMap[fieldKey] = matchedHeader;
      } else if (definition.required) {
        throw new Error(`Required field '${definition.displayName}' not found in headers`);
      }
    });

    return headerMap;
  }

  // Parse row data according to field definitions
  parseRow(
    values: string[],
    headers: string[],
    headerMap: Record<string, string>,
  ): Record<string, any> {
    const row: Record<string, any> = {};

    Object.entries(headerMap).forEach(([fieldKey, headerName]) => {
      const headerIndex = headers.indexOf(headerName);
      const rawValue = values[headerIndex] || '';
      const definition = this.fieldRegistry[fieldKey];

      row[fieldKey] = this.parseValue(rawValue, definition);
    });

    return row;
  }

  // Parse value according to field data type
  private parseValue(rawValue: string, definition: FieldDefinition): any {
    const trimmedValue = rawValue.trim();

    switch (definition.dataType) {
      case 'number':
        return trimmedValue ? parseFloat(trimmedValue) : null;
      case 'boolean':
        return /^(true|yes|1)$/i.test(trimmedValue);
      case 'array':
        return trimmedValue ? trimmedValue.split(',').map((s) => s.trim()) : [];
      case 'date':
        return trimmedValue ? new Date(trimmedValue) : null;
      default:
        return trimmedValue;
    }
  }

  // Validate field values
  validateRow(row: Record<string, any>): ValidationError[] {
    const errors: ValidationError[] = [];

    Object.entries(this.fieldRegistry).forEach(([fieldKey, definition]) => {
      const value = row[fieldKey];

      definition.validation?.forEach((rule) => {
        if (!this.validateRule(value, rule)) {
          errors.push({
            field: fieldKey,
            message: rule.message,
            value: value,
          });
        }
      });
    });

    return errors;
  }
}
```

## Flexible UI Architecture

### **Dynamic Table Generation**

The preview table is generated dynamically based on field definitions:

```typescript
interface DynamicTableConfig {
  columns: TableColumn[];
  editableFields: string[];
  visibleFields: string[];
  sortableFields: string[];
  filterableFields: string[];
}

interface TableColumn {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any, index: number) => React.ReactNode;
  editable?: boolean;
  validation?: ValidationRule[];
}

// Dynamic table component that adapts to field definitions
function DynamicSpecSyncTable({
  items,
  fieldDefinitions,
  onEdit,
  onSave,
  onCancel
}: DynamicSpecSyncTableProps) {
  const columns = generateColumnsFromFieldDefinitions(fieldDefinitions);

  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className="bg-muted/70">
          {columns.map(column => (
            <th key={column.key} className="border border-muted-foreground/20 px-2 py-1 text-left">
              {column.header}
            </th>
          ))}
          <th className="border border-muted-foreground/20 px-2 py-1 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <DynamicTableRow
            key={index}
            item={item}
            columns={columns}
            index={index}
            onEdit={onEdit}
            onSave={onSave}
            onCancel={onCancel}
          />
        ))}
      </tbody>
    </table>
  );
}
```

### **Configurable Field Editors**

The system supports different field editor types based on data type and configuration:

```typescript
interface FieldEditorProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

function DynamicFieldEditor({ field, value, onChange, onSave, onCancel }: FieldEditorProps) {
  const [editValue, setEditValue] = useState(value);
  const [errors, setErrors] = useState<string[]>([]);

  const validateField = (value: any) => {
    const fieldErrors: string[] = [];

    field.validation?.forEach(rule => {
      if (!validateRule(value, rule)) {
        fieldErrors.push(rule.message);
      }
    });

    setErrors(fieldErrors);
    return fieldErrors.length === 0;
  };

  const handleSave = () => {
    if (validateField(editValue)) {
      onChange(editValue);
      onSave();
    }
  };

  const renderEditor = () => {
    switch (field.dataType) {
      case 'number':
        return (
          <input
            type="number"
            value={editValue || ''}
            onChange={(e) => setEditValue(parseFloat(e.target.value) || null)}
            className="w-full px-1 py-0.5 text-xs border rounded"
            autoFocus
          />
        );

      case 'boolean':
        return (
          <select
            value={editValue ? 'true' : 'false'}
            onChange={(e) => setEditValue(e.target.value === 'true')}
            className="w-full px-1 py-0.5 text-xs border rounded"
            autoFocus
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );

      case 'array':
        return (
          <input
            type="text"
            value={Array.isArray(editValue) ? editValue.join(', ') : ''}
            onChange={(e) => setEditValue(e.target.value.split(',').map(s => s.trim()))}
            className="w-full px-1 py-0.5 text-xs border rounded"
            placeholder="Comma-separated values"
            autoFocus
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={editValue ? new Date(editValue).toISOString().split('T')[0] : ''}
            onChange={(e) => setEditValue(new Date(e.target.value))}
            className="w-full px-1 py-0.5 text-xs border rounded"
            autoFocus
          />
        );

      default:
        return (
          <input
            type="text"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-1 py-0.5 text-xs border rounded"
            autoFocus
          />
        );
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {renderEditor()}
      <Button
        size="sm"
        variant="ghost"
        className="h-4 w-4 p-0"
        onClick={handleSave}
        disabled={errors.length > 0}
      >
        <Save className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-4 w-4 p-0"
        onClick={onCancel}
      >
        <Cancel className="h-3 w-3" />
      </Button>
      {errors.length > 0 && (
        <div className="text-xs text-red-500">
          {errors.join(', ')}
        </div>
      )}
    </div>
  );
}
```

## Integration Framework Extensibility

### **Plugin-Based Integration Architecture**

The system implements a plugin-based architecture for integrations:

```typescript
interface IntegrationPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: IntegrationCapability[];
  configSchema: Record<string, any>;
  initialize: (config: any) => Promise<void>;
  processData: (data: SpecSyncItem[], config: any) => Promise<IntegrationResult>;
  validateConfig: (config: any) => ValidationError[];
}

interface IntegrationCapability {
  type: 'import' | 'export' | 'sync' | 'mapping' | 'validation';
  name: string;
  description: string;
  configurable: boolean;
}

interface IntegrationResult {
  success: boolean;
  processedCount: number;
  errors: string[];
  warnings: string[];
  data?: any;
}

// Integration plugin registry
class IntegrationRegistry {
  private plugins: Map<string, IntegrationPlugin> = new Map();

  registerPlugin(plugin: IntegrationPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  getPlugin(id: string): IntegrationPlugin | undefined {
    return this.plugins.get(id);
  }

  getPluginsByCapability(capability: string): IntegrationPlugin[] {
    return Array.from(this.plugins.values()).filter((plugin) =>
      plugin.capabilities.some((cap) => cap.type === capability),
    );
  }

  async processWithPlugin(
    pluginId: string,
    data: SpecSyncItem[],
    config: any,
  ): Promise<IntegrationResult> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`);
    }

    await plugin.initialize(config);
    return await plugin.processData(data, config);
  }
}
```

### **Blue Dolphin Integration Extensibility**

The Blue Dolphin integration is designed to be extensible for additional object types and properties:

```typescript
interface BlueDolphinIntegrationConfig {
  apiUrl: string;
  odataUrl: string;
  protocol: 'REST' | 'ODATA' | 'HYBRID';
  authentication: {
    type: 'basic' | 'oauth' | 'api-key';
    credentials: Record<string, string>;
  };
  objectMappings: Record<string, ObjectMappingConfig>;
  fieldMappings: Record<string, FieldMappingConfig>;
  syncRules: SyncRule[];
}

interface ObjectMappingConfig {
  objectType: string;
  sourceField: string;
  targetProperty: string;
  transformation?: (value: any) => any;
  validation?: ValidationRule[];
  required: boolean;
}

interface FieldMappingConfig {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  transformation?: (value: any) => any;
  defaultValue?: any;
  validation?: ValidationRule[];
}

interface SyncRule {
  condition: (item: SpecSyncItem) => boolean;
  action: 'create' | 'update' | 'delete' | 'skip';
  priority: number;
  description: string;
}

// Extensible Blue Dolphin integration
class ExtensibleBlueDolphinIntegration {
  private config: BlueDolphinIntegrationConfig;
  private registry: IntegrationRegistry;

  constructor(config: BlueDolphinIntegrationConfig, registry: IntegrationRegistry) {
    this.config = config;
    this.registry = registry;
  }

  async syncSpecSyncData(items: SpecSyncItem[]): Promise<SyncResult> {
    const results: SyncOperation[] = [];

    for (const item of items) {
      const syncRule = this.findApplicableSyncRule(item);
      if (!syncRule) continue;

      try {
        const operation = await this.executeSyncOperation(item, syncRule);
        results.push(operation);
      } catch (error) {
        results.push({
          type: 'error',
          itemId: item.rephrasedRequirementId,
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }
    }

    return {
      syncedCount: results.filter((r) => r.type === 'success').length,
      errorCount: results.filter((r) => r.type === 'error').length,
      operations: results,
    };
  }

  private findApplicableSyncRule(item: SpecSyncItem): SyncRule | null {
    return (
      this.config.syncRules
        .filter((rule) => rule.condition(item))
        .sort((a, b) => b.priority - a.priority)[0] || null
    );
  }

  private async executeSyncOperation(item: SpecSyncItem, rule: SyncRule): Promise<SyncOperation> {
    const mappedData = this.mapItemToBlueDolphinFormat(item);

    switch (rule.action) {
      case 'create':
        return await this.createBlueDolphinObject(mappedData);
      case 'update':
        return await this.updateBlueDolphinObject(mappedData);
      case 'delete':
        return await this.deleteBlueDolphinObject(mappedData);
      case 'skip':
        return {
          type: 'skipped',
          itemId: item.rephrasedRequirementId,
          message: rule.description,
          timestamp: new Date().toISOString(),
        };
      default:
        throw new Error(`Unknown sync action: ${rule.action}`);
    }
  }

  private mapItemToBlueDolphinFormat(item: SpecSyncItem): Record<string, any> {
    const mapped: Record<string, any> = {};

    Object.entries(this.config.fieldMappings).forEach(([sourceField, mapping]) => {
      const sourceValue = item[sourceField as keyof SpecSyncItem];
      let targetValue = sourceValue;

      // Apply transformation if defined
      if (mapping.transformation) {
        targetValue = mapping.transformation(sourceValue);
      }

      // Apply default value if source is empty
      if (targetValue === null || targetValue === undefined || targetValue === '') {
        targetValue = mapping.defaultValue;
      }

      // Validate value
      if (mapping.validation) {
        const errors = this.validateValue(targetValue, mapping.validation);
        if (errors.length > 0) {
          throw new Error(`Validation failed for field '${sourceField}': ${errors.join(', ')}`);
        }
      }

      mapped[mapping.targetField] = targetValue;
    });

    return mapped;
  }
}
```

### **Miro Integration Extensibility**

The Miro integration supports dynamic board creation and object mapping:

```typescript
interface MiroIntegrationConfig {
  accessToken: string;
  boardTemplates: BoardTemplate[];
  objectMappings: MiroObjectMapping[];
  visualStyles: VisualStyleConfig;
  syncOptions: MiroSyncOptions;
}

interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  layout: BoardLayout;
  defaultObjects: MiroObjectTemplate[];
}

interface BoardLayout {
  type: 'grid' | 'hierarchy' | 'flow' | 'custom';
  columns?: number;
  spacing?: number;
  orientation?: 'horizontal' | 'vertical';
}

interface MiroObjectTemplate {
  type: 'frame' | 'card' | 'shape' | 'text' | 'connector';
  properties: Record<string, any>;
  dataBinding: DataBindingConfig;
  style: VisualStyleConfig;
}

interface DataBindingConfig {
  sourceField: string;
  targetProperty: string;
  transformation?: (value: any) => any;
  conditional?: (value: any) => boolean;
}

interface VisualStyleConfig {
  backgroundColor?: string | ((data: any) => string);
  borderColor?: string | ((data: any) => string);
  textColor?: string | ((data: any) => string);
  fontSize?: number | ((data: any) => number);
  fontWeight?: string | ((data: any) => string);
  borderRadius?: number;
  shadow?: boolean;
}

interface MiroSyncOptions {
  autoSync: boolean;
  syncInterval: number;
  conflictResolution: 'source-wins' | 'target-wins' | 'manual';
  includeMetadata: boolean;
  includeAttachments: boolean;
}

// Extensible Miro integration
class ExtensibleMiroIntegration {
  private config: MiroIntegrationConfig;
  private miroService: MiroService;

  constructor(config: MiroIntegrationConfig, miroService: MiroService) {
    this.config = config;
    this.miroService = miroService;
  }

  async createDynamicBoard(
    items: SpecSyncItem[],
    templateId: string,
  ): Promise<{ boardId: string; viewLink: string }> {
    const template = this.config.boardTemplates.find((t) => t.id === templateId);
    if (!template) {
      throw new Error(`Board template '${templateId}' not found`);
    }

    // Create board
    const board = await this.miroService.createBoard(template.name);

    // Group items by domain for frame creation
    const domainGroups = this.groupItemsByDomain(items);

    // Create frames for each domain
    for (const [domain, domainItems] of Object.entries(domainGroups)) {
      await this.createDomainFrame(board.id, domain, domainItems, template);
    }

    // Create connectors between related objects
    await this.createConnectors(board.id, items, template);

    return {
      boardId: board.id,
      viewLink: board.viewLink,
    };
  }

  private async createDomainFrame(
    boardId: string,
    domain: string,
    items: SpecSyncItem[],
    template: BoardTemplate,
  ): Promise<void> {
    const frameTemplate = template.defaultObjects.find((obj) => obj.type === 'frame');
    if (!frameTemplate) return;

    const frameProperties = this.applyDataBinding(frameTemplate.properties, {
      domain,
      itemCount: items.length,
    });
    const frameStyle = this.applyVisualStyle(frameTemplate.style, {
      domain,
      itemCount: items.length,
    });

    const frame = await this.miroService.createFrame(boardId, {
      ...frameProperties,
      ...frameStyle,
      title: `${domain} (${items.length} requirements)`,
    });

    // Create cards for each item in the domain
    for (const item of items) {
      await this.createItemCard(boardId, frame.id, item, template);
    }
  }

  private async createItemCard(
    boardId: string,
    frameId: string,
    item: SpecSyncItem,
    template: BoardTemplate,
  ): Promise<void> {
    const cardTemplate = template.defaultObjects.find((obj) => obj.type === 'card');
    if (!cardTemplate) return;

    const cardProperties = this.applyDataBinding(cardTemplate.properties, item);
    const cardStyle = this.applyVisualStyle(cardTemplate.style, item);

    await this.miroService.createCard(boardId, {
      ...cardProperties,
      ...cardStyle,
      parentId: frameId,
      title: item.rephrasedRequirementId,
      description: item.functionName,
    });
  }

  private applyDataBinding(properties: Record<string, any>, data: any): Record<string, any> {
    const result: Record<string, any> = {};

    Object.entries(properties).forEach(([key, value]) => {
      if (typeof value === 'object' && value.dataBinding) {
        const binding = value.dataBinding;
        let fieldValue = data[binding.sourceField];

        if (binding.transformation) {
          fieldValue = binding.transformation(fieldValue);
        }

        if (binding.conditional && !binding.conditional(fieldValue)) {
          return; // Skip this property if conditional is false
        }

        result[key] = fieldValue;
      } else {
        result[key] = value;
      }
    });

    return result;
  }

  private applyVisualStyle(style: VisualStyleConfig, data: any): Record<string, any> {
    const result: Record<string, any> = {};

    Object.entries(style).forEach(([key, value]) => {
      if (typeof value === 'function') {
        result[key] = value(data);
      } else {
        result[key] = value;
      }
    });

    return result;
  }
}
```

## Configuration Management

### **Dynamic Configuration System**

The system supports runtime configuration updates without code changes:

```typescript
interface ConfigurationManager {
  // Field definitions
  getFieldDefinitions(): Record<string, FieldDefinition>;
  updateFieldDefinition(key: string, definition: FieldDefinition): void;
  addFieldDefinition(key: string, definition: FieldDefinition): void;
  removeFieldDefinition(key: string): void;

  // Integration configurations
  getIntegrationConfig(integrationId: string): any;
  updateIntegrationConfig(integrationId: string, config: any): void;
  validateIntegrationConfig(integrationId: string, config: any): ValidationError[];

  // UI configurations
  getUIConfig(): UIConfig;
  updateUIConfig(config: Partial<UIConfig>): void;

  // Persistence
  saveConfiguration(): Promise<void>;
  loadConfiguration(): Promise<void>;
  exportConfiguration(): string;
  importConfiguration(configData: string): Promise<void>;
}

interface UIConfig {
  tableColumns: string[];
  editableFields: string[];
  visibleFields: string[];
  sortableFields: string[];
  filterableFields: string[];
  badgeConfig: BadgeConfig;
  theme: ThemeConfig;
}

interface BadgeConfig {
  showRequirementCounts: boolean;
  showUseCaseCounts: boolean;
  showCapabilityCounts: boolean;
  colors: Record<string, string>;
  positions: Record<string, 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>;
}

interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}
```

### **Configuration Persistence**

```typescript
class LocalStorageConfigurationManager implements ConfigurationManager {
  private config: AppConfiguration;
  private readonly STORAGE_KEY = 'specsync-configuration';

  constructor() {
    this.config = this.loadDefaultConfiguration();
    this.loadConfiguration();
  }

  private loadDefaultConfiguration(): AppConfiguration {
    return {
      fieldDefinitions: FIELD_REGISTRY,
      integrationConfigs: {},
      uiConfig: {
        tableColumns: ['rephrasedRequirementId', 'domain', 'capability', 'usecase1'],
        editableFields: ['rephrasedRequirementId', 'domain', 'capability', 'usecase1'],
        visibleFields: ['rephrasedRequirementId', 'domain', 'capability', 'usecase1'],
        sortableFields: ['rephrasedRequirementId', 'domain'],
        filterableFields: ['domain', 'capability'],
        badgeConfig: {
          showRequirementCounts: true,
          showUseCaseCounts: true,
          showCapabilityCounts: true,
          colors: {
            requirement: '#3b82f6',
            useCase: '#f59e0b',
            capability: '#10b981',
          },
          positions: {
            requirement: 'top-right',
            useCase: 'top-left',
            capability: 'bottom-right',
          },
        },
        theme: {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
          accentColor: '#f59e0b',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
        },
      },
    };
  }

  async saveConfiguration(): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw error;
    }
  }

  async loadConfiguration(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.config = { ...this.loadDefaultConfiguration(), ...parsed };
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      // Fall back to default configuration
    }
  }

  exportConfiguration(): string {
    return JSON.stringify(this.config, null, 2);
  }

  async importConfiguration(configData: string): Promise<void> {
    try {
      const parsed = JSON.parse(configData);
      this.config = { ...this.loadDefaultConfiguration(), ...parsed };
      await this.saveConfiguration();
    } catch (error) {
      console.error('Failed to import configuration:', error);
      throw error;
    }
  }
}
```

## Future Integration Extensibility

### **Planned Integration Points**

The framework is designed to support the following future integrations:

#### **1. Azure DevOps Integration**

- Work item creation from SpecSync requirements
- Bidirectional synchronization
- Custom field mapping
- Sprint planning integration

#### **2. Jira Integration**

- Issue creation and linking
- Epic/Story hierarchy mapping
- Custom field support
- Agile board integration

#### **3. Confluence Integration**

- Requirement documentation generation
- Automatic page creation
- Template-based content generation
- Version control integration

#### **4. ServiceNow Integration**

- Change request creation
- Configuration item mapping
- Service catalog integration
- Workflow automation

#### **5. Enterprise Architecture Tools**

- Sparx Enterprise Architect
- IBM Rational System Architect
- BiZZdesign Enterprise Studio
- Custom EA tool integrations

### **API-First Design**

The system implements an API-first design for external integrations:

```typescript
interface SpecSyncAPI {
  // Data management
  importData(file: File): Promise<ImportResult>;
  exportData(format: 'csv' | 'json' | 'xml'): Promise<string>;
  validateData(data: SpecSyncItem[]): Promise<ValidationResult>;

  // Field management
  getFieldDefinitions(): Promise<FieldDefinition[]>;
  updateFieldDefinition(definition: FieldDefinition): Promise<void>;
  addCustomField(definition: FieldDefinition): Promise<void>;

  // Integration management
  getIntegrations(): Promise<IntegrationInfo[]>;
  configureIntegration(id: string, config: any): Promise<void>;
  testIntegration(id: string): Promise<TestResult>;
  executeIntegration(id: string, data: SpecSyncItem[]): Promise<IntegrationResult>;

  // UI configuration
  getUIConfig(): Promise<UIConfig>;
  updateUIConfig(config: Partial<UIConfig>): Promise<void>;
  getTheme(): Promise<ThemeConfig>;
  updateTheme(theme: Partial<ThemeConfig>): Promise<void>;
}

// REST API implementation
class SpecSyncRESTAPI implements SpecSyncAPI {
  private baseUrl: string;
  private authToken: string;

  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async importData(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<ImportResult>('/api/import', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async getFieldDefinitions(): Promise<FieldDefinition[]> {
    return this.request<FieldDefinition[]>('/api/fields');
  }

  async updateFieldDefinition(definition: FieldDefinition): Promise<void> {
    await this.request('/api/fields', {
      method: 'PUT',
      body: JSON.stringify(definition),
    });
  }

  async getIntegrations(): Promise<IntegrationInfo[]> {
    return this.request<IntegrationInfo[]>('/api/integrations');
  }

  async configureIntegration(id: string, config: any): Promise<void> {
    await this.request(`/api/integrations/${id}/config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }
}
```

## Migration and Versioning

### **Schema Versioning**

The system supports schema versioning for backward compatibility:

```typescript
interface SchemaVersion {
  version: string;
  changes: SchemaChange[];
  migrationScript?: (data: any) => any;
  deprecatedFields?: string[];
  newFields?: FieldDefinition[];
}

interface SchemaChange {
  type: 'add' | 'remove' | 'modify' | 'rename';
  field: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

class SchemaManager {
  private versions: SchemaVersion[] = [];
  private currentVersion: string;

  constructor(currentVersion: string) {
    this.currentVersion = currentVersion;
    this.initializeVersions();
  }

  private initializeVersions() {
    this.versions = [
      {
        version: '1.0.0',
        changes: [
          {
            type: 'add',
            field: 'usecase1',
            description: 'Added use case field for enhanced requirement tracking',
          },
        ],
        newFields: [
          {
            key: 'usecase1',
            displayName: 'Use Case',
            headerPatterns: [/usecase.*1/i],
            dataType: 'string',
            required: false,
            editable: true,
            visible: true,
          },
        ],
      },
      {
        version: '1.1.0',
        changes: [
          {
            type: 'add',
            field: 'estimate',
            description: 'Added effort estimation field',
          },
          {
            type: 'modify',
            field: 'capability',
            oldValue: 'string',
            newValue: 'object',
            description: 'Enhanced capability field to support complex mappings',
          },
        ],
        newFields: [
          {
            key: 'estimate',
            displayName: 'Effort Estimate',
            headerPatterns: [/estimate/i, /effort/i],
            dataType: 'number',
            required: false,
            editable: true,
            visible: true,
          },
        ],
      },
    ];
  }

  migrateData(data: any, targetVersion: string): any {
    const currentVersionIndex = this.versions.findIndex((v) => v.version === this.currentVersion);
    const targetVersionIndex = this.versions.findIndex((v) => v.version === targetVersion);

    if (currentVersionIndex === -1 || targetVersionIndex === -1) {
      throw new Error('Invalid version specified');
    }

    let migratedData = { ...data };

    // Apply migrations in order
    if (currentVersionIndex < targetVersionIndex) {
      // Forward migration
      for (let i = currentVersionIndex + 1; i <= targetVersionIndex; i++) {
        const version = this.versions[i];
        if (version.migrationScript) {
          migratedData = version.migrationScript(migratedData);
        }
      }
    } else {
      // Backward migration
      for (let i = currentVersionIndex - 1; i >= targetVersionIndex; i--) {
        const version = this.versions[i];
        if (version.migrationScript) {
          migratedData = version.migrationScript(migratedData);
        }
      }
    }

    return migratedData;
  }

  getMigrationPath(fromVersion: string, toVersion: string): SchemaChange[] {
    const changes: SchemaChange[] = [];
    const fromIndex = this.versions.findIndex((v) => v.version === fromVersion);
    const toIndex = this.versions.findIndex((v) => v.version === toVersion);

    if (fromIndex === -1 || toIndex === -1) {
      throw new Error('Invalid version specified');
    }

    if (fromIndex < toIndex) {
      // Forward migration
      for (let i = fromIndex + 1; i <= toIndex; i++) {
        changes.push(...this.versions[i].changes);
      }
    } else {
      // Backward migration
      for (let i = fromIndex - 1; i >= toIndex; i--) {
        changes.push(...this.versions[i].changes);
      }
    }

    return changes;
  }
}
```

## Extensible Field Mapping Framework

### **Current Field Mapping Architecture**

The system currently implements a flexible header mapping system that can be easily extended:

```typescript
// Current header mapping implementation
const headerMap = {
  rephrasedRequirementId:
    headers.find((h) => /rephrased.*requirement.*id/i.test(h)) || 'Rephrased Requirement ID',
  sourceRequirementId:
    headers.find((h) => /source.*requirement.*id/i.test(h)) || 'Source Requirement ID',
  domain: headers.find((h) => /rephrased.*domain/i.test(h)) || 'Rephrased Domain',
  vertical: headers.find((h) => /rephrased.*vertical/i.test(h)) || 'Rephrased Vertical',
  functionName:
    headers.find((h) => /rephrased.*function.*name/i.test(h)) || 'Rephrased Function Name',
  afLevel2: headers.find((h) => /rephrased.*af.*lev.*2/i.test(h)) || 'Rephrased AF Lev.2',
  capability: headers.find((h) => /reference.*capability/i.test(h)) || 'Reference Capability',
  referenceCapability:
    headers.find((h) => /reference.*capability/i.test(h)) || 'Reference Capability',
  usecase1: headers.find((h) => /usecase.*1/i.test(h)) || 'Usecase 1',
};
```

### **Extensible Field Configuration System**

To support future field additions and integrations, the system implements a configurable field mapping framework:

#### **Field Definition Schema**

```typescript
interface FieldDefinition {
  key: string; // Internal field identifier
  displayName: string; // Human-readable field name
  headerPatterns: string[]; // Regex patterns for header matching
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'array';
  required: boolean; // Whether field is required for processing
  editable: boolean; // Whether field can be edited in UI
  visible: boolean; // Whether field is shown in preview table
  validation?: ValidationRule[]; // Field validation rules
  mapping?: MappingRule[]; // Domain/capability mapping rules
  integration?: IntegrationConfig; // Integration-specific configuration
}
```

#### **Configurable Field Registry**

```typescript
// Extensible field registry for future integrations
const FIELD_REGISTRY: Record<string, FieldDefinition> = {
  // Core requirement fields
  rephrasedRequirementId: {
    key: 'rephrasedRequirementId',
    displayName: 'Requirement ID',
    headerPatterns: [/rephrased.*requirement.*id/i, /requirement.*id/i],
    dataType: 'string',
    required: true,
    editable: true,
    visible: true,
    validation: [
      { type: 'required', message: 'Requirement ID is required' },
      { type: 'format', value: /^[A-Z0-9-]+$/, message: 'Invalid requirement ID format' },
    ],
    integration: {
      blueDolphin: {
        objectType: 'Requirement',
        propertyMapping: { id: 'rephrasedRequirementId' },
      },
      ado: {
        workItemType: 'Requirement',
        fieldMapping: { 'System.Title': 'rephrasedRequirementId' },
      },
    },
  },

  // Extended metadata fields (for future use)
  estimate: {
    key: 'estimate',
    displayName: 'Effort Estimate',
    headerPatterns: [/estimate/i, /effort/i, /story.*points/i],
    dataType: 'number',
    required: false,
    editable: true,
    visible: true,
    validation: [{ type: 'format', value: /^\d+(\.\d+)?$/, message: 'Estimate must be a number' }],
    integration: {
      ado: {
        workItemType: 'Task',
        fieldMapping: { 'Microsoft.VSTS.Scheduling.StoryPoints': 'estimate' },
      },
    },
  },

  // Integration-specific fields
  blueDolphinObjectId: {
    key: 'blueDolphinObjectId',
    displayName: 'Blue Dolphin Object ID',
    headerPatterns: [/blue.*dolphin.*id/i, /bd.*id/i],
    dataType: 'string',
    required: false,
    editable: false,
    visible: true,
    integration: {
      blueDolphin: {
        objectType: 'Any',
        propertyMapping: { id: 'blueDolphinObjectId' },
      },
    },
  },
};
```

## Flexible UI Architecture

### **Dynamic Table Generation**

The preview table is generated dynamically based on field definitions:

```typescript
interface DynamicTableConfig {
  columns: TableColumn[];
  editableFields: string[];
  visibleFields: string[];
  sortableFields: string[];
  filterableFields: string[];
}

// Dynamic table component that adapts to field definitions
function DynamicSpecSyncTable({
  items,
  fieldDefinitions,
  onEdit,
  onSave,
  onCancel
}: DynamicSpecSyncTableProps) {
  const columns = generateColumnsFromFieldDefinitions(fieldDefinitions);

  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className="bg-muted/70">
          {columns.map(column => (
            <th key={column.key} className="border border-muted-foreground/20 px-2 py-1 text-left">
              {column.header}
            </th>
          ))}
          <th className="border border-muted-foreground/20 px-2 py-1 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <DynamicTableRow
            key={index}
            item={item}
            columns={columns}
            index={index}
            onEdit={onEdit}
            onSave={onSave}
            onCancel={onCancel}
          />
        ))}
      </tbody>
    </table>
  );
}
```

## Integration Framework Extensibility

### **Plugin-Based Integration Architecture**

The system implements a plugin-based architecture for integrations:

```typescript
interface IntegrationPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: IntegrationCapability[];
  configSchema: Record<string, any>;
  initialize: (config: any) => Promise<void>;
  processData: (data: SpecSyncItem[], config: any) => Promise<IntegrationResult>;
  validateConfig: (config: any) => ValidationError[];
}

// Integration plugin registry
class IntegrationRegistry {
  private plugins: Map<string, IntegrationPlugin> = new Map();

  registerPlugin(plugin: IntegrationPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  getPlugin(id: string): IntegrationPlugin | undefined {
    return this.plugins.get(id);
  }

  getPluginsByCapability(capability: string): IntegrationPlugin[] {
    return Array.from(this.plugins.values()).filter((plugin) =>
      plugin.capabilities.some((cap) => cap.type === capability),
    );
  }
}
```

### **Future Integration Points**

The framework is designed to support the following future integrations:

#### **1. Azure DevOps Integration**

- Work item creation from SpecSync requirements
- Bidirectional synchronization
- Custom field mapping
- Sprint planning integration

#### **2. Jira Integration**

- Issue creation and linking
- Epic/Story hierarchy mapping
- Custom field support
- Agile board integration

#### **3. Confluence Integration**

- Requirement documentation generation
- Automatic page creation
- Template-based content generation
- Version control integration

#### **4. ServiceNow Integration**

- Change request creation
- Configuration item mapping
- Service catalog integration
- Workflow automation

#### **5. Enterprise Architecture Tools**

- Sparx Enterprise Architect
- IBM Rational System Architect
- BiZZdesign Enterprise Studio
- Custom EA tool integrations

## Configuration Management

### **Dynamic Configuration System**

The system supports runtime configuration updates without code changes:

```typescript
interface ConfigurationManager {
  // Field definitions
  getFieldDefinitions(): Record<string, FieldDefinition>;
  updateFieldDefinition(key: string, definition: FieldDefinition): void;
  addFieldDefinition(key: string, definition: FieldDefinition): void;
  removeFieldDefinition(key: string): void;

  // Integration configurations
  getIntegrationConfig(integrationId: string): any;
  updateIntegrationConfig(integrationId: string, config: any): void;
  validateIntegrationConfig(integrationId: string, config: any): ValidationError[];

  // UI configurations
  getUIConfig(): UIConfig;
  updateUIConfig(config: Partial<UIConfig>): void;

  // Persistence
  saveConfiguration(): Promise<void>;
  loadConfiguration(): Promise<void>;
  exportConfiguration(): string;
  importConfiguration(configData: string): Promise<void>;
}
```

## Conclusion

The enhanced SpecSync requirements-to-domain/capability mapping system provides a robust and user-friendly foundation for automatically categorizing and organizing business requirements within the TMF framework. The latest enhancements introduce significant improvements in usability and data management:

### **Key Improvements**

- **Visual Feedback**: Badge counts provide immediate insight into requirement and use case distribution
- **Data Flexibility**: Inline editing capabilities allow for real-time data refinement
- **Enhanced Overview**: Domain summary grid offers quick statistical insights
- **Better Integration**: Improved connection with Miro visual mapping workflows
- **Extensible Architecture**: Flexible field mapping and integration framework for future enhancements

### **Technical Foundation**

By leveraging intelligent mapping algorithms, flexible field mapping, dynamic capability generation, and real-time badge count calculations, the system ensures comprehensive coverage while maintaining accuracy and performance. The modifiable preview panel enhances data quality through immediate validation and correction capabilities.

### **Future-Ready Design**

The system is built with extensibility in mind, supporting:

- **Dynamic Field Addition**: New fields can be added without code changes
- **Plugin-Based Integrations**: Modular integration architecture for external systems
- **Configuration Management**: Runtime configuration updates and persistence
- **Schema Versioning**: Backward compatibility and migration support
- **API-First Design**: RESTful API for external integrations

### **Workflow Integration**

This enhanced mapping system serves as the foundation for the broader delivery management workflow, enabling seamless integration with:

- **Estimation Engines**: Real-time effort calculations based on mapped requirements
- **Work Item Generation**: Automated creation of development tasks
- **Project Tracking**: Progress monitoring with visual indicators
- **Miro Integration**: Visual mapping and board management
- **Reporting Systems**: Comprehensive analytics and insights
- **Future Integrations**: Azure DevOps, Jira, Confluence, ServiceNow, and EA tools

The modular design allows for easy customization and extension to support different project types and organizational needs, while the enhanced UI features improve user experience and data accuracy. The extensible architecture ensures that the system can grow and adapt to future requirements without requiring major refactoring.

---

**For Implementation Support**: Refer to the `script.js` file for complete implementation details and the `index.html` file for UI integration examples.
