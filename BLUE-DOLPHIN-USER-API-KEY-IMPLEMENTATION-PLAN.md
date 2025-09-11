# Blue Dolphin User API Key Integration - Complete Implementation Plan

## 🎯 **Overview**

This implementation plan provides complete details for integrating Blue Dolphin User API Key functionality into a fresh branch. The integration enables full CRUD operations with Blue Dolphin's REST API, overcoming the 401 authentication errors previously encountered.

## 📋 **Prerequisites & Current Status**

### **What's Already Working:**
- ✅ OData integration (read-only operations)
- ✅ Basic Blue Dolphin configuration UI
- ✅ User Key Management API Key: `ea09e6ac-1747-4c5a-955e-a4f699ba3678`
- ✅ Tenant: `csgipoc`
- ✅ EU Endpoint: `https://public-api.eu.bluedolphin.app`

### **What We're Adding:**
- 🔄 User API Key generation process
- 🔄 Enhanced configuration UI
- 🔄 Blue Dolphin REST Service for CRUD operations
- 🔄 Workspace and Object Type management

## 🏗️ **Implementation Architecture**

### **1. Enhanced Configuration Interface**

#### **Updated Blue Dolphin Configuration Types:**
```typescript
// src/types/blue-dolphin.ts
export interface BlueDolphinConfig {
  // Existing fields
  apiUrl: string;
  odataUrl: string;
  protocol: 'REST' | 'ODATA' | 'HYBRID';
  username: string;
  apiKey: string; // User Key Management API Key
  password: string;
  
  // New User API Key fields
  userApiKey?: string; // Generated User API Key
  userId?: string; // User ID for API key generation
  userApiKeyExpiry?: string; // Expiry date (YYYY-MM-DD format)
  userApiKeyName?: string; // Name for the generated key
  userApiKeyGenerated?: boolean; // Whether key has been generated
  userApiKeyGeneratedAt?: string; // When it was generated
  
  // New workspace and object type fields
  workspaceId?: string; // Workspace ID for operations
  objectTypeId?: string; // Object type ID for operations
}

export interface UserApiKeyGenerationRequest {
  name: string;
  user_id: string;
  expiration_date: string; // YYYY-MM-DD format
}

export interface UserApiKeyGenerationResponse {
  id: string;
  key: string;
}
```

### **2. Enhanced Configuration UI Component**

#### **File: `src/components/blue-dolphin-configuration.tsx`**

**Key Features to Add:**
1. **User API Key Management Section**
2. **Workspace Configuration Section**
3. **Object Type Configuration Section**
4. **Generate User API Key Button**
5. **Test User API Key Button**
6. **Status Indicators**

**UI Structure:**
```tsx
// Add these sections to the existing configuration component:

// 1. User API Key Management Section
<div className="space-y-4">
  <h3 className="text-lg font-semibold">User API Key Management</h3>
  
  {/* User ID Input */}
  <div>
    <label>User ID (UUID format)</label>
    <input 
      value={config.userId || ''} 
      onChange={(e) => updateConfig('userId', e.target.value)}
      placeholder="e.g., 68627d4e8b0ee343e2d1c795"
    />
  </div>
  
  {/* API Key Name Input */}
  <div>
    <label>API Key Name</label>
    <input 
      value={config.userApiKeyName || ''} 
      onChange={(e) => updateConfig('userApiKeyName', e.target.value)}
      placeholder="e.g., E2E Integration Key"
    />
  </div>
  
  {/* Expiry Date Input */}
  <div>
    <label>Expiry Date (YYYY-MM-DD)</label>
    <input 
      type="date"
      value={config.userApiKeyExpiry || ''} 
      onChange={(e) => updateConfig('userApiKeyExpiry', e.target.value)}
    />
  </div>
  
  {/* Generate Button */}
  <Button 
    onClick={handleGenerateUserApiKey}
    disabled={!canGenerateUserApiKey}
  >
    Generate User API Key
  </Button>
  
  {/* Status Display */}
  {config.userApiKeyGenerated && (
    <div className="p-3 bg-green-50 border border-green-200 rounded">
      <p className="text-green-800">✅ User API Key Generated</p>
      <p className="text-sm text-green-600">
        Generated: {config.userApiKeyGeneratedAt}
      </p>
    </div>
  )}
</div>

// 2. Workspace Configuration Section
<div className="space-y-4">
  <h3 className="text-lg font-semibold">Workspace Configuration</h3>
  
  <div>
    <label>Workspace ID</label>
    <input 
      value={config.workspaceId || ''} 
      onChange={(e) => updateConfig('workspaceId', e.target.value)}
      placeholder="e.g., default, main, or specific workspace ID"
    />
  </div>
  
  <Button onClick={handleTestWorkspace}>
    Test Workspace
  </Button>
</div>

// 3. Object Type Configuration Section
<div className="space-y-4">
  <h3 className="text-lg font-semibold">Object Type Configuration</h3>
  
  <div>
    <label>Object Type ID</label>
    <input 
      value={config.objectTypeId || ''} 
      onChange={(e) => updateConfig('objectTypeId', e.target.value)}
      placeholder="e.g., 1, 2, or specific object type ID"
    />
  </div>
  
  <Button onClick={handleTestObjectType}>
    Test Object Type
  </Button>
</div>
```

