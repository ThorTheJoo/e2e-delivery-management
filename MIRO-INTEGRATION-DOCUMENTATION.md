# Miro Integration Documentation

## Overview
This document provides comprehensive documentation for the Miro integration in the E2E Delivery Management application. The integration enables visual mapping of TMF domains, capabilities, and SpecSync requirements through Miro boards.

## Architecture Overview

### Data Flow
```
UI Configuration → localStorage → Server Config API → Global Variable → Miro OAuth → Access Token → Miro API Calls
```

### Key Components
1. **MiroConfiguration Component** - UI for OAuth credentials
2. **MiroConfigService** - Client-side configuration management
3. **MiroAuthService** - OAuth flow and token management
4. **MiroService** - High-level Miro API operations
5. **Server Config API** - Bridge between client and server configuration
6. **OAuth Routes** - Miro authentication endpoints

## Configuration Flow

### 1. Client-Side Configuration Storage
- **Location**: `localStorage.miroConfig`
- **Structure**:
```json
{
  "clientId": "your_miro_client_id",
  "clientSecret": "your_miro_client_secret", 
  "redirectUri": "http://localhost:3000/api/auth/miro/callback",
  "scopes": ["boards:read", "boards:write"]
}
```

### 2. Server-Side Configuration Sync
- **Endpoint**: `/api/miro/config` (POST)
- **Purpose**: Syncs client configuration to server-side global variable
- **Storage**: `(global as any).miroConfig`
- **Usage**: OAuth routes read from this global variable

### 3. OAuth Flow
1. **Initiation**: User clicks "Connect to Miro"
2. **Redirect**: Browser redirects to Miro OAuth
3. **Authorization**: User authorizes application
4. **Callback**: Miro redirects back with authorization code
5. **Token Exchange**: Server exchanges code for access token
6. **Storage**: Access token stored in `localStorage.miro_access_token`

### 4. API Operations
- **Authentication**: `Authorization: Bearer {access_token}` header
- **Board Creation**: Creates boards with validated names (60 char limit)
- **Content Creation**: Frames, cards, and shapes for visual mapping

## Critical Implementation Details

### Configuration Validation
```typescript
// Board name validation in MiroService.createBoard()
const maxNameLength = 60;
let boardName = config.name;

// Validate board name
if (!boardName || typeof boardName !== 'string' || boardName.trim() === '') {
  throw new Error('Board name is required and must be a non-empty string');
}

// Trim whitespace
boardName = boardName.trim();

// Check length limit
if (boardName.length > maxNameLength) {
  boardName = boardName.substring(0, maxNameLength - 3) + '...';
}
```

### Server-Side Configuration Bridge
```typescript
// /api/miro/config route
export async function POST(request: NextRequest) {
  const { config } = await request.json();
  
  // Store in global variable for server-side access
  (global as any).miroConfig = {
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
    scopes: config.scopes
  };
}
```

### OAuth Route Configuration
```typescript
// /api/auth/miro/route.ts and /api/auth/miro/callback/route.ts
const serverConfig = (global as any).miroConfig;

if (!serverConfig) {
  throw new Error('Miro configuration missing - Please configure Miro integration first');
}

const { clientId, clientSecret, redirectUri, scopes } = serverConfig;
```

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. "Miro configuration missing" Error
**Symptoms**: OAuth routes fail with configuration missing error
**Root Cause**: Server-side global configuration not set
**Solution**: 
1. Ensure configuration is saved in UI
2. Check `/api/miro/config` endpoint is working
3. Verify server has received configuration

#### 2. "Invalid parameters" - Board Name Size Error
**Symptoms**: Board creation fails with size validation error
**Root Cause**: Board name exceeds 60 characters or contains invalid characters
**Solution**: 
1. Check project name length
2. Verify board name validation is working
3. Check for special characters in project names

#### 3. "secretKeyNotFound" Error
**Symptoms**: Token exchange fails with secret not found
**Root Cause**: Client secret not properly configured
**Solution**:
1. Verify client secret in Miro Developer Platform
2. Check configuration is properly saved
3. Ensure server has received the configuration

#### 4. Authentication State Mismatch
**Symptoms**: UI shows authenticated but API calls fail
**Root Cause**: Token expired or invalid
**Solution**:
1. Check token expiration
2. Re-authenticate with Miro
3. Verify token storage in localStorage

