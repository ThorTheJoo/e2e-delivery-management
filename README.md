# E2E Delivery Management System

A comprehensive, modern web application for managing end-to-end delivery projects with TMF ODA (Open Digital Architecture) compliance, SpecSync integration, and advanced estimation capabilities.

## 🚀 Features

### Core System
- **Modern React/Next.js Architecture** - Built with Next.js 14, TypeScript, and Tailwind CSS
- **Responsive Design** - Mobile-first approach with beautiful, modern UI
- **Real-time State Management** - Efficient state handling with React hooks
- **Component Library** - Custom UI components built with Shadcn UI and Radix UI

### TMF ODA Management
- **Domain & Capability Management** - Interactive management of TMF ODA domains and capabilities
- **Shopping Cart Interface** - Intuitive selection and management of TMF components
- **Real-time Statistics** - Live updates of selected domains, capabilities, and requirements
- **Collapsible Sections** - Organized, expandable interface for better user experience

### SpecSync Integration
- **Multi-format Import** - Support for CSV, Excel (.xlsx, .xls) files
- **Flexible Column Mapping** - Intelligent header detection and mapping
- **Use Case Tracking** - Advanced use case identification and counting from 'usecase 1' field
- **Requirement Mapping** - Automatic mapping of SpecSync requirements to TMF capabilities
- **Data Persistence** - Local storage for imported data with session persistence

### Blue Dolphin Integration
- **OData v4.0 Integration** - Full integration with Blue Dolphin enterprise architecture tool
- **Solution Model Management** - Create and manage solution models in Blue Dolphin
- **Object Data Retrieval** - Load and display Blue Dolphin objects with advanced filtering
- **Service Discovery** - Automatic discovery of available OData endpoints and metadata
- **Authentication Support** - Basic authentication and API key support
- **Real-time Data Preview** - Live preview of retrieved Blue Dolphin objects

### TMF Capabilities Overview
- **Dynamic Capability Cards** - Rich cards showing effort breakdown, segments, and statistics
- **Use Case Statistics** - Display of unique use cases per capability with orange badges
- **Requirement Counts** - Real-time requirement mapping counts with visual badges
- **Effort Calculation** - Automatic effort calculation (BA, SA, Dev, QA) per capability

### Project Management
- **Dashboard Overview** - Comprehensive project metrics and KPIs
- **eTOM Process Management** - Support for eTOM process frameworks
- **Work Package Estimation** - Detailed effort estimation for work packages
- **Risk Management** - Risk identification, assessment, and mitigation tracking
- **Dependency Management** - Technical, business, and external dependency tracking

### Estimation & Planning
- **Effort Breakdown** - Detailed role-based effort estimation (Business Analyst, Solution Architect, Developer, QA)
- **Complexity Factors** - Configurable complexity multipliers for accurate estimation
- **Resource Planning** - Team size and resource allocation management
- **Timeline Management** - Project scheduling with milestone tracking

### Commercial & Financial
- **Cost Structure** - Base cost, risk contingency, and profit margin calculations
- **Rate Card Management** - Geographic rate multipliers and role-based pricing
- **Commercial Models** - Support for Fixed Price, Time & Materials, and milestone-based models

### Documentation & Reporting
- **Document Management** - Project document tracking with version control
- **Status Tracking** - Real-time status updates for all project components
- **Export Capabilities** - Data export for reporting and analysis

## 🛠️ Technical Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Modern component library
- **Radix UI** - Accessible UI primitives
- **Lucide React** - Beautiful icon library

### Data Management
- **Local Storage** - Client-side data persistence
- **JSON Data Service** - Mock data service for development
- **State Management** - React hooks and context for state management

### File Processing
- **XLSX.js** - Excel file parsing and processing
- **CSV Processing** - Native CSV parsing with flexible column mapping

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main application page
│   └── tmf-demo/          # TMF demo page
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── blue-dolphin-integration.tsx
│   ├── navigation-sidebar.tsx
│   ├── requirement-badge.tsx
│   ├── specsync-import.tsx
│   ├── tmf-domain-capability-manager.tsx
│   └── tmf-oda-manager.tsx
├── lib/                  # Utility libraries
│   ├── blue-dolphin-service.ts # Blue Dolphin service layer
│   ├── data-service.ts   # Data service layer
│   ├── specsync-utils.ts # SpecSync processing utilities
│   └── utils.ts          # General utilities
└── types/                # TypeScript type definitions
    ├── blue-dolphin.ts   # Blue Dolphin type definitions
    └── index.ts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "E2E Delivery Management - Rebuild"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📊 Usage Guide

### Importing SpecSync Data

