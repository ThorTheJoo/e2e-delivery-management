# SpecSync Requirements to Domain/Capability Mapping Guide

## Overview
This document outlines how the E2E Delivery Management application processes SpecSync input files to automatically map business requirements to TMF domains and capabilities. The mapping system provides intelligent categorization, effort estimation, and integration with the broader delivery management workflow.

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

## Mapping Logic & Implementation

### **1. Domain Classification Algorithm**

The system uses a hierarchical approach to classify requirements into TMF domains:

```javascript
// Domain classification logic
function classifyDomain(item) {
    const domain = (item.domain || '').toString().toLowerCase();
    const vertical = (item.vertical || '').toString().toLowerCase();
    const functionName = (item.functionName || '').toString().toLowerCase();
    
    // Primary domain mapping
    if (/product|billing|charging|order/i.test(domain)) return 'product';
    if (/resource|infrastructure|network/i.test(domain)) return 'resource';
    if (/partner|wholesale|interconnect/i.test(domain)) return 'partner';
    if (/enterprise|compliance|fraud/i.test(domain)) return 'enterprise';
    if (/integration|api|workflow/i.test(domain)) return 'integration';
    
    // Fallback based on function name
    if (/billing|charging|pricing/i.test(functionName)) return 'product';
    if (/lifecycle|resource|fault/i.test(functionName)) return 'resource';
    if (/api|rest|soap|workflow/i.test(functionName)) return 'integration';
    
    return 'unspecified';
}
```

### **2. Capability Mapping Strategy**

The system employs a multi-layered approach to map requirements to specific capabilities:

```javascript
// Capability mapping logic
function mapCapability(item) {
    const capability = (item.capability || '').toString();
    const afLevel2 = (item.afLevel2 || '').toString();
    const functionName = (item.functionName || '').toString();
    
    // Priority 1: Direct capability match
    if (capability) {
        const capId = resolveCapabilityIdFromText(capability);
        if (capId) return capId;
    }
    
    // Priority 2: AF Level 2 mapping
    if (afLevel2) {
        const afId = resolveCapabilityIdFromText(afLevel2);
        if (afId) return afId;
    }
    
    // Priority 3: Function name mapping
    if (functionName) {
        const funcId = resolveCapabilityIdFromText(functionName);
        if (funcId) return funcId;
    }
    
    // Priority 4: Domain-guided fallback
    return applyDomainFallback(item);
}
```

### **3. TMF Capability Framework Integration**

The system maps to the following TMF capability domains:

#### **Resource Domain**
- Resource Lifecycle Management
- Fault Management
- Usage Management

#### **Business Partner Domain**
- Partner Relationship Management
- Wholesale / Interconnect Billing

#### **Enterprise Domain**
- Revenue Assurance Management
- Fraud Management
- Regulatory & Compliance Management

#### **Integration Domain**
- API Management
- Business Process Management & Workflow Integration

### **4. Dynamic Capability Generation**

For unmapped capabilities, the system generates dynamic capability IDs:

```javascript
function generateDynamicCapabilityId(basis) {
    const normalized = String(basis || 'capability')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return `imported-${normalized}`;
}
```

## Data Processing Pipeline

### **Step 1: File Import & Parsing**
```javascript
function parseCSVToSpecSyncItems(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length);
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''));
    
    // Header mapping with flexible naming
    const headerMap = buildHeaderMap(headers);
    
    // Parse each row into structured objects
    return lines.slice(1).map(line => parseRow(line, headerMap));
}
```

### **Step 2: Field Normalization**
```javascript
function normalizeField(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '');
}
```

### **Step 3: Capability Resolution**
```javascript
function resolveCapabilityIdFromText(text) {
    const normalized = normalizeField(text);
    
    // Check against existing capability labels
    const labelToId = buildLabelToIdMap();
    
    // Exact match
    if (labelToId.has(normalized)) {
        return labelToId.get(normalized);
    }
    
    // Partial match
    for (const [label, id] of labelToId) {
        if (label.includes(normalized) || normalized.includes(label)) {
            return id;
        }
    }
    
    return null;
}
```

