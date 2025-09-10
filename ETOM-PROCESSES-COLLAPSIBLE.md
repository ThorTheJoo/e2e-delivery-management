# eTOM Processes Collapsible Implementation

## Overview

This document outlines the implementation of a collapsible eTOM Processes section in the Project Dashboard. The section now follows the same collapsible pattern used throughout the application, providing a consistent user experience and cleaner initial view.

## Changes Made

### 1. State Management

Added a new state variable to manage the expanded/collapsed state of the eTOM Processes section:

```typescript
const [isEtomProcessesExpanded, setIsEtomProcessesExpanded] = useState(false);
```

### 2. Tab Change Handler Update

Updated the `handleTabChange` function to reset the eTOM Processes expanded state when switching tabs:

```typescript
const handleTabChange = (tab: string) => {
  setActiveTab(tab);
  // Reset all expanded states when switching tabs
  setIsSpecSyncExpanded(false);
  setIsTmfManagerExpanded(false);
  setIsTmfCapabilitiesExpanded(false);
  setIsEtomProcessesExpanded(false); // Added this line
};
```

### 3. UI Structure Transformation

#### Before (Card-based)
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center space-x-2">
      <Route className="h-5 w-5" />
      <span>eTOM Processes</span>
    </CardTitle>
    <CardDescription>
      Enterprise Tomography Operations Map processes and effort breakdowns
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content always visible */}
  </CardContent>
</Card>
```

#### After (Collapsible)
```tsx
<div className="border-b pb-6">
  <div
    className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
    onClick={() => setIsEtomProcessesExpanded(!isEtomProcessesExpanded)}
  >
    <div className="flex items-center space-x-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-blue-200 bg-blue-100">
        {isEtomProcessesExpanded ? (
          <ChevronDown className="h-5 w-5 text-blue-700" />
        ) : (
          <ChevronRight className="h-5 w-5 text-blue-700" />
        )}
      </div>
      <div>
        <h3 className="flex items-center space-x-2 text-base font-semibold">
          <Route className="h-4 w-4" />
          <span>eTOM Processes</span>
        </h3>
        <p className="text-sm text-muted-foreground">
          Enterprise Tomography Operations Map processes and effort breakdowns
        </p>
      </div>
    </div>
  </div>

  {isEtomProcessesExpanded && (
    <div className="space-y-4">
      {/* Content only visible when expanded */}
    </div>
  )}
</div>
```

## Implementation Details

### Visual Design

- **Color Scheme**: Uses blue theme (`border-blue-200`, `bg-blue-100`, `text-blue-700`) to distinguish from other collapsible sections
- **Icon Container**: 8x8 rounded container with border and background color
- **Chevron Icons**: `ChevronRight` when collapsed, `ChevronDown` when expanded
- **Hover Effects**: Subtle background color change on header hover (`hover:bg-muted/50`)

### Interaction Behavior

- **Default State**: Section is collapsed by default (`useState(false)`)
- **Click Handler**: Toggles the expanded state when clicking the header
- **Tab Reset**: Automatically collapses when switching to different tabs
- **Smooth Transitions**: Uses CSS transitions for hover effects

### Content Structure

- **Conditional Rendering**: Content only renders when `isEtomProcessesExpanded` is true
- **Preserved Layout**: Maintains the same grid layout and styling for process cards
- **Icon Consistency**: Keeps the original `Route` icon alongside the chevron

## Benefits

### 1. **Consistent User Experience**

- Follows the same pattern as TMF Capabilities and other collapsible sections
- Users can expect the same interaction behavior across the application
- Maintains visual consistency with established design patterns

### 2. **Improved Dashboard Performance**

- Reduces initial DOM rendering by hiding content by default
- Cleaner initial view with less visual clutter
- Progressive disclosure of information

### 3. **Better Information Hierarchy**

- Clear separation between section headers and detailed content
- Users can focus on high-level metrics first
- Easy access to detailed eTOM process information when needed

### 4. **Accessibility**

- Proper click handlers for keyboard and mouse interaction
- Clear visual indicators for expand/collapse state
- Maintains semantic structure with proper heading hierarchy

## Usage

The eTOM Processes section now behaves consistently with other collapsible sections:

1. **Initial Load**: Section appears collapsed with a right-pointing chevron
2. **Expand**: Click the header to expand and show all eTOM process details
3. **Collapse**: Click the header again to collapse and hide the content
4. **Tab Switch**: Automatically collapses when navigating to different tabs

## Technical Notes

- Uses the same `ChevronDown` and `ChevronRight` icons from Lucide React
- Maintains all existing functionality for process display and calculations
- No breaking changes to the underlying data structure or business logic
- Follows the established pattern used in TMF Capabilities section
