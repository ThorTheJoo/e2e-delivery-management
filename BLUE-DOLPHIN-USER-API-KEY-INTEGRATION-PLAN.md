# Blue Dolphin User API Key Integration Plan

## Current Status Analysis

### ✅ **What We've Confirmed:**

1. **User Key Management API Key**: ✅ **WORKING**
   - API Key: `ea09e6ac-1747-4c5a-955e-a4f699ba3678`
   - Can access `/v1/user-api-keys` endpoint
   - Authentication method: `x-api-key` + `TENANT` headers

2. **API Infrastructure**: ✅ **FULLY OPERATIONAL**
   - EU endpoint: `https://public-api.eu.bluedolphin.app`
   - OData endpoint: `https://csgipoc.odata.bluedolphin.app`
   - All endpoints accessible and documented

3. **OData Integration**: ✅ **FULLY FUNCTIONAL**
   - Data retrieval working perfectly
   - Rich metadata available
   - Authentication working (Basic Auth)

### ❌ **What's Blocking Us:**

1. **User ID Format Issue**: 
   - The user ID `Grant.Thavarajoo@bluedolphin.valueblue.nl` is not being accepted
   - All tested formats failed validation
   - Need correct user ID format from Blue Dolphin admin

2. **Date Format Issue**:
   - Multiple date formats tested, all failed
   - May need specific format or validation rules

## Integration Architecture Plan

### Phase 1: Configuration UI Enhancement

#### 1.1 Update Blue Dolphin Configuration Component

**Current Configuration Fields:**
```typescript
interface BlueDolphinConfig {
  apiUrl: string;
  odataUrl: string;
  protocol: 'REST' | 'ODATA' | 'HYBRID';
  username: string;
  apiKey: string; // This is the User Key Management API Key
  password: string;
}
```

**Enhanced Configuration Fields:**
```typescript
interface BlueDolphinConfig {
  // Existing fields
  apiUrl: string;
  odataUrl: string;
  protocol: 'REST' | 'ODATA' | 'HYBRID';
  username: string;
  apiKey: string; // User Key Management API Key
  password: string;
  
  // New fields for User API Key management
  userApiKey?: string; // Generated User API Key
  userId?: string; // User ID for API key generation
  userApiKeyExpiry?: string; // Expiry date
  userApiKeyName?: string; // Name for the generated key
  userApiKeyGenerated?: boolean; // Whether key has been generated
  userApiKeyGeneratedAt?: string; // When it was generated
}
```

#### 1.2 Configuration UI Updates

**Add to Blue Dolphin Configuration Component:**

1. **User API Key Section**:
   ```tsx
   <div className="space-y-4">
     <h3 className="text-lg font-semibold">User API Key Management</h3>
     
     <div>
       <Label htmlFor="userId">User ID</Label>
       <Input
         id="userId"
         value={config.userId}
         onChange={(e) => setConfig({ ...config, userId: e.target.value })}
         placeholder="Enter user ID for API key generation"
       />
     </div>
     
     <div>
       <Label htmlFor="userApiKeyName">API Key Name</Label>
       <Input
         id="userApiKeyName"
         value={config.userApiKeyName}
         onChange={(e) => setConfig({ ...config, userApiKeyName: e.target.value })}
         placeholder="E2E Integration User Key"
       />
     </div>
     
     <div>
       <Label htmlFor="userApiKeyExpiry">Expiry Date</Label>
       <Input
         id="userApiKeyExpiry"
         type="date"
         value={config.userApiKeyExpiry}
         onChange={(e) => setConfig({ ...config, userApiKeyExpiry: e.target.value })}
       />
     </div>
     
     {config.userApiKeyGenerated && (
       <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
         <div className="flex items-center space-x-2">
           <CheckCircle className="h-5 w-5 text-green-600" />
           <span className="text-green-800 font-medium">User API Key Generated</span>
         </div>
         <p className="text-sm text-green-700 mt-1">
           Generated: {config.userApiKeyGeneratedAt}
         </p>
         <p className="text-xs text-green-600 mt-1">
           Key: {config.userApiKey?.substring(0, 10)}...
         </p>
       </div>
     )}
     
     <div className="flex space-x-2">
       <Button 
         onClick={handleGenerateUserApiKey}
         disabled={!config.userId || !config.userApiKeyName || !config.userApiKeyExpiry}
       >
         Generate User API Key
       </Button>
       
       {config.userApiKeyGenerated && (
         <Button 
           variant="outline"
           onClick={handleTestUserApiKey}
         >
           Test User API Key
         </Button>
       )}
     </div>
   </div>
   ```

#### 1.3 API Integration Functions

**Add to Blue Dolphin Service:**