### **Step 4: State Building & Persistence**
```javascript
function buildSpecSyncState(items, fileName) {
    const counts = { totalRequirements: items.length, domains: {} };
    
    items.forEach(item => {
        const domain = (item.domain || '').trim() || 'Unspecified';
        counts.domains[domain] = (counts.domains[domain] || 0) + 1;
    });
    
    return {
        fileName: fileName || 'SpecSync Import',
        importedAt: Date.now(),
        includeInEstimates: true,
        counts,
        items
    };
}
```

## Integration Points

### **1. TMF Capability Scoping Panel**
- Automatically populates capability checkboxes based on imported data
- Updates domain counts and selection states
- Integrates with existing capability filtering system

### **2. Estimation Engine**
- Provides effort overlay for imported requirements
- Integrates with BOM-based estimation
- Supports inclusion/exclusion in final estimates

### **3. ADO Work Item Generation**
- Maps requirements to work item templates
- Creates hierarchical work item relationships
- Exports structured data for Azure DevOps integration

### **4. Dashboard & Reporting**
- Real-time progress tracking
- Domain coverage analysis
- Requirement completion status

## Configuration & Customization

### **Header Field Mapping**
The system supports flexible header naming through normalization:

```javascript
const headerVariants = {
    requirementId: ['Rephrased Requirement ID', 'Rephrased-Requirement-ID', 'RephrasedRequirementId'],
    domain: ['Rephrased Domain', 'Rephrased- Domain', 'Rephrased - Domain', 'Domain'],
    vertical: ['Rephrased Vertical', 'Rephrased- Vertical', 'Rephrased - Vertical', 'Vertical'],
    functionName: ['Rephrased Function Name', 'Rephrased- Function Name', 'Function Name'],
    afLevel2: ['Rephrased AF Lev.2', 'AF Lev.2', 'Architecture Framework Level 2'],
    capability: ['Reference Capability', 'Reference- Capability', 'Capability']
};
```

### **Domain Mapping Rules**
Customize domain classification rules:

```javascript
const domainRules = {
    product: {
        keywords: ['product', 'billing', 'charging', 'order', 'crm'],
        fallbacks: ['pricing', 'discount', 'offer']
    },
    resource: {
        keywords: ['resource', 'infrastructure', 'network', 'lifecycle'],
        fallbacks: ['fault', 'usage', 'monitoring']
    },
    integration: {
        keywords: ['integration', 'api', 'workflow', 'orchestration'],
        fallbacks: ['rest', 'soap', 'graphql']
    }
};
```

### **Capability Mapping Rules**
Define custom capability mapping logic:

```javascript
const capabilityRules = {
    'billing-management': {
        patterns: ['billing', 'charging', 'pricing'],
        domain: 'product',
        effort: { base: 20, multiplier: 1.2 }
    },
    'api-management': {
        patterns: ['api', 'rest', 'soap', 'integration'],
        domain: 'integration',
        effort: { base: 15, multiplier: 1.1 }
    }
};
```

## Usage Examples

### **Basic Import**
```javascript
// Import SpecSync CSV file
const fileInput = document.getElementById('specSyncFile');
const file = fileInput.files[0];

if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const items = parseCSVToSpecSyncItems(String(e.target.result));
        const state = buildSpecSyncState(items, file.name);
        
        // Map to capabilities
        const mapping = mapSpecSyncByImportedCapabilities(items);
        
        // Update UI
        updateCapabilityPanel(mapping);
        
        // Save state
        saveSpecSyncData(state);
    };
    reader.readAsText(file);
}
```

### **Capability Mapping**
```javascript
// Map imported items to existing capabilities
function mapToExistingCapabilities(items) {
    const mapping = {
        countsByCapability: {},
        assignments: [],
        unmapped: 0
    };
    
    items.forEach(item => {
        const capabilityId = resolveCapability(item);
        
        if (capabilityId) {
            mapping.countsByCapability[capabilityId] = 
                (mapping.countsByCapability[capabilityId] || 0) + 1;
            mapping.assignments.push({
                requirementId: item.rephrasedRequirementId,
                capabilityId: capabilityId
            });
        } else {
            mapping.unmapped++;
        }
    });
    
    return mapping;
}
```

