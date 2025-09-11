# Blue Dolphin Status Filter Analysis

## Problem Statement

When objects are deleted in Blue Dolphin, they are marked with `Status = 'Archived'` instead of being physically removed. The current integration retrieves ALL objects including archived ones, causing stale data to appear in the application.

## Current Status Implementation

### 1. **Status Field Structure**

**Primary Status Field:**
- `Status?: string` - Main object status field
- Values observed: `'Archived'`, `'Active'` (and potentially others)

**Enhanced Status Fields:**
- `Deliverable_Object_Status_Status?: string` - Enhanced deliverable status
- `Object_Properties_Deliverable_Object_Status?: string` - Object properties status

### 2. **Current Status Usage**

**Object Retrieval Section:**
- ✅ Displays `Status` field in object cards
- ✅ Has "Archived Objects" quick filter button (`Status eq 'Archived'`)
- ❌ No persistent status filter dropdown
- ❌ No status filter in main filter controls

**Relationship Data Section:**
- ❌ No status filtering for relations
- ❌ No status filter UI controls

**Export Model Section:**
- ❌ No status filtering in export
- ❌ No status filter UI controls

**Visualization Section:**
- ❌ No status filtering in visualization
- ❌ No status filter in `VisualizationFilters` interface

## Required Status Filter Implementation

### 1. **Status Filter UI Components Needed**

#### Object Retrieval Section
```typescript
// Add to existing filter controls
<div>
  <Label>Status Filter</Label>
  <Select value={statusFilter || 'all'} onValueChange={setStatusFilter}>
    <SelectTrigger>
      <SelectValue placeholder="All Statuses" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Statuses</SelectItem>
      <SelectItem value="Active">Active Only</SelectItem>
      <SelectItem value="Archived">Archived Only</SelectItem>
      <SelectItem value="Draft">Draft Only</SelectItem>
      {/* Dynamic options from available statuses */}
    </SelectContent>
  </Select>
</div>
```

#### Relationship Data Section
```typescript
// Add status filter for source and target objects
<div>
  <Label>Source Object Status</Label>
  <Select value={relSrcStatus || 'all'} onValueChange={setRelSrcStatus}>
    {/* Similar structure */}
  </Select>
</div>
<div>
  <Label>Target Object Status</Label>
  <Select value={relTgtStatus || 'all'} onValueChange={setRelTgtStatus}>
    {/* Similar structure */}
  </Select>
</div>
```

#### Export Model Section
```typescript
// Add status filter to export controls
<div>
  <Label>Object Status</Label>
  <Select value={exportStatus || 'all'} onValueChange={setExportStatus}>
    {/* Similar structure */}
  </Select>
</div>
```

#### Visualization Section
```typescript
// Add to VisualizationFilters interface
interface VisualizationFilters {
  // ... existing fields
  status: string;
  sourceStatus: string;
  targetStatus: string;
}
```

### 2. **OData Filter Implementation**

#### Object Retrieval Filter
```typescript
const buildObjectsFilter = () => {
  const parts: string[] = [];
  
  // Existing filters
  if (workspaceFilter && workspaceFilter !== 'all') {
    parts.push(`Workspace eq '${workspaceFilter}'`);
  }
  
  // NEW: Status filter
  if (statusFilter && statusFilter !== 'all') {
    parts.push(`Status eq '${statusFilter}'`);
  }
  
  // Existing custom filter
  if (filter) {
    parts.push(`(${filter})`);
  }
  
  return parts.join(' and ');
};
```

#### Relationship Filter
```typescript
const buildRelationsFilter = () => {
  const parts: string[] = [];
  
  // Existing filters
  if (relDefName) parts.push(`RelationshipDefinitionName eq '${relDefName}'`);
  if (relSrcDef) parts.push(`BlueDolphinObjectDefinitionName eq '${relSrcDef}'`);
  if (relTgtDef) parts.push(`RelatedBlueDolphinObjectDefinitionName eq '${relTgtDef}'`);
  
  // NEW: Status filters for source and target objects
  if (relSrcStatus && relSrcStatus !== 'all') {
    // This would require joining with Objects table or using a different approach
    // May need to filter relations based on source object status
  }
  if (relTgtStatus && relTgtStatus !== 'all') {
    // Similar to above
  }
  
  return parts.join(' and ');
};
```

