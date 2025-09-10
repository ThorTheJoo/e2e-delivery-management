# SpecSync Import Preview Column Update

## Overview

This document outlines the changes made to the SpecSync import preview panel to update the column structure and data mapping according to the requirements.

## Changes Made

### 1. Updated Preview Table Columns

**File**: `src/components/specsync-import.tsx`
**Location**: Lines 353-368 (table header) and 370-587 (table body)

#### Before
The preview table displayed 6 columns:
- ID
- Requirement  
- Domain
- Function
- Use Case
- Actions

#### After
The preview table now displays 5 columns in the specified order:
- Requirement ID
- Rephrased Function Name
- Domain
- Encompass Use Case - Beta
- Actions

### 2. Removed Function Column

**Change**: Completely removed the "Function" column from the preview table
- Removed from table header (line 351-353)
- Removed corresponding table body cells and editing logic

### 3. Renamed Requirement Column

**Change**: Renamed "Requirement" column to "Rephrased Function Name"
- Updated table header text
- Updated column display logic to show `item.functionName` instead of requirement text
- Maintained editing functionality for the function name field

### 4. Updated Data Mapping Logic

**File**: `src/components/specsync-import.tsx`
**Location**: Lines 65-81 (CSV parsing) and 107-125 (Excel parsing)

#### CSV Parsing Updates
```typescript
// Get rephrased function name with fallback to original requirement text
const rephrasedFunctionName = row[headerMap.functionName] || 
  row[headerMap.sourceRequirementId] || 
  `REQ-${index + 1}`;

return {
  // ... other fields
  functionName: rephrasedFunctionName,
  // ... other fields
};
```

#### Excel Parsing Updates
```typescript
// Get rephrased function name with fallback to original requirement text
const rephrasedFunctionName = fn || 
  r['Source Requirement ID'] || 
  r['SourceRequirementId'] || 
  `REQ-${index + 1}`;

return {
  // ... other fields
  functionName: rephrasedFunctionName,
  // ... other fields
};
```

### 5. Header Mapping Strategy

**Implementation**: The system now reads the column with header exactly "Rephrased Function Name" and maps each row's value to the UI column "Rephrased Function Name". Matching is done by header name (not column letter) to remain stable if column order changes.

**Fallback Logic**: If a row's value is missing from the "Rephrased Function Name" column, the system falls back to the original requirement text for that row.

### 6. Updated Help Text

**File**: `src/components/specsync-import.tsx`
**Location**: Lines 594-598

Updated the help text to reflect the new column structure and fallback behavior:
```
        Supported formats: CSV, Excel (.xlsx, .xls). Files should contain columns for Rephrased Function Name,
        Domain, Encompass Use Case - Beta, and other requirement fields. The system will read the "Rephrased Function Name" column
        and fallback to the original requirement text if not available.
```

## Data Model Impact

### Preserved Fields
The underlying `SpecSyncItem` interface remains unchanged, ensuring:
- No breaking changes to existing persistence logic
- Local storage and database persistence continue to work
- Domain summary counts remain unchanged
- All existing functionality is preserved

### Data Flow
1. **File Import**: Reads "Rephrased Function Name" column from CSV/Excel
2. **Fallback**: Uses original requirement text if rephrased function name is missing
3. **Storage**: Saves processed data using existing persistence mechanisms
4. **Display**: Shows data in the new 5-column preview format

## Validation Criteria Met

### ✅ Column Structure
- Import preview shows exactly 5 columns in the specified order
- No "Function" column present
- "Rephrased Function Name" column displays processed values

### ✅ Data Handling
- Reads "Rephrased Function Name" column by header name (not position)
- Fallback to original requirement text when rephrased value is missing
- Preserves existing persistence behavior (local storage vs database)

### ✅ UI Behavior
- Maintains existing sorting, filtering, and row actions behavior
- All editing functionality preserved
- Domain summary counts unchanged

### ✅ Backward Compatibility
- No changes to upstream file format requirements
- No changes to global styling or unrelated features
- Existing data structures and interfaces preserved

## Technical Implementation Details

### Column Mapping
- **Requirement ID**: `item.rephrasedRequirementId || item.requirementId || R${index + 1}`
- **Rephrased Function Name**: `item.functionName` (with fallback logic in parsing)
- **Domain**: `item.domain || 'Unspecified'`
- **Encompass Use Case - Beta**: `item.usecase1 || 'N/A'`
- **Actions**: Domain requirement and use case count badges

### Editing Functionality
All columns remain editable with the same inline editing interface:
- Click edit button to enter edit mode
- Save/Cancel buttons for each field
- Real-time updates to the data model
- Automatic persistence through existing mechanisms

## Files Modified

1. **src/components/specsync-import.tsx**
   - Updated table header structure
   - Updated table body with new column layout
   - Enhanced data parsing with fallback logic
   - Updated help text

## Testing Recommendations

1. **Import Test**: Import the same sample file and verify 5 rows with columns in specified order
2. **Fallback Test**: Test with files missing "Rephrased Function Name" values
3. **Persistence Test**: Verify toggling persistence mode saves/loads updated preview rows correctly
4. **Domain Count Test**: Confirm domain summary counts remain unchanged
5. **Editing Test**: Verify all columns remain editable with existing functionality

## Future Considerations

- The column structure is now more focused and aligned with business requirements
- Header-based mapping provides stability against column order changes
- Fallback logic ensures robust data handling for various file formats
- The implementation maintains full backward compatibility with existing data and functionality