### **Dynamic Capability Creation**
```javascript
// Create dynamic capabilities for unmapped items
function createDynamicCapabilities(items) {
    const dynamicGroups = {};
    
    items.forEach(item => {
        if (!item.mappedCapability) {
            const domain = classifyDomain(item);
            const capabilityName = item.afLevel2 || item.functionName || 'Unknown';
            
            if (!dynamicGroups[domain]) {
                dynamicGroups[domain] = [];
            }
            
            dynamicGroups[domain].push({
                id: generateDynamicCapabilityId(capabilityName),
                name: capabilityName,
                description: item.referenceCapability || '',
                requirementCount: 1
            });
        }
    });
    
    return dynamicGroups;
}
```

## Error Handling & Validation

### **Data Quality Checks**
```javascript
function validateSpecSyncData(items) {
    const errors = [];
    
    items.forEach((item, index) => {
        if (!item.rephrasedRequirementId) {
            errors.push(`Row ${index + 1}: Missing requirement ID`);
        }
        
        if (!item.domain && !item.functionName) {
            errors.push(`Row ${index + 1}: Missing domain and function name`);
        }
    });
    
    return errors;
}
```

### **Fallback Strategies**
```javascript
function applyFallbackMapping(item) {
    // Domain-based fallback
    if (item.domain) {
        return getDefaultCapabilityForDomain(item.domain);
    }
    
    // Function-based fallback
    if (item.functionName) {
        return getDefaultCapabilityForFunction(item.functionName);
    }
    
    // Generic fallback
    return 'generic-capability';
}
```

## Performance Considerations

### **Large File Handling**
- Stream processing for files > 10MB
- Batch processing for UI updates
- Memory-efficient data structures

### **Caching Strategies**
- Capability ID resolution caching
- Domain classification caching
- Import state persistence

### **Optimization Techniques**
- Lazy loading of capability panels
- Debounced UI updates
- Efficient DOM manipulation

## Troubleshooting

### **Common Issues**

1. **Header Mismatch**: Ensure CSV headers match expected field names
2. **Encoding Issues**: Use UTF-8 encoding for special characters
3. **Missing Required Fields**: Check for required domain/function information
4. **Capability Mapping Failures**: Verify capability names match TMF framework

### **Debug Mode**
Enable debug logging:

```javascript
const DEBUG_SPECSYNC = true;

function logSpecSync(message, data) {
    if (DEBUG_SPECSYNC) {
        console.log(`[SpecSync] ${message}`, data);
    }
}
```

### **Validation Tools**
```javascript
function validateSpecSyncImport(file) {
    const validation = {
        isValid: true,
        errors: [],
        warnings: [],
        stats: {}
    };
    
    // File format validation
    if (!file.name.match(/\.(csv|xlsx?)$/i)) {
        validation.isValid = false;
        validation.errors.push('Unsupported file format');
    }
    
    // Content validation
    const content = readFileContent(file);
    const items = parseCSVToSpecSyncItems(content);
    
    validation.stats = {
        totalRows: items.length,
        mappedCapabilities: items.filter(i => i.mappedCapability).length,
        unmappedItems: items.filter(i => !i.mappedCapability).length
    };
    
    return validation;
}
```

## Future Enhancements

### **Planned Features**
- **AI-Powered Mapping**: Machine learning for improved capability classification
- **Template Management**: Customizable mapping templates for different project types
- **Real-time Sync**: Live integration with SpecSync systems
- **Advanced Analytics**: Requirement complexity analysis and effort prediction

### **Integration Roadmap**
- **Phase 1**: Enhanced CSV/Excel support ✅ (Current)
- **Phase 2**: JSON API integration
- **Phase 3**: Real-time synchronization
- **Phase 4**: AI-powered mapping optimization

## Conclusion

The SpecSync requirements-to-domain/capability mapping system provides a robust foundation for automatically categorizing and organizing business requirements within the TMF framework. By leveraging intelligent mapping algorithms, flexible field mapping, and dynamic capability generation, the system ensures comprehensive coverage while maintaining accuracy and performance.

This mapping system serves as the foundation for the broader delivery management workflow, enabling seamless integration with estimation engines, work item generation, and project tracking systems. The modular design allows for easy customization and extension to support different project types and organizational needs.

---

**For Implementation Support**: Refer to the `script.js` file for complete implementation details and the `index.html` file for UI integration examples.
