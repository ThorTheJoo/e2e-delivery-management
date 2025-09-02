'use client';

import { useState, useEffect } from 'react';
import { ADOConfiguration, ADOAuthStatus, ADOIntegrationLogEntry, ADONotification } from '@/types/ado';
import { adoService } from '@/lib/ado-service';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { 
  Settings, 
  TestTube, 
  Save, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info,
  Database,
  Shield,
  Link,
  FileText,
  Code,
  Terminal,
  Activity
} from 'lucide-react';

export function ADOConfigurationComponent() {
  const [configuration, setConfiguration] = useState<ADOConfiguration>({
    organization: '',
    project: '',
    areaPath: '',
    iterationPath: '',
    authentication: {
      type: 'PAT',
      token: '',
      clientId: '',
      clientSecret: ''
    },
    mapping: {
      epicTemplate: '',
      featureTemplate: '',
      userStoryTemplate: '',
      taskTemplate: ''
    },
    customFields: {
      tmfLevel: 'Custom.TMFLevel',
      domainId: 'Custom.DomainId',
      capabilityId: 'Custom.CapabilityId',
      requirementId: 'Custom.RequirementId',
      projectId: 'Custom.ProjectId',
      customer: 'Custom.Customer'
    }
  });

  const [authStatus, setAuthStatus] = useState<ADOAuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [logs, setLogs] = useState<ADOIntegrationLogEntry[]>([]);
  const [notifications, setNotifications] = useState<ADONotification[]>([]);
  const [activeTab, setActiveTab] = useState('general');
  
  const toast = useToast();

  useEffect(() => {
    loadConfiguration();
    loadLogs();
    loadNotifications();
  }, []);

  const loadConfiguration = async () => {
    try {
      const config = await adoService.loadConfiguration();
      if (config) {
        setConfiguration(config);
        toast.showSuccess('Configuration loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      toast.showError('Failed to load configuration');
    }
  };

  const loadLogs = () => {
    const serviceLogs = adoService.getLogs();
    setLogs(serviceLogs);
  };

  const loadNotifications = () => {
    const serviceNotifications = adoService.getNotifications();
    setNotifications(serviceNotifications);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await adoService.saveConfiguration(configuration);
      toast.showSuccess('Configuration saved successfully');
      
      // Test connection if token is provided
      if (configuration.authentication.token) {
        await testConnection();
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.showError('Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const isConnected = await adoService.testConnection();
      const status = adoService.getAuthStatus();
      setAuthStatus(status);
      
      if (isConnected) {
        toast.showSuccess('Connection test successful');
      } else {
        toast.showError('Connection test failed');
      }
      
      // Refresh logs and notifications
      loadLogs();
      loadNotifications();
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.showError('Connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearLogs = () => {
    adoService.clearLogs();
    setLogs([]);
    toast.showInfo('Logs cleared');
  };

  const handleClearNotifications = () => {
    adoService.clearNotifications();
    setNotifications([]);
    toast.showInfo('Notifications cleared');
  };

  const getStatusIcon = () => {
    if (!authStatus) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return authStatus.isAuthenticated 
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (!authStatus) return 'Not Tested';
    return authStatus.isAuthenticated ? 'Connected' : 'Failed';
  };

  const getStatusColor = () => {
    if (!authStatus) return 'bg-yellow-100 text-yellow-800';
    return authStatus.isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Azure DevOps Configuration</h2>
          <p className="text-gray-600">Configure ADO integration settings and test connectivity</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>
          <Button
            onClick={testConnection}
            disabled={isTesting || !configuration.organization || !configuration.project}
            className="flex items-center space-x-2"
          >
            <TestTube className="h-4 w-4" />
            <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="authentication" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Authentication</span>
          </TabsTrigger>
          <TabsTrigger value="mapping" className="flex items-center space-x-2">
            <Link className="h-4 w-4" />
            <span>Field Mapping</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center space-x-2">
            <Terminal className="h-4 w-4" />
            <span>Logs & Debug</span>
          </TabsTrigger>
        </TabsList>

        {/* General Configuration */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>ADO Project Settings</span>
              </CardTitle>
              <CardDescription>
                Configure your Azure DevOps organization and project settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    placeholder="your-organization"
                    value={configuration.organization}
                    onChange={(e) => setConfiguration({
                      ...configuration,
                      organization: e.target.value
                    })}
                  />
                  <p className="text-xs text-gray-500">
                    Your Azure DevOps organization name (e.g., contoso)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Input
                    id="project"
                    placeholder="your-project"
                    value={configuration.project}
                    onChange={(e) => setConfiguration({
                      ...configuration,
                      project: e.target.value
                    })}
                  />
                  <p className="text-xs text-gray-500">
                    Your Azure DevOps project name
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="areaPath">Area Path</Label>
                  <Input
                    id="areaPath"
                    placeholder="Project\\Area"
                    value={configuration.areaPath}
                    onChange={(e) => setConfiguration({
                      ...configuration,
                      areaPath: e.target.value
                    })}
                  />
                  <p className="text-xs text-gray-500">
                    Default area path for work items (e.g., Project\\BSS)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iterationPath">Iteration Path</Label>
                  <Input
                    id="iterationPath"
                    placeholder="Project\\Iteration"
                    value={configuration.iterationPath}
                    onChange={(e) => setConfiguration({
                      ...configuration,
                      iterationPath: e.target.value
                    })}
                  />
                  <p className="text-xs text-gray-500">
                    Default iteration path for work items (e.g., Project\\Sprint 1)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Authentication Configuration */}
        <TabsContent value="authentication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Authentication Settings</span>
              </CardTitle>
              <CardDescription>
                Configure authentication method for Azure DevOps API access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="authType">Authentication Type</Label>
                <Select
                  value={configuration.authentication.type}
                  onValueChange={(value: 'PAT' | 'OAuth') => setConfiguration({
                    ...configuration,
                    authentication: {
                      ...configuration.authentication,
                      type: value
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAT">Personal Access Token (PAT)</SelectItem>
                    <SelectItem value="OAuth">OAuth 2.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {configuration.authentication.type === 'PAT' ? (
                <div className="space-y-2">
                  <Label htmlFor="token">Personal Access Token</Label>
                  <div className="relative">
                    <Input
                      id="token"
                      type={showToken ? 'text' : 'password'}
                      placeholder="Enter your PAT token"
                      value={configuration.authentication.token || ''}
                      onChange={(e) => setConfiguration({
                        ...configuration,
                        authentication: {
                          ...configuration.authentication,
                          token: e.target.value
                        }
                      })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Generate a PAT with Work Items (Read & Write) permissions
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      id="clientId"
                      placeholder="Enter OAuth Client ID"
                      value={configuration.authentication.clientId || ''}
                      onChange={(e) => setConfiguration({
                        ...configuration,
                        authentication: {
                          ...configuration.authentication,
                          clientId: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientSecret">Client Secret</Label>
                    <Input
                      id="clientSecret"
                      type="password"
                      placeholder="Enter OAuth Client Secret"
                      value={configuration.authentication.clientSecret || ''}
                      onChange={(e) => setConfiguration({
                        ...configuration,
                        authentication: {
                          ...configuration.authentication,
                          clientSecret: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
              )}

              {authStatus && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Connection Status</h4>
                  <div className="space-y-1 text-sm">
                    <div>Organization: {authStatus.organization}</div>
                    <div>Project: {authStatus.project}</div>
                    <div>User: {authStatus.user}</div>
                    <div>Permissions: {authStatus.permissions.join(', ')}</div>
                    <div>Last Checked: {new Date(authStatus.lastChecked).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Field Mapping Configuration */}
        <TabsContent value="mapping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Link className="h-5 w-5" />
                <span>Custom Field Mapping</span>
              </CardTitle>
              <CardDescription>
                Configure custom field mappings for TMF-specific data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tmfLevel">TMF Level Field</Label>
                  <Input
                    id="tmfLevel"
                    placeholder="Custom.TMFLevel"
                    value={configuration.customFields.tmfLevel}
                    onChange={(e) => setConfiguration({
                      ...configuration,
                      customFields: {
                        ...configuration.customFields,
                        tmfLevel: e.target.value
                      }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domainId">Domain ID Field</Label>
                  <Input
                    id="domainId"
                    placeholder="Custom.DomainId"
                    value={configuration.customFields.domainId}
                    onChange={(e) => setConfiguration({
                      ...configuration,
                      customFields: {
                        ...configuration.customFields,
                        domainId: e.target.value
                      }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capabilityId">Capability ID Field</Label>
                  <Input
                    id="capabilityId"
                    placeholder="Custom.CapabilityId"
                    value={configuration.customFields.capabilityId}
                    onChange={(e) => setConfiguration({
                      ...configuration,
                      customFields: {
                        ...configuration.customFields,
                        capabilityId: e.target.value
                      }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirementId">Requirement ID Field</Label>
                  <Input
                    id="requirementId"
                    placeholder="Custom.RequirementId"
                    value={configuration.customFields.requirementId}
                    onChange={(e) => setConfiguration({
                      ...configuration,
                      customFields: {
                        ...configuration.customFields,
                        requirementId: e.target.value
                      }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project ID Field</Label>
                  <Input
                    id="projectId"
                    placeholder="Custom.ProjectId"
                    value={configuration.customFields.projectId}
                    onChange={(e) => setConfiguration({
                      ...configuration,
                      customFields: {
                        ...configuration.customFields,
                        projectId: e.target.value
                      }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer Field</Label>
                  <Input
                    id="customer"
                    placeholder="Custom.Customer"
                    value={configuration.customFields.customer}
                    onChange={(e) => setConfiguration({
                      ...configuration,
                      customFields: {
                        ...configuration.customFields,
                        customer: e.target.value
                      }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Template Settings</span>
              </CardTitle>
              <CardDescription>
                Configure work item templates for different types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="epicTemplate">Epic Template</Label>
                  <Input
                    id="epicTemplate"
                    placeholder="Epic template name"
                    value={configuration.mapping.epicTemplate}
                    onChange={(e) => setConfiguration({
                      ...configuration,
                      mapping: {
                        ...configuration.mapping,
                        epicTemplate: e.target.value
                      }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="featureTemplate">Feature Template</Label>
                  <Input
                    id="featureTemplate"
                    placeholder="Feature template name"
                    value={configuration.mapping.featureTemplate}
                    onChange={(e) => setConfiguration({
                      ...configuration,
                      mapping: {
                        ...configuration.mapping,
                        featureTemplate: e.target.value
                      }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userStoryTemplate">User Story Template</Label>
                  <Input
                    id="userStoryTemplate"
                    placeholder="User Story template name"
                    value={configuration.mapping.userStoryTemplate}
                    onChange={(e) => setConfiguration({
                      ...configuration,
                      mapping: {
                        ...configuration.mapping,
                        userStoryTemplate: e.target.value
                      }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskTemplate">Task Template</Label>
                  <Input
                    id="taskTemplate"
                    placeholder="Task template name"
                    value={configuration.mapping.taskTemplate}
                    onChange={(e) => setConfiguration({
                      ...configuration,
                      mapping: {
                        ...configuration.mapping,
                        taskTemplate: e.target.value
                      }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs and Debug */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Terminal className="h-5 w-5" />
                <span>Integration Logs</span>
              </CardTitle>
              <CardDescription>
                View detailed logs and debug information for ADO integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Service Logs</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearLogs}
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Clear Logs</span>
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {logs.length === 0 ? (
                    <p className="text-gray-500 text-sm">No logs available</p>
                  ) : (
                    logs.slice(-20).reverse().map((log) => (
                      <div key={log.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <Badge variant={log.level === 'error' ? 'destructive' : log.level === 'warning' ? 'secondary' : 'default'}>
                            {log.level.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="mt-1">{log.message}</div>
                        {log.details && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-xs text-gray-600">Details</summary>
                            <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>
                View system notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">System Notifications</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearNotifications}
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Clear Notifications</span>
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-gray-500 text-sm">No notifications available</p>
                  ) : (
                    notifications.slice(-10).reverse().map((notification) => (
                      <div key={notification.id} className={`p-3 rounded border-l-4 ${
                        notification.type === 'error' ? 'border-red-500 bg-red-50' :
                        notification.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                        notification.type === 'success' ? 'border-green-500 bg-green-50' :
                        'border-blue-500 bg-blue-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">{notification.title}</h5>
                          <span className="text-xs text-gray-500">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{notification.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <Card>
        <CardFooter className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600">
              Configuration changes are saved automatically when you test the connection
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={loadConfiguration}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reload</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Saving...' : 'Save Configuration'}</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
