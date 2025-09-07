# Resource Role Breakdown Collapsible Implementation

## Overview

This document outlines the implementation of a collapsible Resource Role Breakdown section in the CET v22.0 Service Design page. The section is now collapsible by default on page load, providing a cleaner initial view while maintaining easy access to detailed resource information.

## Changes Made

### 1. New Collapsible Component (`src/components/ui/collapsible.tsx`)

Created a reusable collapsible UI component with the following features:

- **Default State**: Configurable default collapsed/expanded state
- **Smooth Animation**: CSS transitions for expand/collapse animations
- **Accessibility**: Proper ARIA attributes for screen readers
- **Customizable Styling**: Flexible className props for different use cases
- **Icon Indicators**: ChevronRight (collapsed) and ChevronDown (expanded) icons

#### Component Props
```typescript
interface CollapsibleProps {
  title: string;                    // Section title
  children: React.ReactNode;        // Content to show/hide
  defaultCollapsed?: boolean;       // Default state (defaults to false)
  className?: string;               // Container styling
  headerClassName?: string;         // Header styling
  contentClassName?: string;        // Content area styling
}
```

#### Key Features
- **State Management**: Uses React useState for collapse/expand state
- **Smooth Transitions**: CSS transitions with max-height and opacity changes
- **Accessibility**: Proper ARIA labels and expanded state management
- **Responsive Design**: Works across different screen sizes

### 2. Updated Resource Dashboard (`src/components/cet-v22/CETv22ResourceDashboard.tsx`)

Modified the Resource Role Breakdown section to use the new Collapsible component:

#### Before (Card-based)
```tsx
<Card>
  <CardHeader>
    <CardTitle>Resource Role Breakdown</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Role breakdown content */}
  </CardContent>
</Card>
```

#### After (Collapsible)
```tsx
<Collapsible 
  title="Resource Role Breakdown" 
  defaultCollapsed={true}
  className="border-0 shadow-none"
>
  {/* Role breakdown content */}
</Collapsible>
```

## Implementation Details

### Default Behavior
- **Initial State**: Section is collapsed by default (`defaultCollapsed={true}`)
- **User Interaction**: Users can click the header to expand/collapse
- **Visual Feedback**: Chevron icon changes direction based on state
- **Smooth Animation**: 200ms transition for height and opacity changes

### Styling
- **Border Removal**: Uses `border-0 shadow-none` to maintain consistent appearance
- **Hover Effects**: Subtle background color change on header hover
- **Icon Styling**: Muted foreground color for chevron icons
- **Spacing**: Maintains consistent padding and margins

### Accessibility Features
- **ARIA Labels**: Dynamic labels for expand/collapse actions
- **Keyboard Navigation**: Button element for proper keyboard interaction
- **Screen Reader Support**: Proper ARIA expanded state management
- **Focus Management**: Maintains focus within the collapsible section

## Benefits

### 1. **Improved User Experience**
- Cleaner initial page load with less visual clutter
- Users can focus on high-level metrics first
- Easy access to detailed information when needed

### 2. **Better Information Hierarchy**
- Clear separation between summary and detailed views
- Progressive disclosure of information
- Reduced cognitive load on initial page visit

### 3. **Consistent UI Pattern**
- Reusable component for other collapsible sections
- Consistent behavior across the application
- Maintains design system consistency

### 4. **Performance Considerations**
- Reduced initial DOM rendering
- Smooth animations without performance impact
- Efficient state management

## Usage Examples

### Basic Usage
```tsx
<Collapsible title="Section Title">
  <p>Content goes here</p>
</Collapsible>
```

### With Custom Styling
```tsx
<Collapsible 
  title="Custom Section" 
  defaultCollapsed={false}
  className="bg-gray-50"
  headerClassName="text-blue-600 font-bold"
>
  <p>Custom styled content</p>
</Collapsible>
```

### Nested Collapsibles
```tsx
<Collapsible title="Main Section">
  <Collapsible title="Sub Section" defaultCollapsed={true}>
    <p>Nested content</p>
  </Collapsible>
</Collapsible>
```

## Future Enhancements

### 1. **Animation Options**
- Configurable animation duration
- Different animation easing functions
- Optional slide animations

### 2. **State Persistence**
- Remember user preferences
- Local storage integration
- URL state management

### 3. **Advanced Features**
- Accordion behavior (only one section open at a time)
- Lazy loading of content
- Custom trigger elements

### 4. **Integration**
- Use in other dashboard sections
- Apply to Domain Breakdown section
- Implement in other CET v22.0 components

## Testing Considerations

### 1. **Functionality Testing**
- Default collapsed state on page load
- Expand/collapse functionality
- Icon state changes
- Animation smoothness

### 2. **Accessibility Testing**
- Screen reader compatibility
- Keyboard navigation
- ARIA attribute validation
- Focus management

### 3. **Cross-browser Testing**
- Chrome, Firefox, Safari, Edge
- Mobile browser compatibility
- Animation performance

### 4. **Responsive Testing**
- Different screen sizes
- Touch device interactions
- Mobile vs desktop behavior

## Conclusion

The implementation of the collapsible Resource Role Breakdown section provides a better user experience by reducing initial visual clutter while maintaining easy access to detailed information. The reusable Collapsible component can be extended to other sections of the application, creating a consistent and intuitive interface for users.

The component follows accessibility best practices and provides smooth animations, making it a valuable addition to the CET v22.0 Service Design interface.