### **3. Blue Dolphin REST Service Implementation**

#### **File: `src/lib/blue-dolphin-service.ts`**

**Enhanced BlueDolphinRestService Class:**
```typescript
export class BlueDolphinRestService {
  private userApiKey: string;
  private tenant: string;
  private workspaceId: string;
  private objectTypeId: string;
  private apiUrl: string;

  constructor(config: BlueDolphinConfig) {
    this.userApiKey = config.userApiKey || '';
    this.tenant = 'csgipoc';
    this.workspaceId = config.workspaceId || '';
    this.objectTypeId = config.objectTypeId || '';
    this.apiUrl = config.apiUrl;
  }

  // User API Key Generation
  async generateUserApiKey(
    userKeyManagementApiKey: string,
    userId: string,
    keyName: string,
    expiryDate: string
  ): Promise<{ success: boolean; userApiKey?: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/v1/user-api-keys`, {
        method: 'POST',
        headers: {
          'x-api-key': userKeyManagementApiKey,
          'TENANT': this.tenant,
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
        return { success: true, userApiKey: data.key };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.errors || 'Unknown error' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Test User API Key
  async testUserApiKey(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/v1/objects?workspace_id=${this.workspaceId}`, {
        method: 'GET',
        headers: {
          'x-api-key': this.userApiKey,
          'TENANT': this.tenant,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return { success: response.ok, error: response.ok ? undefined : 'Authentication failed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // CRUD Operations
  async getObjects(options?: any): Promise<any[]> {
    const params = new URLSearchParams({
      workspace_id: this.workspaceId,
      ...options
    });

    const response = await fetch(`${this.apiUrl}/v1/objects?${params}`, {
      method: 'GET',
      headers: {
        'x-api-key': this.userApiKey,
        'TENANT': this.tenant,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch objects: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value || data.data || [];
  }

  async createObject(object: any): Promise<any> {
    const response = await fetch(`${this.apiUrl}/v1/objects`, {
      method: 'POST',
      headers: {
        'x-api-key': this.userApiKey,
        'TENANT': this.tenant,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        object_title: object.title || object.name,
        object_type_id: this.objectTypeId,
        workspace_id: this.workspaceId,
        description: object.description,
        definition: object.definition || 'Application Component',
        ...object
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create object: ${errorData.errors || response.statusText}`);
    }

    return await response.json();
  }

  async updateObject(id: string, object: any): Promise<any> {
    const response = await fetch(`${this.apiUrl}/v1/objects/${id}`, {
      method: 'PUT',
      headers: {
        'x-api-key': this.userApiKey,
        'TENANT': this.tenant,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(object)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to update object: ${errorData.errors || response.statusText}`);
    }

    return await response.json();
  }

  async deleteObject(id: string): Promise<boolean> {
    const response = await fetch(`${this.apiUrl}/v1/objects/${id}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': this.userApiKey,
        'TENANT': this.tenant,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return response.ok;
  }

  // Domain Operations
  async createDomain(domain: any): Promise<any> {
    const response = await fetch(`${this.apiUrl}/v1/domains`, {
      method: 'POST',
      headers: {
        'x-api-key': this.userApiKey,
        'TENANT': this.tenant,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        ...domain,
        workspace_id: this.workspaceId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create domain: ${errorData.errors || response.statusText}`);
    }

    return await response.json();
  }

  async createCapability(capability: any): Promise<any> {
    const response = await fetch(`${this.apiUrl}/v1/capabilities`, {
      method: 'POST',
      headers: {
        'x-api-key': this.userApiKey,
        'TENANT': this.tenant,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        ...capability,
        workspace_id: this.workspaceId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create capability: ${errorData.errors || response.statusText}`);
    }

    return await response.json();
  }

  async createRequirement(requirement: any): Promise<any> {
    const response = await fetch(`${this.apiUrl}/v1/requirements`, {
      method: 'POST',
      headers: {
        'x-api-key': this.userApiKey,
        'TENANT': this.tenant,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        ...requirement,
        workspace_id: this.workspaceId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create requirement: ${errorData.errors || response.statusText}`);
    }

    return await response.json();
  }
}
```

### **4. API Route Enhancement**

#### **File: `src/app/api/blue-dolphin/route.ts`**

**Add these new actions:**
```typescript
// Add to existing route handler
case 'generate-user-api-key':
  const { userKeyManagementApiKey, userId, keyName, expiryDate } = body;
  
  if (!userKeyManagementApiKey || !userId || !keyName || !expiryDate) {
    return NextResponse.json(
      { success: false, error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  try {
    const service = new BlueDolphinRestService(config);
    const result = await service.generateUserApiKey(
      userKeyManagementApiKey,
      userId,
      keyName,
      expiryDate
    );
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );

case 'test-user-api-key':
  if (!config.userApiKey) {
    return NextResponse.json(
      { success: false, error: 'User API Key not configured' },
      { status: 400 }
    );
  }

  try {
    const service = new BlueDolphinRestService(config);
    const result = await service.testUserApiKey();
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );

case 'test-workspace':
  const { workspaceId } = body;
  
  if (!config.userApiKey || !workspaceId) {
    return NextResponse.json(
      { success: false, error: 'User API Key and Workspace ID required' },
      { status: 400 }
    );
  }

  try {
    const service = new BlueDolphinRestService({ ...config, workspaceId });
    const result = await service.testUserApiKey();
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );

case 'test-object-type':
  const { objectTypeId } = body;
  
  if (!config.userApiKey || !objectTypeId) {
    return NextResponse.json(
      { success: false, error: 'User API Key and Object Type ID required' },
      { status: 400 }
    );
  }

  try {
    const service = new BlueDolphinRestService({ ...config, objectTypeId });
    const result = await service.testUserApiKey();
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
```

### **5. Configuration UI Event Handlers**

#### **Add these methods to the configuration component:**

```typescript
// User API Key Generation
const handleGenerateUserApiKey = async () => {
  if (!config.apiKey || !config.userId || !config.userApiKeyName || !config.userApiKeyExpiry) {
    alert('Please fill in all required fields');
    return;
  }

  setLoading(true);
  try {
    const response = await fetch('/api/blue-dolphin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate-user-api-key',
        userKeyManagementApiKey: config.apiKey,
        userId: config.userId,
        keyName: config.userApiKeyName,
        expiryDate: config.userApiKeyExpiry
      })
    });

    const result = await response.json();
    
    if (result.success) {
      updateConfig('userApiKey', result.userApiKey);
      updateConfig('userApiKeyGenerated', true);
      updateConfig('userApiKeyGeneratedAt', new Date().toISOString());
      alert('User API Key generated successfully!');
    } else {
      alert(`Failed to generate User API Key: ${result.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

// Test User API Key
const handleTestUserApiKey = async () => {
  if (!config.userApiKey) {
    alert('Please generate a User API Key first');
    return;
  }

  setLoading(true);
  try {
    const response = await fetch('/api/blue-dolphin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test-user-api-key'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      alert('User API Key test successful!');
    } else {
      alert(`User API Key test failed: ${result.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

// Test Workspace
const handleTestWorkspace = async () => {
  if (!config.userApiKey || !config.workspaceId) {
    alert('Please configure User API Key and Workspace ID first');
    return;
  }

  setLoading(true);
  try {
    const response = await fetch('/api/blue-dolphin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test-workspace',
        workspaceId: config.workspaceId
      })
    });

    const result = await response.json();
    
    if (result.success) {
      alert('Workspace test successful!');
    } else {
      alert(`Workspace test failed: ${result.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

// Test Object Type
const handleTestObjectType = async () => {
  if (!config.userApiKey || !config.objectTypeId) {
    alert('Please configure User API Key and Object Type ID first');
    return;
  }

  setLoading(true);
  try {
    const response = await fetch('/api/blue-dolphin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test-object-type',
        objectTypeId: config.objectTypeId
      })
    });

    const result = await response.json();
    
    if (result.success) {
      alert('Object Type test successful!');
    } else {
      alert(`Object Type test failed: ${result.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

// Validation helpers
const canGenerateUserApiKey = config.apiKey && config.userId && config.userApiKeyName && config.userApiKeyExpiry;
```

## 🔧 **Implementation Steps**

### **Step 1: Update Type Definitions**
1. Add new interfaces to `src/types/blue-dolphin.ts`
2. Update existing `BlueDolphinConfig` interface

### **Step 2: Enhance Configuration UI**
1. Add User API Key Management section
2. Add Workspace Configuration section
3. Add Object Type Configuration section
4. Add event handlers for all new functionality

### **Step 3: Implement REST Service**
1. Add `generateUserApiKey` method
2. Add `testUserApiKey` method
3. Add CRUD operations with proper parameters
4. Add domain/capability/requirement operations

### **Step 4: Update API Routes**
1. Add `generate-user-api-key` action
2. Add `test-user-api-key` action
3. Add `test-workspace` action
4. Add `test-object-type` action

### **Step 5: Test Integration**
1. Test User API Key generation
2. Test workspace configuration
3. Test object type configuration
4. Test CRUD operations

## 📊 **Known Working Values**

### **User API Key Generation:**
- **User ID Format**: `68627d4e8b0ee343e2d1c795` (UUID format)
- **Date Format**: `2026-09-09` (YYYY-MM-DD format)
- **User Key Management API Key**: `ea09e6ac-1747-4c5a-955e-a4f699ba3678`
- **Tenant**: `csgipoc`

### **API Endpoints:**
- **User API Key Generation**: `POST /v1/user-api-keys`
- **Objects**: `GET /v1/objects?workspace_id={id}`
- **Domains**: `GET /v1/domains`
- **Capabilities**: `GET /v1/capabilities`
- **Requirements**: `GET /v1/requirements`

## ⚠️ **Required Discovery**

### **Still Need to Determine:**
1. **Valid workspace_id values** for the `csgipoc` tenant
2. **Valid object_type_id values** for different object types
3. **Object creation field requirements** and mappings

### **Discovery Methods:**
1. Use existing OData integration to query workspaces and object types
2. Check Blue Dolphin API documentation
3. Contact Blue Dolphin administrator for valid IDs

## 🎯 **Expected Outcome**

After implementing this plan:
- ✅ User API Key generation will work
- ✅ Configuration UI will be enhanced
- ✅ REST API authentication will work
- ⚠️ CRUD operations will work once workspace_id and object_type_id are discovered

## 🚀 **Next Phase**

Once this implementation is complete:
1. **Discover workspace_id** values using OData queries
2. **Discover object_type_id** values using OData queries
3. **Test complete CRUD operations** with valid parameters
4. **Implement full integration** with the application

## 📝 **Testing Checklist**

### **Phase 1: Basic Integration**
- [ ] User API Key generation works
- [ ] Configuration UI displays correctly
- [ ] Test buttons function properly
- [ ] Error handling works

### **Phase 2: Workspace Discovery**
- [ ] OData queries return workspace information
- [ ] Workspace IDs are identified
- [ ] Workspace testing works

### **Phase 3: Object Type Discovery**
- [ ] OData queries return object type information
- [ ] Object type IDs are identified
- [ ] Object type testing works

### **Phase 4: Full CRUD Operations**
- [ ] CREATE operations work
- [ ] READ operations work
- [ ] UPDATE operations work
- [ ] DELETE operations work

## 🔗 **Related Files**

- `src/types/blue-dolphin.ts` - Type definitions
- `src/components/blue-dolphin-configuration.tsx` - Configuration UI
- `src/lib/blue-dolphin-service.ts` - REST service implementation
- `src/app/api/blue-dolphin/route.ts` - API routes
- `src/components/blue-dolphin-integration.tsx` - Integration component

This plan provides everything needed to implement the Blue Dolphin User API Key functionality in a fresh branch!
