'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Server, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface BlueDolphinConfig {
  apiUrl: string;
  odataUrl: string;
  protocol: 'REST' | 'ODATA' | 'HYBRID';
  username: string;
  apiKey: string; // User Key Management API Key
  password: string;
  
  // User API Key fields
  userApiKey?: string; // Generated User API Key
  userId?: string; // User ID for API key generation
  userApiKeyExpiry?: string; // Expiry date (YYYY-MM-DD format)
  userApiKeyName?: string; // Name for the generated key
  userApiKeyGenerated?: boolean; // Whether key has been generated
  userApiKeyGeneratedAt?: string; // When it was generated
  
  // Workspace and object type fields
  workspaceId?: string; // Workspace ID for operations
  objectTypeId?: string; // Object type ID for operations
}

export function BlueDolphinConfiguration() {
  const [config, setConfig] = useState<BlueDolphinConfig>({
    apiUrl: 'https://public-api.eu.bluedolphin.app',
    odataUrl: 'https://csgipoc.odata.bluedolphin.app',
    protocol: 'HYBRID',
    username: 'csgipoc',
    apiKey: 'f49253d1-32c7-492a-b022-64caab216d49', // User Key Management API Key
    password: 'ef498b94-732b-46c8-a24c-65fbd27c1482',
    // User API Key fields
    userApiKey: '',
    userId: '68627d4e8b0ee343e2d1c795', // Pre-populate with your User ID
    userApiKeyExpiry: '',
    userApiKeyName: '',
    userApiKeyGenerated: false,
    userApiKeyGeneratedAt: '',
    // Workspace and object type fields
    workspaceId: '',
    objectTypeId: '',
  });

  const [isTested, setIsTested] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [existingApiKeys, setExistingApiKeys] = useState<any[]>([]);

  const toast = useToast();

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      // Save configuration to localStorage or API
      localStorage.setItem('blueDolphinConfig', JSON.stringify(config));
      setIsConfigured(true);
      toast.showSuccess('Configuration saved successfully');
    } catch (error) {
      toast.showError('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test-connection',
          config: config,
        }),
      });

      if (response.ok) {
        setIsTested(true);
        toast.showSuccess('Connection test successful');
      } else {
        toast.showError('Connection test failed');
      }
    } catch (error) {
      toast.showError('Connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const loadSavedConfig = () => {
    const saved = localStorage.getItem('blueDolphinConfig');
    if (saved) {
      const savedConfig = JSON.parse(saved);
      // Ensure required fields are present and preserve OData functionality
      setConfig(prev => ({
        ...prev,
        ...savedConfig,
        // Always ensure API URL is set for REST operations
        apiUrl: savedConfig.apiUrl || 'https://public-api.eu.bluedolphin.app',
        // Preserve OData URL for OData operations
        odataUrl: savedConfig.odataUrl || 'https://csgipoc.odata.bluedolphin.app',
        // Default to HYBRID to support both REST and OData
        protocol: savedConfig.protocol || 'HYBRID',
        username: savedConfig.username || 'csgipoc',
        // Use the correct API key from your Blue Dolphin configuration
        apiKey: savedConfig.apiKey || 'f49253d1-32c7-492a-b022-64caab216d49',
        password: savedConfig.password || 'ef498b94-732b-46c8-a24c-65fbd27c1482'
      }));
    }
  };

  // Retrieve Existing User API Keys
  const handleRetrieveUserApiKeys = async () => {
    if (!config.apiKey || !config.userId) {
      toast.showError('Please configure API Key and User ID first');
      return;
    }

    console.log('🔍 Retrieving existing User API Keys...');
    setIsRetrieving(true);
    try {
      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'retrieve-user-api-keys',
          userKeyManagementApiKey: config.apiKey,
          userId: config.userId,
          config: config
        })
      });

      const result = await response.json();
      console.log('📥 Retrieved API Keys:', result);
      
      if (result.success) {
        setExistingApiKeys(result.apiKeys || []);
        toast.showSuccess(`Retrieved ${result.apiKeys?.length || 0} existing API keys`);
      } else {
        toast.showError('Failed to retrieve API keys', JSON.stringify(result.error));
      }
    } catch (error) {
      console.error('💥 Error retrieving API keys:', error);
      toast.showError('Error retrieving API keys', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRetrieving(false);
    }
  };

  // User API Key Generation
  const handleGenerateUserApiKey = async () => {
    console.log('🔧 Generate User API Key clicked');
    console.log('Config:', config);
    
    if (!config.apiKey || !config.userId || !config.userApiKeyName || !config.userApiKeyExpiry) {
      console.log('❌ Missing required fields');
      toast.showError('Please fill in all required fields');
      return;
    }

    console.log('✅ All fields present, starting generation...');
    setIsGenerating(true);
    try {
      const requestData = {
        action: 'generate-user-api-key',
        userKeyManagementApiKey: config.apiKey,
        userId: config.userId,
        keyName: config.userApiKeyName,
        expiryDate: config.userApiKeyExpiry,
        config: config
      };
      
      console.log('📤 Sending request:', requestData);
      
      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      console.log('📥 Response status:', response.status);
      const result = await response.json();
      console.log('📥 Response data:', result);
      
      if (result.success) {
        console.log('✅ Success! Updating config with new API key');
        const updatedConfig = {
          ...config,
          userApiKey: result.userApiKey,
          userApiKeyGenerated: true,
          userApiKeyGeneratedAt: new Date().toISOString()
        };
        setConfig(updatedConfig);
        
        // Save to localStorage
        localStorage.setItem('blueDolphinConfig', JSON.stringify(updatedConfig));
        
        // Refresh existing API keys list
        await handleRetrieveUserApiKeys();
        
        toast.showSuccess('User API Key generated successfully!');
      } else {
        console.log('❌ Failed:', result.error);
        toast.showError('Failed to generate User API Key', JSON.stringify(result.error));
      }
    } catch (error) {
      console.error('💥 Error:', error);
      toast.showError('Error generating User API Key', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Select Existing User API Key
  const handleSelectApiKey = (apiKey: string) => {
    const updatedConfig = {
      ...config,
      userApiKey: apiKey,
      userApiKeyGenerated: true,
      userApiKeyGeneratedAt: new Date().toISOString()
    };
    setConfig(updatedConfig);
    
    // Save to localStorage
    localStorage.setItem('blueDolphinConfig', JSON.stringify(updatedConfig));
    
    toast.showSuccess('User API Key selected successfully!');
  };

  // Test User API Key
  const handleTestUserApiKey = async () => {
    if (!config.userApiKey) {
      toast.showError('Please generate a User API Key first');
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-user-api-key',
          config: config
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.showSuccess('User API Key test successful!');
      } else {
        toast.showError(`User API Key test failed: ${result.error}`);
      }
    } catch (error) {
      toast.showError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Test Workspace
  const handleTestWorkspace = async () => {
    if (!config.userApiKey || !config.workspaceId) {
      toast.showError('Please configure User API Key and Workspace ID first');
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-workspace',
          config: config,
          workspaceId: config.workspaceId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.showSuccess('Workspace test successful!');
      } else {
        toast.showError(`Workspace test failed: ${result.error}`);
      }
    } catch (error) {
      toast.showError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Test Object Type
  const handleTestObjectType = async () => {
    if (!config.userApiKey || !config.objectTypeId) {
      toast.showError('Please configure User API Key and Object Type ID first');
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-object-type',
          config: config,
          objectTypeId: config.objectTypeId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.showSuccess('Object Type test successful!');
      } else {
        toast.showError(`Object Type test failed: ${result.error}`);
      }
    } catch (error) {
      toast.showError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Validation helpers
  const canGenerateUserApiKey = config.apiKey && config.userId && config.userApiKeyName && config.userApiKeyExpiry;

  useEffect(() => {
    loadSavedConfig();
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Blue Dolphin Configuration</h2>
        <p className="text-gray-600">
          Configure connection settings for Blue Dolphin integration. Set up API endpoints,
          authentication, and protocol preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-blue-200 bg-blue-100">
                <Server className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <CardTitle className="text-base">Blue Dolphin Configuration</CardTitle>
                <CardDescription>
                  Configure connection settings for Blue Dolphin integration
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={isTested ? 'default' : 'secondary'}>
                {isTested ? 'Tested' : 'Not Tested'}
              </Badge>
              <Badge variant={isConfigured ? 'default' : 'secondary'}>
                {isConfigured ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiUrl">API URL</Label>
                <Input
                  id="apiUrl"
                  value={config.apiUrl}
                  onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                  placeholder="https://public-api.eu.bluedolphin.app"
                />
              </div>

              <div>
                <Label htmlFor="odataUrl">OData URL</Label>
                <Input
                  id="odataUrl"
                  value={config.odataUrl}
                  onChange={(e) => setConfig({ ...config, odataUrl: e.target.value })}
                  placeholder="https://csgipoc.odata.bluedolphin.app"
                />
              </div>

              <div>
                <Label htmlFor="protocol">Protocol</Label>
                <Select
                  value={config.protocol}
                  onValueChange={(value: 'REST' | 'ODATA') =>
                    setConfig({ ...config, protocol: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REST">REST</SelectItem>
                    <SelectItem value="ODATA">OData</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="apiKey">API Key (Optional)</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="Enter API key"
                />
              </div>

              <div>
                <Label htmlFor="username">Username (Alternative)</Label>
                <Input
                  id="username"
                  value={config.username}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>

              <div>
                <Label htmlFor="password">Password (Alternative)</Label>
                <Input
                  id="password"
                  type="password"
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 border-t pt-4">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center space-x-2"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </Button>

            <Button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="flex items-center space-x-2"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User API Key Management Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-green-200 bg-green-100">
              <Server className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <CardTitle className="text-base">User API Key Management</CardTitle>
              <CardDescription>
                Generate and manage User API Keys for Blue Dolphin REST operations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="userId">User ID (UUID format)</Label>
                <Input
                  id="userId"
                  value={config.userId || ''}
                  onChange={(e) => setConfig({ ...config, userId: e.target.value })}
                  placeholder="e.g., 68627d4e8b0ee343e2d1c795"
                />
              </div>

              <div>
                <Label htmlFor="userApiKeyName">API Key Name</Label>
                <Input
                  id="userApiKeyName"
                  value={config.userApiKeyName || ''}
                  onChange={(e) => setConfig({ ...config, userApiKeyName: e.target.value })}
                  placeholder="e.g., E2E Integration Key"
                />
              </div>

              <div>
                <Label htmlFor="userApiKeyExpiry">Expiry Date (YYYY-MM-DD)</Label>
                <Input
                  id="userApiKeyExpiry"
                  type="date"
                  value={config.userApiKeyExpiry || ''}
                  onChange={(e) => setConfig({ ...config, userApiKeyExpiry: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="workspaceId">Workspace ID</Label>
                <Input
                  id="workspaceId"
                  value={config.workspaceId || ''}
                  onChange={(e) => setConfig({ ...config, workspaceId: e.target.value })}
                  placeholder="e.g., default, main, or specific workspace ID"
                />
              </div>

              <div>
                <Label htmlFor="objectTypeId">Object Type ID</Label>
                <Input
                  id="objectTypeId"
                  value={config.objectTypeId || ''}
                  onChange={(e) => setConfig({ ...config, objectTypeId: e.target.value })}
                  placeholder="e.g., 1, 2, or specific object type ID"
                />
              </div>
            </div>
          </div>

          {/* Current User API Key Display */}
          {config.userApiKey && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-800 font-medium">🔑 Current User API Key</p>
                  <p className="text-sm text-blue-600 font-mono break-all">
                    {config.userApiKey}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    Generated: {config.userApiKeyGeneratedAt ? new Date(config.userApiKeyGeneratedAt).toLocaleString() : 'Unknown'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(config.userApiKey || '')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Copy
                </Button>
              </div>
            </div>
          )}

          {/* Existing API Keys Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Existing API Keys</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetrieveUserApiKeys}
                disabled={isRetrieving || !config.apiKey || !config.userId}
                className="flex items-center space-x-2"
              >
                {isRetrieving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>{isRetrieving ? 'Retrieving...' : 'Retrieve Keys'}</span>
              </Button>
            </div>

            {existingApiKeys.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {existingApiKeys.map((apiKey, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-gray-800 break-all">
                        {apiKey.key || apiKey.id || `Key ${index + 1}`}
                      </p>
                      {apiKey.name && (
                        <p className="text-xs text-gray-500">{apiKey.name}</p>
                      )}
                      {apiKey.expiration_date && (
                        <p className="text-xs text-gray-500">
                          Expires: {new Date(apiKey.expiration_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectApiKey(apiKey.key || apiKey.id)}
                        className="text-xs"
                      >
                        Select
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(apiKey.key || apiKey.id)}
                        className="text-xs"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                {isRetrieving ? 'Retrieving API keys...' : 'No existing API keys found. Click "Retrieve Keys" to load them.'}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-4 border-t pt-4">
            <Button
              variant="outline"
              onClick={handleTestUserApiKey}
              disabled={isTesting || !config.userApiKey}
              className="flex items-center space-x-2"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{isTesting ? 'Testing...' : 'Test User API Key'}</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleTestWorkspace}
              disabled={isTesting || !config.userApiKey || !config.workspaceId}
              className="flex items-center space-x-2"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{isTesting ? 'Testing...' : 'Test Workspace'}</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleTestObjectType}
              disabled={isTesting || !config.userApiKey || !config.objectTypeId}
              className="flex items-center space-x-2"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{isTesting ? 'Testing...' : 'Test Object Type'}</span>
            </Button>

            <Button
              onClick={handleGenerateUserApiKey}
              disabled={!canGenerateUserApiKey || isGenerating}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Server className="h-4 w-4" />
              )}
              <span>{isGenerating ? 'Generating...' : 'Generate User API Key'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
