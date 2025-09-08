# CET v22.0 Data Analysis Algorithms

## Domain Breakdown Analysis Algorithm

### Core Algorithm

```typescript
function analyzeDomainBreakdown(demands: CETv22ResourceDemand[]): CETv22DomainEffort[] {
  // Step 1: Filter Ph1Demand data
  const ph1Demands = demands.filter((d) => d.phaseNumber === 1 && d.domain && d.totalMandateEffort);

  // Step 2: Create domain aggregation map
  const domainMap = new Map<string, DomainAggregation>();

  // Step 3: Aggregate data by domain and role
  ph1Demands.forEach((demand) => {
    const domain = demand.domain || 'Unknown';
    const effort = demand.totalMandateEffort || 0;
    const role = demand.jobProfile || 'Unknown';

    // Initialize domain if not exists
    if (!domainMap.has(domain)) {
      domainMap.set(domain, {
        totalEffort: 0,
        roleEfforts: new Map<string, number>(),
      });
    }

    const domainData = domainMap.get(domain)!;
    domainData.totalEffort += effort;

    // Aggregate by role within domain
    if (!domainData.roleEfforts.has(role)) {
      domainData.roleEfforts.set(role, 0);
    }
    domainData.roleEfforts.set(role, domainData.roleEfforts.get(role)! + effort);
  });

  // Step 4: Calculate total effort across all domains
  const totalEffort = Array.from(domainMap.values()).reduce(
    (sum, data) => sum + data.totalEffort,
    0,
  );

  // Step 5: Generate result with percentages
  return Array.from(domainMap.entries()).map(([domain, data]) => ({
    domain,
    totalEffort: data.totalEffort,
    percentage: totalEffort > 0 ? (data.totalEffort / totalEffort) * 100 : 0,
    roleBreakdown: Array.from(data.roleEfforts.entries()).map(([role, effort]) => ({
      role,
      effort,
      percentage: totalEffort > 0 ? (effort / totalEffort) * 100 : 0,
    })),
  }));
}
```

### Data Structures

#### Domain Aggregation

```typescript
interface DomainAggregation {
  totalEffort: number;
  roleEfforts: Map<string, number>;
}
```

#### Analysis Result

```typescript
interface CETv22DomainEffort {
  domain: string;
  totalEffort: number;
  percentage: number;
  roleBreakdown: CETv22RoleEffort[];
}
```

## Calculation Formulas

### Percentage Calculations

```typescript
// Domain percentage of total effort
domainPercentage = (domainTotalEffort / totalEffortAcrossAllDomains) * 100;

// Role percentage of total effort
rolePercentage = (roleEffort / totalEffortAcrossAllDomains) * 100;

// Role percentage within domain
rolePercentageInDomain = (roleEffort / domainTotalEffort) * 100;
```

### Effort Aggregation

```typescript
// Total effort per domain
domainTotalEffort = sum(roleEfforts for all roles in domain)

// Total effort across all domains
totalEffort = sum(domainTotalEfforts for all domains)

// Average effort per role
averageRoleEffort = totalEffort / numberOfRoles
```

## Data Processing Pipeline

### 1. Data Filtering

```typescript
// Filter criteria for Ph1Demand analysis
const isValidForDomainAnalysis = (demand: CETv22ResourceDemand): boolean => {
  return (
    demand.phaseNumber === 1 && // Phase 1 data only
    demand.domain && // Must have domain
    demand.domain.trim().length > 0 && // Domain not empty
    demand.totalMandateEffort && // Must have effort data
    demand.totalMandateEffort > 0 // Effort must be positive
  );
};
```

### 2. Data Aggregation

```typescript
// Group by domain, then by role
const aggregateByDomainAndRole = (demands: CETv22ResourceDemand[]) => {
  const aggregation = new Map<string, Map<string, number>>();

  demands.forEach((demand) => {
    const domain = demand.domain!;
    const role = demand.jobProfile;
    const effort = demand.totalMandateEffort!;

    if (!aggregation.has(domain)) {
      aggregation.set(domain, new Map());
    }

    const domainRoles = aggregation.get(domain)!;
    const currentEffort = domainRoles.get(role) || 0;
    domainRoles.set(role, currentEffort + effort);
  });

  return aggregation;
};
```

### 3. Percentage Calculation

```typescript
// Calculate percentages relative to total effort
const calculatePercentages = (
  domainEfforts: Map<string, number>,
  totalEffort: number,
): CETv22DomainEffort[] => {
  return Array.from(domainEfforts.entries()).map(([domain, effort]) => ({
    domain,
    totalEffort: effort,
    percentage: totalEffort > 0 ? (effort / totalEffort) * 100 : 0,
    roleBreakdown: [], // Will be populated separately
  }));
};
```