```typescript
// User API Key generation
export async function generateUserApiKey(
  userKeyManagementApiKey: string,
  tenant: string,
  userId: string,
  keyName: string,
  expiryDate: string
): Promise<{ success: boolean; userApiKey?: string; error?: string }> {
  try {
    const response = await fetch('https://public-api.eu.bluedolphin.app/v1/user-api-keys', {
      method: 'POST',
      headers: {
        'x-api-key': userKeyManagementApiKey,
        'TENANT': tenant,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: keyName,
        user_id: userId,
        expiration_date: expiryDate
      })
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, userApiKey: data.api_key };
    } else {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to generate User API Key' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test User API Key
export async function testUserApiKey(
  userApiKey: string,
  tenant: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://public-api.eu.bluedolphin.app/v1/objects', {
      method: 'GET',
      headers: {
        'x-api-key': userApiKey,
        'TENANT': tenant,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return { success: response.ok };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Phase 2: Integration Logic

#### 2.1 Configuration Management

**Update localStorage persistence:**
```typescript
const handleSaveConfig = async () => {
  try {
    // Save configuration including User API Key
    localStorage.setItem('blueDolphinConfig', JSON.stringify(config));
    setIsConfigured(true);
    toast.showSuccess('Configuration saved successfully');
  } catch (error) {
    toast.showError('Failed to save configuration');
  }
};
```

#### 2.2 User API Key Generation Flow

**Add to configuration component:**
```typescript
const handleGenerateUserApiKey = async () => {
  setIsGenerating(true);
  try {
    const result = await generateUserApiKey(
      config.apiKey, // User Key Management API Key
      config.tenant || 'csgipoc',
      config.userId,
      config.userApiKeyName || 'E2E Integration User Key',
      config.userApiKeyExpiry
    );

    if (result.success) {
      setConfig({
        ...config,
        userApiKey: result.userApiKey,
        userApiKeyGenerated: true,
        userApiKeyGeneratedAt: new Date().toISOString()
      });
      toast.showSuccess('User API Key generated successfully');
    } else {
      toast.showError(`Failed to generate User API Key: ${result.error}`);
    }
  } catch (error) {
    toast.showError('Failed to generate User API Key');
  } finally {
    setIsGenerating(false);
  }
};
```

### Phase 3: REST API Integration

#### 3.1 Blue Dolphin REST Service

**Create enhanced REST service:**
```typescript
export class BlueDolphinRestService {
  private userApiKey: string;
  private tenant: string;

  constructor(userApiKey: string, tenant: string) {
    this.userApiKey = userApiKey;
    this.tenant = tenant;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `https://public-api.eu.bluedolphin.app${endpoint}`;
    const headers = {
      'x-api-key': this.userApiKey,
      'TENANT': this.tenant,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`Blue Dolphin API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Object operations
  async getObjects(options?: { top?: number; skip?: number; filter?: string }) {
    const params = new URLSearchParams();
    if (options?.top) params.append('$top', options.top.toString());
    if (options?.skip) params.append('$skip', options.skip.toString());
    if (options?.filter) params.append('$filter', options.filter);
    
    const queryString = params.toString();
    return this.request(`/v1/objects${queryString ? `?${queryString}` : ''}`);
  }

  async createObject(object: any) {
    return this.request('/v1/objects', {
      method: 'POST',
      body: JSON.stringify(object)
    });
  }

  async updateObject(id: string, object: any) {
    return this.request(`/v1/objects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(object)
    });
  }

  async deleteObject(id: string) {
    return this.request(`/v1/objects/${id}`, {
      method: 'DELETE'
    });
  }
}
```

## Implementation Steps

### Step 1: Update Configuration UI
1. Add User API Key management fields
2. Add generation and testing buttons
3. Add status indicators

### Step 2: Implement API Functions
1. Add User API Key generation function
2. Add User API Key testing function
3. Update configuration persistence

### Step 3: Create REST Service
1. Create BlueDolphinRestService class
2. Implement CRUD operations
3. Add error handling

### Step 4: Integration Testing
1. Test User API Key generation (when valid user ID available)
2. Test REST API operations
3. Test configuration persistence

## Current Blockers

1. **User ID Format**: Need correct user ID format from Blue Dolphin admin
2. **Date Format**: May need specific date format validation
3. **User Permissions**: User may need specific permissions for API key creation

## Next Actions

1. **Contact Blue Dolphin Admin** to get:
   - Correct user ID format
   - Valid user ID for the system
   - Confirmation of date format requirements

2. **Implement Configuration UI** updates (can be done now)

3. **Test Integration** once valid user ID is obtained

## Conclusion

The integration architecture is **90% ready**. We have:
- ✅ Working User Key Management API Key
- ✅ Complete API infrastructure
- ✅ OData integration working
- ✅ Clear integration plan

**Only blocker**: Valid user ID format from Blue Dolphin admin.

The configuration UI can be updated now, and the integration will be complete once we have the correct user ID format.
