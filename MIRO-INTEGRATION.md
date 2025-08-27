# Miro Integration Guide

## Overview

This guide covers the integration of Miro boards with the E2E Delivery Management system for visual mapping of TMF domains and capabilities.

## Features

### 🎯 **Core Functionality**
- **TMF Architecture Boards**: Visual mapping of TMF domains and capabilities
- **SpecSync Requirements Boards**: Visual representation of imported requirements
- **Interactive Board Creation**: One-click board generation with proper layout
- **Board Management**: Easy access to created boards with direct links
- **OAuth 2.0 Authentication**: Secure authentication flow with Miro

### 🏗️ **Board Types**

#### **1. TMF Architecture Board**
- **Domain Frames**: Each TMF domain gets its own organizational frame
- **Capability Cards**: Individual capability cards within domain frames
- **Visual Hierarchy**: Clear organization with proper spacing and layout
- **Color Coding**: Different colors for different domain types
- **Interactive Elements**: Clickable cards with detailed information

#### **2. SpecSync Requirements Board**
- **Requirement Cards**: Individual cards for each SpecSync requirement
- **Domain Grouping**: Requirements organized by TMF domain
- **Function Categorization**: Visual grouping by function name
- **Metadata Display**: Shows requirement ID, domain, and function
- **Color-Coded Categories**: Different colors for different requirement types

## Setup Instructions

### **1. Environment Configuration**

Create a `.env.local` file in the project root with the following variables:

```bash
MIRO_CLIENT_ID=your_miro_client_id
MIRO_CLIENT_SECRET=your_miro_client_secret
MIRO_REDIRECT_URI=http://localhost:3002/api/auth/miro/callback
NEXT_PUBLIC_APP_NAME=E2E Delivery Management
NEXT_PUBLIC_VERSION=1.0.0
```

**Important Notes:**
- The `MIRO_REDIRECT_URI` should match your development server port (currently 3002)
- If your server runs on a different port, update the redirect URI accordingly
- The redirect URI must be registered in your Miro Developer Platform app settings

### **2. Miro Developer Platform Setup**

1. **Create a Miro App**:
   - Go to [Miro Developer Platform](https://developers.miro.com/)
   - Create a new app or use an existing one
   - Note your Client ID and Client Secret

2. **Configure OAuth Settings**:
   - Set the redirect URI to: `http://localhost:3002/api/auth/miro/callback`
   - Add required scopes: `boards:read`, `boards:write`, `boards:write:team`
   - Save the configuration

3. **Update Environment Variables**:
   - Copy your Client ID and Client Secret to `.env.local`
   - Ensure the redirect URI matches exactly

### **3. Application Usage**

#### **Authentication Flow**
1. Navigate to the "Visual Mapping" tab
2. Click "Connect to Miro" button
3. Complete OAuth authorization on Miro's website
4. Return to the application (automatic redirect)
5. Authentication status will show as "Connected"

#### **Creating Boards**
1. **TMF Architecture Board**:
   - Select TMF domains and capabilities
   - Click "Create TMF Architecture Board"
   - Board will be generated with domain frames and capability cards

2. **SpecSync Requirements Board**:
   - Import SpecSync data first
   - Click "Create SpecSync Requirements Board"
   - Board will be generated with requirement cards organized by domain

#### **Board Management**
- View created boards in the "Board Management" section
- Click "Open in Miro" to access boards directly
- Boards are automatically organized and styled

## Technical Implementation

### **OAuth 2.0 Flow**
- **Authorization Endpoint**: `/api/auth/miro`
- **Callback Handler**: `/api/auth/miro/callback`
- **Token Management**: Automatic token storage and refresh
- **Security**: Tokens stored in browser localStorage (development)

### **API Integration**
- **Miro API Client**: Uses `@mirohq/miro-api` package
- **Server-Side Operations**: All Miro API calls handled server-side
- **Error Handling**: Comprehensive error handling and user feedback
- **Rate Limiting**: Built-in rate limiting and retry logic

### **Component Architecture**
- **MiroBoardCreator**: Main UI component for board creation
- **MiroService**: Service layer for Miro API operations
- **MiroAuthService**: OAuth authentication and token management
- **API Routes**: Server-side handlers for Miro operations

## Troubleshooting

### **Common Issues**

1. **404 Error on OAuth Callback**:
   - Check that the redirect URI in `.env.local` matches your server port
   - Ensure the redirect URI is registered in Miro Developer Platform
   - Verify the callback route exists: `/api/auth/miro/callback`

2. **Authentication Failures**:
   - Verify Client ID and Client Secret are correct
   - Check that required scopes are configured in Miro
   - Ensure the app is properly configured in Miro Developer Platform

3. **Board Creation Errors**:
   - Verify authentication status
   - Check that data (TMF domains, SpecSync items) is available
   - Review server logs for detailed error messages

4. **Port Mismatch Issues**:
   - If your development server runs on a different port, update `MIRO_REDIRECT_URI`
   - Common ports: 3000, 3001, 3002 (check your server startup logs)
   - Update both `.env.local` and Miro Developer Platform settings

### **Development Notes**

- **Token Storage**: In development, tokens are stored in localStorage
- **Security**: For production, implement secure token storage (database/session)
- **Error Handling**: All errors are logged and displayed to users
- **Testing**: Test with small datasets before creating large boards

## Future Enhancements

### **Planned Features**
- **Board Templates**: Pre-defined board layouts and styles
- **Collaborative Editing**: Real-time collaboration features
- **Advanced Styling**: Custom themes and visual customization
- **Export Options**: Export boards to various formats
- **Integration APIs**: Additional third-party integrations

### **Production Considerations**
- **Secure Token Storage**: Database-based token management
- **User Sessions**: Proper session management and security
- **Rate Limiting**: Production-grade rate limiting
- **Monitoring**: Application performance monitoring
- **Backup**: Board data backup and recovery

## Support

For technical support or questions about the Miro integration:
- Check the troubleshooting section above
- Review server logs for detailed error information
- Verify Miro Developer Platform configuration
- Ensure environment variables are correctly set
