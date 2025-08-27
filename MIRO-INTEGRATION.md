# Miro Integration Guide

## Overview

This guide covers the integration of Miro boards with the E2E Delivery Management system for visual mapping of TMF domains and capabilities.

## Features

### 🎯 **Core Functionality**
- **TMF Architecture Boards**: Visual mapping of TMF domains and capabilities
- **SpecSync Requirements Boards**: Visual representation of imported requirements
- **Interactive Board Creation**: One-click board generation with proper layout
- **Board Management**: Easy access to created boards with direct links

### 🏗️ **Board Types**

#### **1. TMF Architecture Board**
- **Domain Frames**: Each TMF domain gets its own organizational frame
- **Capability Cards**: Individual capability cards within domain frames
- **Visual Hierarchy**: Clear organization with proper spacing and layout
- **Color Coding**: Different colors for domains vs capabilities

#### **2. SpecSync Requirements Board**
- **Requirement Cards**: Each SpecSync item becomes a visual card
- **Domain Grouping**: Requirements grouped by domain
- **Function Mapping**: Visual representation of function relationships
- **Grid Layout**: Organized grid layout for easy scanning

## Setup

### **1. Environment Configuration**

Create or update your `.env.local` file:

```bash
# Miro API Configuration
MIRO_CLIENT_ID="your-miro-client-id"
MIRO_CLIENT_SECRET="your-miro-client-secret"
MIRO_REDIRECT_URI="http://localhost:3000/api/auth/miro/callback"
MIRO_ACCESS_TOKEN="your-miro-access-token"
```

### **2. Miro App Setup**