### 3. **Status Value Discovery**

#### Dynamic Status Options
```typescript
// Extract unique status values from loaded objects
const uniqueStatuses = Array.from(
  new Set(
    objects
      .map(obj => obj.Status)
      .filter(status => status && status.trim() !== '')
  )
).sort();

// Also check enhanced status fields
const uniqueDeliverableStatuses = Array.from(
  new Set(
    objects
      .map(obj => obj.Deliverable_Object_Status_Status)
      .filter(status => status && status.trim() !== '')
  )
).sort();
```

### 4. **Integration Points**

#### API Route Updates
- No changes needed to `/api/blue-dolphin/route.ts`
- Status filtering handled via OData `$filter` parameter
- Existing `bypassCache` mechanism will work with status filters

#### State Management Updates
```typescript
// Add to BlueDolphinIntegration component state
const [statusFilter, setStatusFilter] = useState<string>('');
const [relSrcStatus, setRelSrcStatus] = useState<string>('');
const [relTgtStatus, setRelTgtStatus] = useState<string>('');
const [exportStatus, setExportStatus] = useState<string>('');
const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
```

#### Clear Functions Updates
```typescript
const clearObjects = () => {
  setObjects([]);
  setObjectTotal(0);
  setError(null);
  setWorkspaceFilter('');
  setStatusFilter(''); // NEW: Clear status filter
};

const clearRelations = () => {
  setRelations([]);
  setRelSrcStatus(''); // NEW: Clear status filters
  setRelTgtStatus('');
};
```

## Implementation Strategy

### Phase 1: Object Retrieval Status Filter
1. Add status filter dropdown to Object Retrieval section
2. Update `buildObjectsFilter` function to include status
3. Add status to clear functions
4. Extract and display available status values

### Phase 2: Relationship Data Status Filter
1. Add status filter dropdowns for source and target objects
2. Update `buildRelationsFilter` function
3. Handle status filtering for relations (may require separate object queries)

### Phase 3: Export Model Status Filter
1. Add status filter to export controls
2. Update export filter building functions
3. Ensure status filter is applied to both objects and relations

### Phase 4: Visualization Status Filter
1. Add status to `VisualizationFilters` interface
2. Update visualization hook to handle status filtering
3. Add status filter UI to visualization controls

## Technical Considerations

### 1. **Status Field Mapping**
- Primary: `Status` field (string)
- Enhanced: `Deliverable_Object_Status_Status` field
- Need to determine which field to use for filtering

### 2. **Relationship Status Filtering**
- Relations don't have direct status fields
- Need to filter based on source/target object status
- May require additional API calls or complex OData queries

### 3. **Default Behavior**
- Default to "Active" status to exclude archived objects
- Provide "All Statuses" option for full visibility
- Clear indication when archived objects are included

### 4. **Performance Impact**
- Status filtering reduces data volume (positive impact)
- Additional filter complexity in OData queries
- May improve performance by excluding archived objects

## Expected Benefits

1. **Data Accuracy**: Exclude archived/deleted objects by default
2. **User Experience**: Clear status filtering options
3. **Performance**: Reduced data volume with status filtering
4. **Consistency**: Status filtering across all Blue Dolphin integrations
5. **Flexibility**: Users can choose to include/exclude archived objects

## Next Steps

1. **Investigate Status Values**: Query Blue Dolphin to determine all possible status values
2. **Implement Object Retrieval Filter**: Start with the main object retrieval section
3. **Test Status Filtering**: Verify OData queries work correctly with status filters
4. **Extend to Other Sections**: Apply status filtering to relationships, export, and visualization
5. **Update Documentation**: Document the new status filtering capabilities
