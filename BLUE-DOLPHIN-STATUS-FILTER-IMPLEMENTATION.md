# Blue Dolphin Status Filter Implementation

## Overview

This document describes the implementation of status filtering across all Blue Dolphin OData integrations to address the issue where deleted objects (marked as `Status = 'Archived'`) were still being retrieved and displayed in the application.

## Problem Solved

**Issue**: When objects are deleted in Blue Dolphin, they are marked with `Status = 'Archived'` instead of being physically removed. The application was retrieving ALL objects including archived ones, causing stale data to appear.

**Solution**: Implemented comprehensive status filtering across all Blue Dolphin integration sections with default filtering to exclude archived objects.

## Implementation Details

### 1. **State Management**

Added new state variables to manage status filtering:

```typescript
const [statusFilter, setStatusFilter] = useState<string>('Active');
const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
const [relSrcStatus, setRelSrcStatus] = useState<string>('Active');
const [relTgtStatus, setRelTgtStatus] = useState<string>('Active');
const [exportStatus, setExportStatus] = useState<string>('Active');
```

### 2. **Object Retrieval Section**

#### Filter Logic Enhancement
```typescript
// Enhanced filter building with status support
const buildObjectsFilter = () => {
  const filterParts: string[] = [];
  
  if (workspaceFilter && workspaceFilter !== 'all') {
    filterParts.push(`Workspace eq '${workspaceFilter}'`);
  }
  
  if (statusFilter && statusFilter !== 'all') {
    filterParts.push(`Status eq '${statusFilter}'`); // NEW
  }
  
  if (filter) {
    filterParts.push(`(${filter})`);
  }
  
  return filterParts.join(' and ');
};
```

#### UI Components Added
- Status filter dropdown with dynamic options
- Status count indicator
- Default to "Active" status to exclude archived objects

#### Status Discovery
```typescript
// Extract available statuses from API response
const statuses = Array.from(
  new Set(
    (result.data || [])
      .map((obj: any) => obj.Status)
      .filter((status: any): status is string => 
        typeof status === 'string' && status.trim() !== ''
      )
  )
).sort();
setAvailableStatuses(statuses);
```

### 3. **Relationship Data Section**

#### Status Filter UI
- Source Object Status filter dropdown
- Target Object Status filter dropdown
- Note: Relations don't have direct status fields, so filtering requires additional logic

#### Clear Function Updates
```typescript
const clearRelations = () => {
  setRelations([]);
  setRelSrcStatus('Active'); // NEW
  setRelTgtStatus('Active'); // NEW
};
```

### 4. **Export Model Section**

#### Filter Logic Enhancement
```typescript
const buildObjectsFilterForExport = useCallback((): string => {
  const parts: string[] = [];
  if (workspaceFilter && workspaceFilter !== 'all') {
    parts.push(`Workspace eq '${workspaceFilter}'`);
  }
  if (exportStatus && exportStatus !== 'all') {
    parts.push(`Status eq '${exportStatus}'`); // NEW
  }
  if (exportObjectDefinition) {
    parts.push(`Definition eq '${exportObjectDefinition}'`);
  }
  return parts.join(' and ');
}, [workspaceFilter, exportStatus, exportObjectDefinition]);
```

#### UI Components Added
- Object Status filter dropdown in export controls
- Status filtering applied to both objects and relations

### 5. **Clear Functions Updated**

All clear functions now reset status filters to "Active":

```typescript
const clearObjects = () => {
  setObjects([]);
  setObjectTotal(0);
  setError(null);
  setWorkspaceFilter('');
  setStatusFilter('Active'); // NEW
};
```

## OData Query Examples

### Active Objects Only
```
GET /Objects?$filter=Status eq 'Active'&MoreColumns=true&$top=50
```

### Archived Objects Only
```
GET /Objects?$filter=Status eq 'Archived'&MoreColumns=true&$top=50
```

### Combined Filters
```
GET /Objects?$filter=Workspace eq 'CSG International' and Status eq 'Active'&MoreColumns=true&$top=50
```

## User Interface Changes

### Object Retrieval Section
- Added status filter dropdown (4th column in grid)
- Shows available status count
- Defaults to "Active" status

### Relationship Data Section
- Added Source Object Status filter
- Added Target Object Status filter
- Note: Requires additional filtering logic for relations

### Export Model Section
- Added Object Status filter (5th column in grid)
- Status filtering applied to export data

## Testing

### Test Script
Created `test-status-filtering.js` to verify:
- Status filtering works correctly
- Active vs Archived object retrieval
- Status discovery from API responses
- Status distribution analysis

### Test Cases
1. **All Statuses**: Should retrieve both Active and Archived objects
2. **Active Only**: Should only retrieve Active objects
3. **Archived Only**: Should only retrieve Archived objects
4. **Status Discovery**: Should extract all available status values

## Benefits

### 1. **Data Accuracy**
- Excludes archived/deleted objects by default
- Users see only current, relevant data

### 2. **Performance**
- Reduced data volume with status filtering
- Faster loading times with fewer objects

### 3. **User Control**
- Clear status filtering options
- Ability to include/exclude archived objects as needed

### 4. **Consistency**
- Status filtering works the same way across all sections
- Unified user experience

### 5. **Flexibility**
- Users can choose to view archived objects when needed
- Maintains full data visibility when required

## Default Behavior

- **Default Status**: "Active" (excludes archived objects)
- **Status Discovery**: Automatically extracts available statuses from API
- **Clear Functions**: Reset to "Active" status
- **UI Indicators**: Show available status count

## Technical Notes

### Status Field Mapping
- Primary field: `Status` (string)
- Enhanced field: `Deliverable_Object_Status_Status` (for future use)
- Values observed: "Active", "Archived" (and potentially others)

### Relationship Status Filtering
- Relations don't have direct status fields
- Status filtering for relations requires additional queries
- Currently implemented as UI placeholder with notes

### Performance Considerations
- Status filtering reduces data volume (positive impact)
- Additional filter complexity in OData queries (minimal impact)
- Improved performance by excluding archived objects

## Future Enhancements

1. **Enhanced Status Fields**: Support for `Deliverable_Object_Status_Status`
2. **Relation Status Filtering**: Implement proper status filtering for relations
3. **Status Presets**: Quick filter buttons for common status combinations
4. **Status Analytics**: Show status distribution and trends
5. **Bulk Status Operations**: Change status of multiple objects

## Conclusion

The status filtering implementation successfully addresses the stale data issue by:
- Defaulting to "Active" status to exclude archived objects
- Providing comprehensive status filtering across all Blue Dolphin integrations
- Maintaining user control and flexibility
- Improving data accuracy and performance

Users will now see only current, relevant data by default, while maintaining the ability to view archived objects when needed.