1. **Create Miro App**:
   - Go to [Miro Developer Platform](https://developers.miro.com/)
   - Create a new app
   - Note your Client ID and Client Secret

2. **Configure Permissions**:
   - Enable `boards:read` and `boards:write` scopes
   - Set redirect URI to `http://localhost:3000/api/auth/miro/callback`

3. **Get Access Token**:
   - For development, use a personal access token
   - For production, implement OAuth flow

### **3. Installation**

```bash
# Install Miro API client
npm install @mirohq/miro-api

# Start development server
npm run dev
```

## Usage

### **1. Access Visual Mapping**

1. Navigate to the **Visual Mapping** tab in the main application
2. The interface shows two main sections:
   - TMF Architecture Board
   - SpecSync Requirements Board

### **2. Create TMF Architecture Board**

1. **Prerequisites**:
   - Select at least one TMF domain in the TMF ODA Manager
   - Ensure you have project data loaded

2. **Creation Process**:
   - Click "Create TMF Architecture Board"
   - System creates domain frames and capability cards
   - Board link appears when creation is complete

3. **Board Structure**:
   ```
   ┌─────────────────────────────────────┐
   │ Domain Frame: Market & Sales        │
   │ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
   │ │ Cap 1   │ │ Cap 2   │ │ Cap 3   │ │
   │ └─────────┘ └─────────┘ └─────────┘ │
   └─────────────────────────────────────┘
   ```

### **3. Create SpecSync Requirements Board**

1. **Prerequisites**:
   - Import SpecSync data via the SpecSync Import feature
   - Ensure requirements are properly mapped

2. **Creation Process**:
   - Click "Create SpecSync Requirements Board"
   - System creates requirement cards in grid layout
   - Board link appears when creation is complete

3. **Board Structure**:
   ```
   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ Req 1   │ │ Req 2   │ │ Req 3   │ │ Req 4   │
   └─────────┘ └─────────┘ └─────────┘ └─────────┘
   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ Req 5   │ │ Req 6   │ │ Req 7   │ │ Req 8   │
   └─────────┘ └─────────┘ └─────────┘ └─────────┘
   ```

### **4. Board Management**

- **View Boards**: Click "Open in Miro" to view created boards
- **Board Links**: All created boards are listed in the Board Management section
- **Direct Access**: Links open boards directly in Miro web interface

## Architecture

### **1. Service Layer**

```typescript
// src/lib/miro-service.ts
export class MiroService {
  // Board creation methods
  async createTMFBoard(project: Project, domains: TMFOdaDomain[])
  async createSpecSyncBoard(specSyncItems: SpecSyncItem[])
  
  // Board management methods
  async getBoard(boardId: string)
  async deleteBoard(boardId: string)
}
```

### **2. Component Structure**

```typescript
// src/components/miro-board-creator.tsx
export function MiroBoardCreator({
  project: Project,
  tmfDomains: TMFOdaDomain[],
  specSyncItems: SpecSyncItem[]
})
```

### **3. API Routes**

```typescript
// src/app/api/auth/miro/route.ts
// Future OAuth implementation
```

## Configuration

### **1. Card Templates**

The system uses flexible card templates:

```typescript
interface MiroCardConfig {
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  position?: { x: number; y: number };
  geometry?: { width: number; height: number };
  style?: {
    fillColor?: string;
    strokeColor?: string;
  };
}
```

### **2. Color Schemes**

- **TMF Capabilities**: `#4ecdc4` (teal)
- **SpecSync Requirements**: `#ff6b6b` (coral)
- **Domain Frames**: `#45b7d1` (blue)

### **3. Layout Configuration**

- **Domain Frames**: 800x600 pixels, spaced 850px apart
- **Capability Cards**: 250x120 pixels, 3 per row
- **Requirement Cards**: 200x100 pixels, 4 per row

## Error Handling

### **1. Authentication Errors**

- **Missing Credentials**: Clear error message with setup instructions
- **Invalid Token**: Automatic retry with user notification
- **Rate Limiting**: Graceful handling with retry logic

### **2. Board Creation Errors**

- **API Failures**: Detailed error logging and user feedback
- **Data Validation**: Pre-creation validation of input data
- **Network Issues**: Retry mechanism with exponential backoff

## Security

### **1. Credential Management**

- **Environment Variables**: All credentials stored in `.env.local`
- **Access Tokens**: Secure token storage and rotation
- **OAuth Flow**: Future implementation for production use

### **2. Data Privacy**

- **No Data Storage**: Miro boards contain only visual representations
- **Secure Transmission**: All API calls use HTTPS
- **Token Scoping**: Minimal required permissions

## Troubleshooting

### **1. Common Issues**

**"Failed to create board"**
- Check Miro credentials in `.env.local`
- Verify internet connection
- Ensure Miro app has correct permissions

**"Authentication failed"**
- Verify `MIRO_ACCESS_TOKEN` is valid
- Check token expiration
- Ensure app is properly configured

**"No domains selected"**
- Select at least one TMF domain in TMF ODA Manager
- Refresh the page to reload domain data

### **2. Debug Mode**

Enable debug logging by setting:

```bash
NODE_ENV=development
```

Check browser console for detailed error messages.

## Future Enhancements

### **1. Planned Features**

- **OAuth Integration**: Full OAuth 2.0 flow for production
- **Board Templates**: Pre-configured board layouts
- **Real-time Sync**: Live updates when data changes
- **Collaboration**: Multi-user board editing
- **Export Options**: Board export to various formats

### **2. Advanced Capabilities**

- **Custom Card Types**: Flexible card templates
- **Connector Lines**: Visual relationships between items
- **Comments & Annotations**: Interactive feedback system
- **Version Control**: Board versioning and history
- **Integration APIs**: Webhook support for external systems

## API Reference

### **1. MiroService Methods**

```typescript
// Board Creation
createBoard(config: MiroBoardConfig): Promise<{ id: string; viewLink: string }>
createTMFBoard(project: Project, domains: TMFOdaDomain[]): Promise<{ id: string; viewLink: string }>
createSpecSyncBoard(specSyncItems: SpecSyncItem[]): Promise<{ id: string; viewLink: string }>

// Board Management
getBoard(boardId: string): Promise<any>
deleteBoard(boardId: string): Promise<void>

// Authentication
authenticate(): Promise<boolean>
isReady(): boolean
```

### **2. Component Props**

```typescript
interface MiroBoardCreatorProps {
  project: Project;
  tmfDomains: TMFOdaDomain[];
  specSyncItems: SpecSyncItem[];
}
```

## Support

### **1. Documentation**

- **Miro API Docs**: https://developers.miro.com/
- **Component Documentation**: See component files for detailed usage
- **Type Definitions**: Check `src/types/index.ts` for interfaces

### **2. Development**

- **GitHub Issues**: Report bugs and feature requests
- **Code Review**: Follow project coding standards
- **Testing**: Ensure all features work with test data

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-27  
**Compatibility**: Miro API v1, Next.js 14, React 18
