'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Palette, Save, RefreshCw, ArrowRight, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface MiroConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export function MiroConfiguration() {
  const [config, setConfig] = useState<MiroConfig>({
    clientId: '',
    clientSecret: '',
    redirectUri: typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}/api/auth/miro/callback`
      : 'http://localhost:3000/api/auth/miro/callback',
    scopes: ['boards:read', 'boards:write']
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const toast = useToast();

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      // Validate configuration
      if (!config.clientId.trim() || !config.clientSecret.trim()) {
        throw new Error('Client ID and Client Secret are required');
      }

      // Save configuration to localStorage
      localStorage.setItem('miroConfig', JSON.stringify(config));
      
      // Sync configuration with server
      const response = await fetch('/api/miro/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync configuration with server');
      }

      const result = await response.json();
      console.log('Configuration synced with server:', result);
      
      setIsConfigured(true);
      toast.showSuccess('Configuration saved and synced successfully');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.showError(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectToMiro = async () => {
    setIsConnecting(true);
    try {
      // Use current window location for redirect URI to ensure correct port
      const currentRedirectUri = `${window.location.protocol}//${window.location.host}/api/auth/miro/callback`;
      
      // Redirect to Miro OAuth
      const authUrl = `https://miro.com/oauth/authorize?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(currentRedirectUri)}&scope=${config.scopes.join(' ')}`;
      window.location.href = authUrl;
    } catch (error) {
      toast.showError('Failed to connect to Miro');
      setIsConnecting(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/miro/boards');
      if (response.ok) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      setIsConnected(false);
    }
  };

  const syncConfigWithServer = async (configToSync: MiroConfig) => {
    try {
      const response = await fetch('/api/miro/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: configToSync }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Configuration synced with server on load:', result);
      } else {
        console.warn('Failed to sync configuration with server on load');
      }
    } catch (error) {
      console.warn('Error syncing configuration with server on load:', error);
    }
  };

  const loadSavedConfig = () => {
    const saved = localStorage.getItem('miroConfig');
    if (saved) {
      try {
        const parsedConfig = JSON.parse(saved);
        // Validate that the saved config has the correct structure
        if (parsedConfig && typeof parsedConfig === 'object' && 'clientId' in parsedConfig) {
          setConfig(parsedConfig);
          setIsConfigured(true);
          // Sync the loaded configuration with the server
          syncConfigWithServer(parsedConfig);
        } else {
          console.warn('Invalid Miro config structure found in localStorage, clearing...');
          localStorage.removeItem('miroConfig');
        }
      } catch (error) {
        console.error('Error parsing Miro config from localStorage:', error);
        localStorage.removeItem('miroConfig');
      }
    }
  };

  const clearMiroConfig = () => {
    localStorage.removeItem('miroConfig');
    setConfig({
      clientId: '',
      clientSecret: '',
      redirectUri: typeof window !== 'undefined' 
        ? `${window.location.protocol}//${window.location.host}/api/auth/miro/callback`
        : 'http://localhost:3000/api/auth/miro/callback',
      scopes: ['boards:read', 'boards:write']
    });
    setIsConfigured(false);
    toast.showSuccess('Miro configuration cleared');
  };

  useEffect(() => {
    loadSavedConfig();
    checkConnectionStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Miro Configuration</h2>
        <p className="text-gray-600">
          Configure Miro integration settings for visual mapping and board creation. Set up OAuth credentials and connection preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg border-2 border-orange-200">
                <Palette className="w-5 h-5 text-orange-700" />
              </div>
              <div>
                <CardTitle className="text-base">Miro Configuration</CardTitle>
                <CardDescription>Configure Miro OAuth settings and connection preferences</CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Not Connected"}
              </Badge>
              <Badge variant={isConfigured ? "default" : "secondary"}>
                {isConfigured ? "Configured" : "Not Configured"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  value={config.clientId}
                  onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                  placeholder="Enter Miro Client ID"
                />
              </div>
              
              <div>
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  value={config.clientSecret}
                  onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                  placeholder="Enter Miro Client Secret"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your Miro application client secret for OAuth authentication.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="redirectUri">Redirect URI</Label>
                <Input
                  id="redirectUri"
                  value={config.redirectUri}
                  onChange={(e) => setConfig({ ...config, redirectUri: e.target.value })}
                  placeholder="http://localhost:3000/api/auth/miro/callback"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Must match exactly with your Miro app configuration.
                </p>
              </div>
              
              <div>
                <Label>Scopes</Label>
                <div className="space-y-2">
                  {config.scopes.map((scope, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`scope-${index}`}
                        checked={config.scopes.includes(scope)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setConfig({ ...config, scopes: [...config.scopes, scope] });
                          } else {
                            setConfig({ ...config, scopes: config.scopes.filter(s => s !== scope) });
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={`scope-${index}`} className="text-sm">{scope}</Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Permissions required for board creation and management.
                </p>
              </div>
            </div>
          </div>
           
          {/* Configuration Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Configuration Preview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Client ID:</span>
                <span className="ml-2 font-mono bg-white px-2 py-1 rounded border">
                  {config.clientId || 'Not set'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Client Secret:</span>
                <span className="ml-2 font-mono bg-white px-2 py-1 rounded border">
                  {config.clientSecret ? `${config.clientSecret.substring(0, 8)}...` : 'Not set'}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Redirect URI:</span>
                <span className="ml-2 font-mono bg-white px-2 py-1 rounded border break-all">
                  {config.redirectUri || 'Not set'}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Scopes:</span>
                <span className="ml-2 font-mono bg-white px-2 py-1 rounded border">
                  {config.scopes.join(' ')}
                </span>
              </div>
            </div>
          </div>
           
          {!isConnected && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-800">Not Connected to Miro</span>
              </div>
              <p className="text-orange-700 text-sm mb-3">
                You need to connect to Miro to use the visual mapping features. Click the button below to authorize this application.
              </p>
              
              {/* OAuth Flow Info */}
              <div className="bg-white border border-orange-200 rounded p-3 mt-3">
                <h5 className="font-medium text-orange-800 mb-2">OAuth Flow Information</h5>
                <div className="text-xs text-orange-700 space-y-1">
                  <div><strong>Step 1:</strong> Click "Connect to Miro" → Redirects to Miro OAuth</div>
                  <div><strong>Step 2:</strong> Miro redirects back to: <code className="bg-orange-100 px-1 rounded">{config.redirectUri}</code></div>
                  <div><strong>Step 3:</strong> Callback exchanges code for access token</div>
                  <div><strong>Step 4:</strong> Token stored securely for API access</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={clearMiroConfig}
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Clear Config</span>
            </Button>
            
            <Button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="flex items-center space-x-2"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </Button>
            
            <Button
              onClick={handleConnectToMiro}
              disabled={isConnecting || !isConfigured}
              className="flex items-center space-x-2"
            >
              {isConnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>{isConnecting ? 'Connecting...' : 'Connect to Miro'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
