# Miro OAuth Redirect URI Configuration Fix

## Problem
The Miro OAuth integration is failing with the error:
```
Invalid redirect_uri: "http://localhost:3002/api/auth/miro/callback" does not match any of the application registered values.
```

## Root Cause
The redirect URI in your Miro Developer Platform app configuration doesn't match the actual redirect URI being used by the application.

## Solution

### Step 1: Update Miro Developer Platform Settings

1. **Go to Miro Developer Platform**:
   - Navigate to [https://developers.miro.com/](https://developers.miro.com/)
   - Sign in to your account
   - Go to your app (Client ID: 3458764638511169275)

2. **Update OAuth Settings**:
   - Go to the "OAuth" or "App Settings" section
   - Find the "Redirect URIs" field
   - Add or update the redirect URI to: `http://localhost:3002/api/auth/miro/callback`
   - Make sure this is the ONLY redirect URI listed (or at least the first one)
   - Save the configuration

3. **Verify Scopes**:
   - Ensure the following scopes are enabled:
     - `boards:read`
     - `boards:write`
     - `boards:write:team` (optional but recommended)

### Step 2: Verify Application Configuration

The application is correctly configured to use:
- **Port**: 3002 (confirmed running)
- **Redirect URI**: `http://localhost:3002/api/auth/miro/callback`
- **Client ID**: 3458764638511169275
- **Scopes**: `boards:read`, `boards:write`

### Step 3: Test the OAuth Flow

1. **Clear Browser Cache**:
   - Clear cookies and local storage for localhost:3002
   - This ensures no stale OAuth state

2. **Test Authentication**:
   - Go to the Miro Configuration tab
   - Click "Connect to Miro"
   - Complete the OAuth flow
   - Verify successful redirect back to the application

### Step 4: Common Issues and Solutions

#### Issue: "Invalid redirect_uri" still appears
**Solution**: 
- Double-check the exact URI in Miro Developer Platform
- Ensure no trailing slashes or extra characters
- Wait 1-2 minutes for Miro's configuration to propagate

#### Issue: "Invalid client_id" error
**Solution**:
- Verify the Client ID in your Miro app settings
- Ensure the Client ID in the application matches exactly

#### Issue: "Invalid scope" error
**Solution**:
- Check that all required scopes are enabled in Miro Developer Platform
- Verify the scope string format: `boards:read boards:write`

### Step 5: Production Considerations

For production deployment, you'll need to:
1. Add your production domain's redirect URI to Miro
2. Update environment variables accordingly
3. Consider using HTTPS for security

## Verification

After completing these steps, the OAuth flow should work correctly:
1. Click "Connect to Miro" → Redirects to Miro authorization page
2. Authorize the application → Redirects back to `http://localhost:3002/api/auth/miro/callback`
3. Application processes the callback → Shows "Connected" status

## Debug Information

Current application configuration:
- **Server Port**: 3002
- **Redirect URI**: `http://localhost:3002/api/auth/miro/callback`
- **Client ID**: 3458764638511169275
- **Team ID**: 3458764638509871660

The application is correctly generating the OAuth URL with the right parameters. The issue is purely on the Miro Developer Platform side where the redirect URI needs to be registered.
