# TMF ODA Management System

## Overview

The TMF ODA (Open Digital Architecture) Management System is a comprehensive, interactive tool for managing TeleManagement Forum domains and capabilities within the E2E Delivery Management application. It provides a "shopping cart" style interface for building and managing TMF ODA architectures.

## Features

### 🏗️ Domain Management
- **Add/Remove Domains**: Create new TMF ODA domains or remove existing ones
- **Edit Domain Details**: Modify domain names and descriptions inline
- **Domain Selection**: Select/deselect entire domains and their capabilities
- **Expandable Views**: Collapsible domain sections for better organization

### 🔧 Capability Management
- **Add/Remove Capabilities**: Add new capabilities to specific domains
- **Edit Capability Details**: Modify capability names and descriptions inline
- **Individual Selection**: Select/deselect specific capabilities independently
- **Domain Association**: Capabilities are automatically linked to their parent domains

### 📊 State Management
- **Real-time Updates**: All changes are reflected immediately in the UI
- **Selection Tracking**: Monitor selected domains and capabilities counts
- **State Persistence**: Maintain state across component re-renders
- **Export/Import**: Save and load TMF ODA configurations

## Architecture

### Component Structure
```
TMFOdaManager
├── Header (Title + Add Domain Button + Selection Counts)
├── Add Domain Form (Conditional)
├── Domains List
│   ├── Domain Card
│   │   ├── Domain Header (Name, Description, Actions)
│   │   ├── Add Capability Form (Conditional)
│   │   └── Capabilities List (Conditional)
│   │       └── Capability Item (Name, Description, Actions)
│   └── Empty State
└── State Management
```

### Data Models

#### TMFOdaDomain
```typescript
interface TMFOdaDomain {
  id: string;
  name: string;
  description: string;
  capabilities: TMFOdaCapability[];
  isSelected: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### TMFOdaCapability
```typescript
interface TMFOdaCapability {
  id: string;
  name: string;
  description: string;
  domainId: string;
  isSelected: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### TMFOdaState
```typescript
interface TMFOdaState {
  domains: TMFOdaDomain[];
  selectedDomainIds: string[];
  selectedCapabilityIds: string[];
}
```

## Usage

### Basic Operations

1. **Adding a Domain**
   - Click "Add Domain" button
   - Enter domain name and description
   - Click "Add Domain" to confirm

2. **Adding a Capability**
   - Click the "+" button on any domain
   - Enter capability name and description
   - Click "Add Capability" to confirm

3. **Editing Items**
   - Click the edit (pencil) icon on any domain or capability
   - Modify the text inline
   - Press Enter or click outside to save

4. **Selecting Items**
   - Use checkboxes to select/deselect domains and capabilities
   - Selecting a domain automatically selects all its capabilities
   - Individual capabilities can be selected independently

5. **Removing Items**
   - Click the trash icon to remove domains or capabilities
   - Removing a domain removes all its capabilities

### Advanced Features

- **Expandable Views**: Click the chevron icons to expand/collapse domain sections
- **Real-time Counts**: View selection counts in the header
- **State Callbacks**: Use `onStateChange` prop to react to state changes
- **Initial State**: Provide `initialState` prop to pre-populate the component

## Integration

### In Main Application
The TMF ODA Manager is integrated into the main E2E Delivery Management application under the TMF tab, providing two sub-tabs:
- **TMF ODA Management**: The main management interface
- **TMF Capabilities**: Legacy capabilities view with SpecSync integration

### Demo Page
A dedicated demo page is available at `/tmf-demo` that showcases the full functionality with:
- Import/Export capabilities
- Real-time state display
- Sidebar with feature overview
- Standalone testing environment

## Mock Data

The system comes pre-loaded with comprehensive mock TMF ODA reference data based on real TMF standards:

### Domains
- Market & Sales Domain
- Product Domain
- Customer Domain
- Service Domain
- Resource Domain
- Business Partner Domain
- Enterprise Domain
- Shared Domain
- Integration Domain

### Capabilities
Each domain includes relevant capabilities with realistic descriptions. For example:
- **Market & Sales Domain**: Sales Territory Management, Lead Management, Marketing Campaign Workflow Design
- **Product Domain**: Product Specification Management, Offer Configuration, Product Activation
- **Customer Domain**: Customer Interaction Management, Loyalty Program Management, Customer Experience Analysis

## Technical Implementation

### React Patterns
- **Functional Components**: Modern React with hooks
- **State Management**: Local state with useState and useEffect
- **Event Handling**: Comprehensive event handlers for all user interactions
- **Conditional Rendering**: Dynamic UI based on state and user actions

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Component Library**: Integration with Shadcn UI components
- **Custom Styling**: Tailored styles for TMF-specific elements

### Performance
- **Efficient Rendering**: Minimal re-renders with proper state management
- **Lazy Loading**: Capabilities are only rendered when domains are expanded
- **Optimized Updates**: Batch state updates to prevent unnecessary renders

## Future Enhancements

### Planned Features
- **Bulk Operations**: Select multiple items for batch operations
- **Search & Filter**: Find specific domains or capabilities quickly
- **Validation**: Input validation and error handling
- **Undo/Redo**: History management for user actions
- **Collaboration**: Multi-user editing capabilities

### Integration Roadmap
- **SpecSync Integration**: Map imported requirements to TMF ODA capabilities
- **Effort Estimation**: Link capabilities to effort estimates
- **Work Package Mapping**: Associate capabilities with work packages
- **Reporting**: Generate TMF ODA compliance reports

## Browser Compatibility

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Support**: Responsive design for tablets and mobile devices
- **JavaScript**: ES6+ features with fallbacks for older browsers

## Development

### Prerequisites
- Node.js 16+
- React 18+
- TypeScript 4.5+
- Tailwind CSS 3.0+

### Setup
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Navigate to `/tmf-demo` for the standalone demo
4. Access via main app under TMF → TMF ODA Management

### Testing
- Component testing with React Testing Library
- Integration testing for state management
- E2E testing for user workflows

## Support

For questions or issues with the TMF ODA Management System:
- Check the component documentation
- Review the TypeScript interfaces
- Test with the standalone demo page
- Consult the main application integration

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-27  
**Compatibility**: TMF ODA 2025, Next.js 14, React 18
