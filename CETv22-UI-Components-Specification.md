# CET v22.0 UI Components Specification

## Component Library Requirements

### Base UI Components

```typescript
// Required UI primitives
- Card (CardHeader, CardContent, CardTitle)
- Badge (with variants: default, secondary, destructive)
- Progress (with value and styling)
- Button (with variants and sizes)
- Tabs (TabsList, TabsTrigger, TabsContent)
- Alert (AlertTitle, AlertDescription)
```

### Styling System

- **Tailwind CSS**: Utility-first styling
- **CSS Variables**: For theming and customization
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Optional theme support

## Domain Breakdown Component

### CETv22ResourceDashboard Structure

```typescript
interface CETv22ResourceDashboardProps {
  resourceAnalysis: CETv22ResourceAnalysis;
  jobProfiles: CETv22JobProfile[];
}
```

### Visual Design Specifications

#### 1. Domain Card Layout

```typescript
// Each domain gets a card with:
- Domain name (large heading)
- Total hours (prominent number)
- Domain share percentage
- Progress bar visualization
- Role breakdown list
```

#### 2. Progress Bar Styling

```css
/* Domain share progress bar */
.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2563eb; /* Blue-600 */
  transition: width 0.3s ease;
}
```

#### 3. Role Breakdown Items

```typescript
// Each role shows:
- Role name (left aligned)
- Effort hours (right aligned, bold)
- Percentage badge (small, secondary variant)
```

### Responsive Behavior

#### Desktop (1024px+)

- 2-column grid for domain cards
- Full role breakdown visible
- Large progress bars

#### Tablet (768px-1023px)

- Single column layout
- Condensed role breakdown
- Medium progress bars

#### Mobile (<768px)

- Stacked layout
- Collapsible role sections
- Compact progress indicators

## Component Implementation

### Domain Breakdown Section

```typescript
{resourceAnalysis.domainBreakdown?.length > 0 ? (
  <Card>
    <CardHeader>
      <CardTitle>Domain Breakdown & Total Mandate Effort</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {resourceAnalysis.domainBreakdown.map((domain, index) => (
          <div key={index} className="p-4 border rounded-lg">
            {/* Domain header with total hours */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">{domain.domain}</h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {domain.totalEffort.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
            </div>

            {/* Domain share progress bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                <span>Domain Share</span>
                <span>{domain.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${domain.percentage}%` }}
                />
              </div>
            </div>

            {/* Role breakdown */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Role Breakdown:</h4>
              {domain.roleBreakdown.map((role, roleIndex) => (
                <div key={roleIndex} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{role.role}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{role.effort.toLocaleString()}h</span>
                    <Badge variant="secondary" className="text-xs">
                      {role.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
) : (
  // Empty state with debug info
  <EmptyStateComponent />
)}
```

### Empty State Component

```typescript
<Card>
  <CardHeader>
    <CardTitle>Domain Breakdown & Total Mandate Effort</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-center py-8 text-muted-foreground">
      <p>No domain breakdown data available.</p>
      <p className="text-sm mt-2">
        This section requires Ph1Demand worksheet data with domain (Column M) and total mandate effort (Column O) information.
      </p>
      <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left text-sm">
        <p><strong>Debug Info:</strong></p>
        <p>• resourceAnalysis.domainBreakdown: {JSON.stringify(resourceAnalysis.domainBreakdown)}</p>
        <p>• resourceAnalysis.domainBreakdown length: {resourceAnalysis.domainBreakdown?.length || 0}</p>
        <p>• resourceAnalysis keys: {Object.keys(resourceAnalysis).join(', ')}</p>
      </div>
    </div>
  </CardContent>
</Card>
```

## Accessibility Features

### ARIA Labels

```typescript
// Progress bars
<div
  role="progressbar"
  aria-valuenow={domain.percentage}
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label={`${domain.domain} domain share: ${domain.percentage.toFixed(1)}%`}
>
```

### Keyboard Navigation

- Tab order through domain cards
- Enter/Space to expand role breakdowns
- Arrow keys for progress bar navigation

### Screen Reader Support

- Semantic HTML structure
- Descriptive labels
- Status announcements for data loading

## Animation and Transitions

### Loading States

```typescript
// Skeleton loading for domain cards
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
</div>
```

### Progress Bar Animations

```css
.progress-fill {
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Hover Effects

```css
.domain-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}
```

## Color Scheme

### Primary Colors

- **Blue-600**: `#2563eb` (Progress bars, totals)
- **Gray-600**: `#4b5563` (Text, labels)
- **Gray-200**: `#e5e7eb` (Background bars)

### Status Colors

- **Green-600**: `#16a34a` (Success states)
- **Red-600**: `#dc2626` (Error states)
- **Yellow-600**: `#ca8a04` (Warning states)

## Performance Optimizations

### Component Memoization

```typescript
const DomainCard = React.memo(({ domain, index }) => {
  // Component implementation
});
```

### Virtual Scrolling

```typescript
// For large domain lists
import { FixedSizeList as List } from 'react-window';
```

### Lazy Loading

```typescript
// Load role breakdowns on demand
const [expandedDomains, setExpandedDomains] = useState<Set<number>>(new Set());
```

## Testing Requirements

### Visual Regression Tests

- Component snapshots
- Responsive breakpoints
- Dark mode variants

### Interaction Tests

- Click handlers
- Keyboard navigation
- Accessibility compliance

### Performance Tests

- Large dataset rendering
- Memory usage
- Animation smoothness

This specification provides complete UI component requirements for the domain breakdown functionality.