### Debug Commands

#### Check Client Configuration
```javascript
// In browser console
console.log('Miro Config:', localStorage.getItem('miroConfig'));
console.log('Access Token:', localStorage.getItem('miro_access_token'));
```

#### Check Server Configuration
```bash
# GET /api/miro/config
curl http://localhost:3000/api/miro/config
```

#### Check Environment Variables
```bash
# GET /api/debug/env
curl http://localhost:3000/api/debug/env
```

## Security Considerations

### OAuth Security
- **Client Secret**: Never exposed in client-side code
- **Redirect URI**: Must exactly match Miro app configuration
- **Scopes**: Limited to necessary permissions (boards:read, boards:write)

### Token Management
- **Storage**: Access tokens stored in localStorage (consider httpOnly cookies for production)
- **Expiration**: Tokens have expiration times
- **Refresh**: Implement token refresh logic for production

### Configuration Security
- **Validation**: All configuration inputs validated
- **Sanitization**: Board names sanitized and truncated
- **Error Handling**: No sensitive information in error messages

## Performance Optimizations

### Board Creation
- **Reuse**: Test boards are reused when possible
- **Batch Operations**: Multiple API calls for complex boards
- **Error Handling**: Continue processing on individual failures

### Authentication
- **Caching**: Authentication status cached and checked periodically
- **Lazy Loading**: OAuth flow only initiated when needed
- **State Management**: Efficient state updates and UI synchronization

## Testing and Validation

### Integration Tests
1. **Configuration Flow**: Save config → sync to server → verify global variable
2. **OAuth Flow**: Initiate → authorize → callback → token storage
3. **Board Creation**: TMF boards, SpecSync boards, error handling
4. **Error Scenarios**: Invalid config, expired tokens, API failures

### Manual Testing Checklist
- [ ] Configuration saves to localStorage
- [ ] Configuration syncs to server
- [ ] OAuth flow completes successfully
- [ ] Access token stored correctly
- [ ] Board creation works for both types
- [ ] Error handling works properly
- [ ] Authentication state updates correctly

## Lessons Learned

### Critical Success Factors
1. **Configuration Bridge**: Client-side localStorage must sync to server-side global variables
2. **Validation**: Board names must be validated for length and content
3. **Error Handling**: Comprehensive error handling prevents silent failures
4. **State Management**: Authentication state must be consistent across components

### Common Pitfalls
1. **Environment Variables**: Don't rely on .env.local for dynamic configuration
2. **Token Persistence**: Ensure tokens are properly stored and retrieved
3. **Configuration Sync**: Server must have access to client configuration
4. **Validation**: Always validate inputs before sending to external APIs

### Best Practices
1. **Documentation**: Maintain comprehensive documentation for complex integrations
2. **Debugging**: Include extensive logging for troubleshooting
3. **Error Messages**: Provide clear, actionable error messages
4. **Testing**: Test all error scenarios and edge cases

## Future Enhancements

### Planned Improvements
1. **Token Refresh**: Implement automatic token refresh
2. **Secure Storage**: Move tokens to httpOnly cookies
3. **Configuration Validation**: Enhanced validation and error handling
4. **Performance**: Optimize board creation and content generation

### Monitoring and Alerting
1. **Token Expiration**: Alert users before token expiration
2. **API Failures**: Monitor and alert on Miro API failures
3. **Configuration Issues**: Detect and report configuration problems
4. **Usage Metrics**: Track board creation and usage patterns

## Support and Maintenance

### Regular Maintenance Tasks
1. **Token Validation**: Check token validity and expiration
2. **Configuration Review**: Verify configuration is current and valid
3. **Error Monitoring**: Review error logs and address issues
4. **Performance Review**: Monitor API response times and optimize

### Emergency Procedures
1. **Configuration Reset**: Clear and reconfigure if issues persist
2. **Token Refresh**: Force re-authentication if tokens are invalid
3. **Fallback Mode**: Disable Miro integration if critical issues occur
4. **Rollback**: Revert to previous working configuration if needed

---

**Last Updated**: December 2024
**Version**: 1.0
**Maintainer**: Development Team
**Review Cycle**: Monthly
