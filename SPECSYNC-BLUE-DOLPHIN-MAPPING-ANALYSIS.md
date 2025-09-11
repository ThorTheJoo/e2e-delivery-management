# SpecSync to Blue Dolphin Function Name Mapping Analysis

## Executive Summary

Based on comprehensive analysis of the codebase, I've identified the complete data flow and technical requirements for mapping SpecSync function names to Blue Dolphin application components. The integration is **technically feasible** and can be implemented using existing infrastructure.

## Current Data Flow Analysis

### 1. SpecSync Import Process

**Location**: `src/components/specsync-import.tsx`

**Key Findings**:
- SpecSync imports CSV/Excel files with a "Rephrased Function Name" column
- The system maps this to the `functionName` field in `SpecSyncItem` interface
- Fallback logic: If "Rephrased Function Name" is missing, uses original requirement text
- Data is stored in `SpecSyncItem` objects with the following structure:

```typescript
interface SpecSyncItem {
  id: string;
  requirementId: string;
  rephrasedRequirementId: string;
  domain: string;
  vertical: string;
  functionName: string;  // ← This is our key field
  afLevel2: string;
  capability: string;
  referenceCapability: string;
  'Rephrased Function Name'?: string;  // ← Alternative field
  usecase1: string;
  // ... other fields
}
```

**Data Extraction Logic**:
```typescript
// From specsync-import.tsx lines 65-68
const rephrasedFunctionName = row[headerMap.functionName] || 
  row[headerMap.sourceRequirementId] || 
  `REQ-${index + 1}`;

return {
  // ... other fields
  functionName: rephrasedFunctionName,  // ← Primary field for mapping
  // ... other fields
};
```

### 2. Blue Dolphin OData Integration

**Location**: `src/components/blue-dolphin-integration.tsx` and `src/app/api/blue-dolphin/route.ts`

**Key Findings**:
- Blue Dolphin objects are retrieved via OData v2.0 from `https://csgipoc.odata.bluedolphin.app`
- Application components are identified by `Definition eq 'Application Component'`
- Objects have a `Title` field that contains the component name
- The system supports filtering by `Definition` and searching by `Title`

**Blue Dolphin Object Structure**:
```typescript
interface BlueDolphinObject {
  ID: string;
  Title: string;  // ← This is our target field for matching
  Definition: string;  // ← Filter for 'Application Component'
  Description?: string;
  ArchimateType?: string;
  Status?: string;
  // ... other fields
}
```

**Current Filtering Capabilities**:
- Filter by Definition: `Definition eq 'Application Component'`
- Search by Title: `contains(Title, 'search_term')`
- Exact Title match: `Title eq 'exact_name'`

## Proposed Mapping Logic

### 1. Data Flow Architecture

```
SpecSync Import → Function Name Extraction → Blue Dolphin Query → Object Matching → Result Mapping
```

### 2. Technical Implementation Strategy

**Step 1: Extract Function Names from SpecSync**
```typescript
// Extract function names from SpecSync data
const functionNames = specSyncItems.map(item => item.functionName);
// Alternative: item['Rephrased Function Name'] || item.functionName
```

**Step 2: Query Blue Dolphin for Application Components**
```typescript
// OData query to get Application Components
const query = `/Objects?$filter=Definition eq 'Application Component'&MoreColumns=true&$top=1000`;
```

**Step 3: Match Function Names to Blue Dolphin Titles**
```typescript
// Match logic options:
// 1. Exact match: Title === functionName
// 2. Contains match: Title contains functionName
// 3. Fuzzy match: Similarity scoring
// 4. Normalized match: Remove special chars, case insensitive
```

### 3. OData Query Patterns

**Current Working Configuration**:
- Base URL: `https://csgipoc.odata.bluedolphin.app`
- Protocol: OData v2.0
- Authentication: Basic (username: `csgipoc`, password: `ef498b94-732b-46c8-a24c-65fbd27c1482`)