## Performance Optimizations

### Memory Efficiency

```typescript
// Use Maps for O(1) lookups
const domainMap = new Map<string, DomainAggregation>();

// Avoid array iterations where possible
const totalEffort = Array.from(domainMap.values()).reduce((sum, data) => sum + data.totalEffort, 0);
```

### Processing Efficiency

```typescript
// Single pass aggregation
demands.forEach((demand) => {
  // Process and aggregate in one iteration
  const domain = demand.domain!;
  const role = demand.jobProfile;
  const effort = demand.totalMandateEffort!;

  // Update aggregations
  updateDomainAggregation(domain, role, effort);
});
```

## Error Handling

### Data Validation

```typescript
const validateDemandData = (demand: CETv22ResourceDemand): boolean => {
  try {
    // Check required fields
    if (!demand.domain || !demand.totalMandateEffort) {
      return false;
    }

    // Validate data types
    if (typeof demand.totalMandateEffort !== 'number') {
      return false;
    }

    // Validate ranges
    if (demand.totalMandateEffort < 0) {
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Invalid demand data:', error);
    return false;
  }
};
```

### Graceful Degradation

```typescript
// Handle missing or invalid data
const safeCalculatePercentage = (value: number, total: number): number => {
  if (total === 0 || isNaN(value) || isNaN(total)) {
    return 0;
  }
  return (value / total) * 100;
};
```

## Testing Algorithms

### Unit Test Cases

```typescript
describe('Domain Breakdown Analysis', () => {
  test('should aggregate efforts by domain', () => {
    const demands = [
      { domain: 'Program', totalMandateEffort: 100, jobProfile: 'Role1' },
      { domain: 'Program', totalMandateEffort: 50, jobProfile: 'Role2' },
      { domain: 'Product', totalMandateEffort: 75, jobProfile: 'Role1' },
    ];

    const result = analyzeDomainBreakdown(demands);

    expect(result).toHaveLength(2);
    expect(result[0].totalEffort).toBe(150); // Program domain
    expect(result[1].totalEffort).toBe(75); // Product domain
  });

  test('should calculate correct percentages', () => {
    const demands = [
      { domain: 'Program', totalMandateEffort: 100 },
      { domain: 'Product', totalMandateEffort: 200 },
    ];

    const result = analyzeDomainBreakdown(demands);

    expect(result[0].percentage).toBeCloseTo(33.33, 2); // 100/300
    expect(result[1].percentage).toBeCloseTo(66.67, 2); // 200/300
  });
});
```

### Edge Cases

```typescript
// Test with empty data
test('should handle empty demands array', () => {
  const result = analyzeDomainBreakdown([]);
  expect(result).toEqual([]);
});

// Test with invalid data
test('should filter out invalid demands', () => {
  const demands = [
    { domain: 'Program', totalMandateEffort: 100 },
    { domain: '', totalMandateEffort: 50 }, // Invalid: empty domain
    { domain: 'Product', totalMandateEffort: 0 }, // Invalid: zero effort
    { domain: 'Test', totalMandateEffort: -10 }, // Invalid: negative effort
  ];

  const result = analyzeDomainBreakdown(demands);
  expect(result).toHaveLength(1); // Only valid demand
  expect(result[0].domain).toBe('Program');
});
```

## Algorithm Complexity

### Time Complexity

- **Data Filtering**: O(n) where n = number of demands
- **Aggregation**: O(n) single pass through demands
- **Percentage Calculation**: O(d \* r) where d = domains, r = roles per domain
- **Overall**: O(n + d \* r)

### Space Complexity

- **Domain Map**: O(d) where d = number of unique domains
- **Role Maps**: O(r) where r = total number of unique roles
- **Result Array**: O(d \* r)
- **Overall**: O(d \* r)

## Integration Points

### Input Data Format

```typescript
interface CETv22ResourceDemand {
  domain?: string; // Required for domain analysis
  totalMandateEffort?: number; // Required for domain analysis
  jobProfile: string; // Used for role breakdown
  phaseNumber: number; // Used for filtering (must be 1)
}
```

### Output Data Format

```typescript
interface CETv22DomainEffort {
  domain: string;
  totalEffort: number;
  percentage: number;
  roleBreakdown: CETv22RoleEffort[];
}
```

This algorithm specification provides complete details for implementing the domain breakdown analysis functionality.