1. **Navigate to TMF Tab** - Click on the "TMF" tab in the main navigation
2. **Expand SpecSync Import** - Click on the "SpecSync Import" section
3. **Select File** - Choose a CSV or Excel file with the following columns:
   - Rephrased Requirement ID
   - Rephrased Domain
   - Rephrased Function Name
   - Rephrased AF Lev.2
   - Reference Capability
   - **Usecase 1** (new feature for use case tracking)
4. **Review Import** - Check the import summary and requirements preview
5. **View Results** - See mapped requirements and use cases in the TMF Capabilities Overview

### Managing TMF ODA Domains

1. **Access TMF Manager** - Use the TMF Domain and Capability Manager
2. **Add Domains** - Click "Add Domain" to create new TMF ODA domains
3. **Add Capabilities** - Add capabilities to domains using the "+" button
4. **Select Components** - Use checkboxes to select domains and capabilities
5. **View Statistics** - Monitor selection counts in the capability overview

### Viewing Use Case Statistics

1. **Import SpecSync Data** - Import data with 'usecase 1' field
2. **Check Capability Cards** - Look for orange "Use Cases" badges
3. **Review Counts** - See unique use case counts per capability
4. **Analyze Mapping** - Understand how use cases map to TMF capabilities

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for environment-specific configuration:

```env
# Development settings
NEXT_PUBLIC_APP_NAME="E2E Delivery Management"
NEXT_PUBLIC_VERSION="1.0.0"

# API endpoints (if using external APIs)
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

### Tailwind Configuration
The project uses a custom Tailwind configuration with TMF-specific color schemes:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        tmf: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          600: '#0284c7',
          800: '#075985',
        },
        etom: {
          50: '#fdf4ff',
          100: '#fae8ff',
          600: '#c026d3',
          800: '#9d174d',
        }
      }
    }
  }
}
```

## 📈 Data Models

### SpecSync Data Structure
```typescript
interface SpecSyncItem {
  rephrasedRequirementId: string;
  sourceRequirementId: string;
  domain: string;
  vertical: string;
  functionName: string;
  afLevel2: string;
  capability: string;
  referenceCapability: string;
  usecase1: string; // New field for use case tracking
}
```

### TMF Capability Structure
```typescript
interface TMFCapability {
  id: string;
  name: string;
  description: string;
  segments: string[];
  baseEffort: {
    businessAnalyst: number;
    solutionArchitect: number;
    developer: number;
    qaEngineer: number;
  };
  complexityFactors: Record<string, number>;
}
```

## 🧪 Testing

### Manual Testing
1. **Import Test Files** - Use the provided test files:
   - `test-import.csv` - Basic SpecSync data
   - `test-import-with-usecases.csv` - Data with use case information
2. **Verify Mapping** - Check that requirements map correctly to capabilities
3. **Test Use Cases** - Verify use case counting and display

### Test Data
The system includes comprehensive test data in `demo-data.json` covering:
- TMF capabilities with effort estimates
- eTOM processes with complexity factors
- Project templates and configurations
- Risk and dependency examples

## 🔄 Recent Updates

### Version 1.0.0 (Latest)
- ✅ **Use Case Tracking** - Added support for 'usecase 1' field in SpecSync imports
- ✅ **Enhanced Capability Cards** - Display use case statistics with orange badges
- ✅ **Improved Mapping Logic** - Better capability matching with domain-guided fallbacks
- ✅ **Real-time Statistics** - Live updates of use case counts and requirement mapping

### Previous Versions
- **Initial Release** - Core TMF ODA management functionality
- **SpecSync Integration** - CSV/Excel import capabilities
- **Dashboard & Analytics** - Project overview and metrics
- **Estimation Engine** - Effort calculation and complexity factors

## 🤝 Contributing

### Development Workflow
1. **Create Feature Branch** - `git checkout -b feature/use-case-tracking`
2. **Make Changes** - Implement new features or fixes
3. **Test Thoroughly** - Ensure all functionality works correctly
4. **Commit Changes** - Use descriptive commit messages
5. **Push to Repository** - `git push origin feature/use-case-tracking`
6. **Create Pull Request** - Submit for review and merge

### Code Standards
- **TypeScript** - Use strict typing for all new code
- **Component Structure** - Follow established component patterns
- **Styling** - Use Tailwind CSS classes consistently
- **Documentation** - Add comments for complex logic

## 📝 License

This project is proprietary software developed for CSG Systems Inc.

## 🆘 Support

For technical support or questions:
- **Documentation** - Check this README and inline code comments
- **Issues** - Report bugs through the project issue tracker
- **Development** - Contact the development team for feature requests

---

**Built with ❤️ by the CSG Delivery Orchestrator Team**