**Query Examples**:
```typescript
// Get all Application Components
GET /Objects?$filter=Definition eq 'Application Component'&MoreColumns=true

// Search by Title (contains)
GET /Objects?$filter=Definition eq 'Application Component' and contains(Title, 'Customer')&MoreColumns=true

// Search by Title (exact match)
GET /Objects?$filter=Definition eq 'Application Component' and Title eq 'Customer Management'&MoreColumns=true
```

## Implementation Feasibility Assessment

### ✅ **FEASIBLE** - All Required Components Exist

1. **SpecSync Data Access**: ✅ Available
   - Function names are extracted and stored in `SpecSyncItem.functionName`
   - Data is accessible via existing import process

2. **Blue Dolphin OData Integration**: ✅ Available
   - Working OData connection established
   - Application Component filtering implemented
   - Title-based searching supported

3. **Matching Logic**: ✅ Implementable
   - Multiple matching strategies can be implemented
   - Existing codebase has similar matching logic in `specsync-utils.ts`

4. **API Infrastructure**: ✅ Available
   - Blue Dolphin API route exists (`/api/blue-dolphin`)
   - OData query handling implemented
   - Error handling and response formatting in place

## Recommended Implementation Approach

### Phase 1: Simple Exact Matching
```typescript
// 1. Get SpecSync function names
const functionNames = specSyncItems.map(item => item.functionName);

// 2. Query Blue Dolphin for Application Components
const response = await fetch('/api/blue-dolphin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'get-objects-enhanced',
    config: blueDolphinConfig,
    data: {
      endpoint: '/Objects',
      filter: "Definition eq 'Application Component'",
      moreColumns: true
    }
  })
});

// 3. Match function names to Blue Dolphin titles
const matches = [];
for (const functionName of functionNames) {
  const match = blueDolphinObjects.find(obj => 
    obj.Title === functionName || 
    obj.Title.includes(functionName)
  );
  if (match) {
    matches.push({
      specSyncFunctionName: functionName,
      blueDolphinObject: match,
      matchType: obj.Title === functionName ? 'exact' : 'contains'
    });
  }
}
```

### Phase 2: Enhanced Matching (Future)
- Fuzzy matching using similarity algorithms
- Normalized matching (remove special characters, case insensitive)
- Confidence scoring for matches
- Manual review interface for ambiguous matches

## Data Quality Considerations

### Potential Challenges
1. **Naming Variations**: SpecSync function names may not exactly match Blue Dolphin titles
2. **Case Sensitivity**: May need case-insensitive matching
3. **Special Characters**: Brackets, spaces, and special chars may differ
4. **Multiple Matches**: One function name might match multiple Blue Dolphin objects

### Mitigation Strategies
1. **Normalization**: Implement text normalization before matching
2. **Multiple Strategies**: Try exact match first, then contains, then fuzzy
3. **Confidence Scoring**: Rank matches by similarity score
4. **Manual Review**: Flag ambiguous matches for human review

## Next Steps for Implementation

1. **Create Mapping Service**: New service class to handle SpecSync → Blue Dolphin mapping
2. **Add API Endpoint**: New endpoint for function name lookup
3. **Implement Matching Logic**: Multiple matching strategies
4. **Add UI Component**: Display mapping results and allow manual review
5. **Add Error Handling**: Handle cases where no matches are found
6. **Add Logging**: Track mapping success rates and common issues

## Conclusion

The SpecSync to Blue Dolphin function name mapping is **technically feasible** and can be implemented using existing infrastructure. The main work involves:

1. Creating a mapping service that combines SpecSync data extraction with Blue Dolphin OData queries
2. Implementing flexible matching logic to handle naming variations
3. Building a UI component to display and manage the mappings
4. Adding proper error handling and logging

The existing codebase provides all necessary building blocks, and the OData integration is already functional and tested.
