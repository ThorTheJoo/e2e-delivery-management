# CET v22.0 Excel Parser Specification

## Excel File Structure

### Ph1Demand Worksheet Requirements

- **Headers Row**: Row 3 (index 2)
- **Data Start Row**: Row 6 (index 5)
- **Required Columns**:
  - Column A (index 0): Project Role
  - Column M (index 12): Domain
  - Column O (index 14): Total Mandate Effort

### Sample Excel Structure

```
Row 1: [Empty or title]
Row 2: [Empty or subtitle]
Row 3: [Headers - Project Role, ..., Domain, ..., Total, ...]
Row 4: [Empty or separator]
Row 5: [Empty or separator]
Row 6: ['Program Directors', ..., 'Program', ..., 55.5, ...]
Row 7: ['Project Managers (Launch Lead)', ..., 'Program', ..., 57.5, ...]
```

## Parser Implementation

### Core Parser Class

```typescript
export class CETv22ParserService {
  async parseExcelFile(file: File): Promise<CETv22Data>;
  private processDemandSheet(sheetData: any[][], sheetName: string): CETv22ResourceDemand[];
  private createResourceDemand(
    row: any[],
    headers: string[],
    sheetName: string,
  ): CETv22ResourceDemand | null;
  private isValidDemandRow(row: any[], headers: string[]): boolean;
  private getCellValueByIndex(row: any[], index: number): string;
}
```

### Key Parsing Logic

#### 1. Sheet Processing

```typescript
private processDemandSheet(sheetData: any[][], sheetName: string): CETv22ResourceDemand[] {
  const demands: CETv22ResourceDemand[] = [];

  if (sheetData.length < 6) return demands;

  // Ph1Demand specific handling
  const headers = sheetName === 'Ph1Demand' ? sheetData[2] : sheetData[0];
  const startRowIndex = sheetName === 'Ph1Demand' ? 5 : 1;

  for (let i = startRowIndex; i < sheetData.length; i++) {
    const row = sheetData[i];
    if (this.isValidDemandRow(row, headers)) {
      const demand = this.createResourceDemand(row, headers, sheetName);
      if (demand) demands.push(demand);
    }
  }

  return demands;
}
```

#### 2. Data Extraction

```typescript
private createResourceDemand(row: any[], headers: string[], sheetName: string): CETv22ResourceDemand | null {
  // Ph1Demand specific extraction
  if (sheetName === 'Ph1Demand') {
    const domain = this.getCellValueByIndex(row, 12); // Column M
    const totalEffortStr = this.getCellValueByIndex(row, 14); // Column O
    const totalMandateEffort = parseFloat(totalEffortStr) || undefined;

    return {
      weekNumber: 1, // Default for Ph1Demand
      weekDate: '',
      jobProfile: this.getCellValueByIndex(row, 0), // Column A
      effortHours: 0,
      resourceCount: 1,
      productType: 'Phase 1',
      phaseNumber: 1,
      domain,
      totalMandateEffort
    };
  }

  // Standard extraction for other sheets...
}
```

#### 3. Validation

```typescript
private isValidDemandRow(row: any[], headers: string[]): boolean {
  // Ph1Demand validation
  if (headers.length > 14 && row.length > 14) {
    const domain = String(row[12] || '').trim();
    const totalEffort = parseFloat(String(row[14] || ''));
    return domain.length > 0 && !isNaN(totalEffort) && totalEffort > 0;
  }

  // Standard validation for other sheets...
}
```

## Data Mapping

### Column Index Mapping

| Column | Index | Purpose      | Example             |
| ------ | ----- | ------------ | ------------------- |
| A      | 0     | Project Role | "Program Directors" |
| M      | 12    | Domain       | "Program"           |
| O      | 14    | Total Effort | 55.5                |

### Data Transformation

```typescript
// Input: Excel row
['Program Directors', 'Phase 1', 'AMER', ..., 'Program', ..., 55.5, ...]

// Output: CETv22ResourceDemand
{
  jobProfile: "Program Directors",
  domain: "Program",
  totalMandateEffort: 55.5,
  phaseNumber: 1,
  // ... other fields
}
```

## Error Handling

### Validation Errors

- Missing required columns
- Invalid data types
- Empty or malformed rows
- File format issues

### Error Recovery

- Skip invalid rows
- Log warnings for debugging
- Provide meaningful error messages
- Graceful degradation

## Performance Considerations

### Memory Management

- Stream large files
- Process data in chunks
- Clean up temporary objects
- Optimize data structures

### Processing Speed

- Use direct index access
- Minimize string operations
- Efficient validation logic
- Parallel processing where possible

## Testing Requirements

### Test Cases

1. **Valid Ph1Demand file** - Should extract all data correctly
2. **Missing columns** - Should handle gracefully
3. **Invalid data types** - Should skip invalid rows
4. **Empty file** - Should return empty result
5. **Large file** - Should process without memory issues

### Sample Test Data

```typescript
const samplePh1DemandData = [
  ['Project Role', 'Phase', 'Region', '...', 'Domain', '...', 'Total'],
  ['Program Directors', 'Phase 1', 'AMER', '...', 'Program', '...', 55.5],
  ['Project Managers', 'Phase 1', 'AMER', '...', 'Program', '...', 57.5],
];
```

## Integration Points

### Dependencies

- **xlsx library**: Excel file reading
- **File API**: Browser file handling
- **TypeScript**: Type safety

### Output Format

- Structured data objects
- Consistent field naming
- Type-safe interfaces
- Error information

## Configuration

### Parser Settings

```typescript
interface ParserConfig {
  sheetName: 'Ph1Demand';
  headerRow: 3;
  dataStartRow: 6;
  requiredColumns: {
    projectRole: 0; // Column A
    domain: 12; // Column M
    totalEffort: 14; // Column O
  };
}
```

### Validation Rules

- Minimum row length: 15 columns
- Required fields: domain, totalMandateEffort
- Data types: string for domain, number for effort
- Value ranges: effort > 0, domain not empty

This specification provides complete details for implementing the Excel parser functionality.
