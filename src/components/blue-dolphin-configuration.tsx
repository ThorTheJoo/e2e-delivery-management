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
  protocol: 'REST' | 'ODATA';
  username: string;
  apiKey: string;
  password: string;
}

export function BlueDolphinConfiguration() {
  const [config, setConfig] = useState<BlueDolphinConfig>({
    apiUrl: 'https://public-api.eu.bluedolphin.app',
    odataUrl: 'https://csgipoc.odata.bluedolphin.app',
    protocol: 'ODATA',
    username: 'csgipoc',
    apiKey: '',
    password: 'ef498b94-732b-46c8-a24c-65fbd27c1482',
  });

  const [isTested, setIsTested] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      setConfig(JSON.parse(saved));
    }
  };

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
    </div>
  );
}
