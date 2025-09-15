'use client';

import { useState, useEffect, useCallback } from 'react';
import { ADOConfiguration, ADOAuthStatus } from '@/types/ado';
import { adoService } from '@/lib/ado-service';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Terminal,
  Activity,
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
      clientSecret: '',
    },
    mapping: {
      epicTemplate: '',
      featureTemplate: '',
      userStoryTemplate: '',
      taskTemplate: '',
    },
    customFields: {
      // SpecSync fields (preserved)
      tmfLevel: 'Custom.TMFLevel',
      domainId: 'Custom.DomainId',
      capabilityId: 'Custom.CapabilityId',
      requirementId: 'Custom.RequirementId',
      projectId: 'Custom.ProjectId',
      customer: 'Custom.Customer',
      // Blue Dolphin fields (new)
      blueDolphinId: 'Custom.BlueDolphinId',
      workspace: 'Custom.Workspace',
      objectType: 'Custom.ObjectType',
      objectStatus: 'Custom.ObjectStatus',
      deliverableStatus: 'Custom.DeliverableStatus',
      functionType: 'Custom.FunctionType',
      interfaceType: 'Custom.InterfaceType',
    },
    dataSource: 'blueDolphin', // Default to Blue Dolphin for new mappings
  });

  const [authStatus, setAuthStatus] = useState<ADOAuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('general');
  const [isInitialized, setIsInitialized] = useState(false);

  const toast = useToast();

  const loadConfiguration = useCallback(async () => {
    if (isInitialized) return; // Prevent reloading if already initialized
    
    try {
      const config = await adoService.loadConfiguration();
      if (config) {
        setConfiguration(config);
        toast.showSuccess('Configuration loaded successfully');
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to load configuration:', error);
      toast.showError('Failed to load configuration');
      setIsInitialized(true);
    }
  }, [toast, isInitialized]);

  useEffect(() => {
    loadConfiguration();
    loadLogs();
    loadNotifications();
  }, [loadConfiguration]); // Include loadConfiguration dependency

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

      // Don't automatically test connection on save to prevent infinite loops
      // User can manually test connection using the Test Connection button
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
        toast.showError(
          'Connection test failed. Please check your organization, project, and Personal Access Token.',
          'Connection Failed'
        );
      }

      // Refresh logs and notifications
      loadLogs();
      loadNotifications();
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.showError(
        'Connection test failed. Please verify your ADO settings and try again.',
        'Connection Error'
      );
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
    return authStatus.isAuthenticated ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
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
            <Badge className={getStatusColor()}>{getStatusText()}</Badge>
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    placeholder="your-organization"
                    value={configuration.organization}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        organization: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        project: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500">Your Azure DevOps project name</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="areaPath">Area Path</Label>
                  <Input
                    id="areaPath"
                    placeholder="Project\\Area"
                    value={configuration.areaPath}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        areaPath: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        iterationPath: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Default iteration path for work items (e.g., Project\\Sprint 1)
                  </p>
                </div>
              </div>
              
              {/* Data Source Selection */}
              <div className="space-y-2">
                <Label htmlFor="dataSource">Data Source</Label>
                <Select
                  value={configuration.dataSource}
                  onValueChange={(value: 'specsync' | 'blueDolphin' | 'both') =>
                    setConfiguration({
                      ...configuration,
                      dataSource: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="specsync">SpecSync Only</SelectItem>
                    <SelectItem value="blueDolphin">Blue Dolphin Only</SelectItem>
                    <SelectItem value="both">Both SpecSync & Blue Dolphin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Select which data sources to use for ADO work item generation
                </p>
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
                  onValueChange={(value: 'PAT' | 'OAuth') =>
                    setConfiguration({
                      ...configuration,
                      authentication: {
                        ...configuration.authentication,
                        type: value,
                      },
                    })
                  }
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
                      onChange={(e) =>
                        setConfiguration({
                          ...configuration,
                          authentication: {
                            ...configuration.authentication,
                            token: e.target.value,
                          },
                        })
                      }
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      id="clientId"
                      placeholder="Enter OAuth Client ID"
                      value={configuration.authentication.clientId || ''}
                      onChange={(e) =>
                        setConfiguration({
                          ...configuration,
                          authentication: {
                            ...configuration.authentication,
                            clientId: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientSecret">Client Secret</Label>
                    <Input
                      id="clientSecret"
                      type="password"
                      placeholder="Enter OAuth Client Secret"
                      value={configuration.authentication.clientSecret || ''}
                      onChange={(e) =>
                        setConfiguration({
                          ...configuration,
                          authentication: {
                            ...configuration.authentication,
                            clientSecret: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {authStatus && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="mb-2 font-medium">Connection Status</h4>
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
          {/* Data Source Priority Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Data Source Priority</span>
              </CardTitle>
              <CardDescription>
                Current data source configuration and mapping strategy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-blue-900">Primary Data Source</h4>
                      <Badge className="bg-blue-100 text-blue-800">
                        {configuration.dataSource === 'blueDolphin' && 'Blue Dolphin'}
                        {configuration.dataSource === 'specsync' && 'SpecSync'}
                        {configuration.dataSource === 'both' && 'Both Sources'}
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-700">
                      {configuration.dataSource === 'blueDolphin' && 'Blue Dolphin objects will be used as the primary data source for work item generation'}
                      {configuration.dataSource === 'specsync' && 'SpecSync data will be used as the primary data source for work item generation'}
                      {configuration.dataSource === 'both' && 'Both Blue Dolphin and SpecSync data will be used for work item generation'}
                    </p>
                    <div className="mt-2 text-xs text-blue-600">
                      <strong>Status:</strong> {configuration.dataSource === 'blueDolphin' && '✅ Blue Dolphin prioritized'}
                      {configuration.dataSource === 'specsync' && '✅ SpecSync prioritized'}
                      {configuration.dataSource === 'both' && '✅ Both sources enabled'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl">
                      {configuration.dataSource === 'blueDolphin' && '🔵'}
                      {configuration.dataSource === 'specsync' && '📋'}
                      {configuration.dataSource === 'both' && '🔄'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">Blue Dolphin Mapping Strategy</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Deliverables → ADO Epics</li>
                      <li>• Application Functions → ADO Features</li>
                      <li>• Application Interfaces → ADO Features</li>
                      <li>• Business Processes → ADO Tasks</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">SpecSync Mapping Strategy</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• TMF Domains → ADO Features</li>
                      <li>• TMF Capabilities → ADO User Stories</li>
                      <li>• SpecSync Requirements → ADO Tasks</li>
                      <li>• Project → ADO Epic</li>
                    </ul>
                  </div>
                </div>

                {/* Mapping Strategy Preview */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span>Current Mapping Strategy Preview</span>
                  </h5>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-700">
                      <strong>When you generate work items, the system will:</strong>
                    </div>
                    <div className="space-y-2">
                      {configuration.dataSource === 'blueDolphin' && (
                        <>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span>1. Look for Blue Dolphin objects (Deliverables, Application Functions, etc.)</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span>2. Map them to ADO work items according to the Blue Dolphin strategy</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                            <span>3. Skip SpecSync data (not configured as primary)</span>
                          </div>
                        </>
                      )}
                      {configuration.dataSource === 'specsync' && (
                        <>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>1. Look for SpecSync data (TMF Domains, Capabilities, Requirements)</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>2. Map them to ADO work items according to the SpecSync strategy</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                            <span>3. Skip Blue Dolphin data (not configured as primary)</span>
                          </div>
                        </>
                      )}
                      {configuration.dataSource === 'both' && (
                        <>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span>1. Look for Blue Dolphin objects first (primary data source)</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span>2. Map Blue Dolphin objects to ADO work items</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>3. Add SpecSync data as secondary source</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>4. Map SpecSync data to ADO work items</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="mt-3 p-2 bg-white rounded border text-xs text-gray-600">
                      <strong>Note:</strong> The system will validate data availability and show appropriate warnings if required data is missing.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Link className="h-5 w-5" />
                <span>Custom Field Mapping</span>
              </CardTitle>
              <CardDescription>
                Configure custom field mappings for SpecSync and Blue Dolphin data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tmfLevel">TMF Level Field</Label>
                  <Input
                    id="tmfLevel"
                    placeholder="Custom.TMFLevel"
                    value={configuration.customFields.tmfLevel}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        customFields: {
                          ...configuration.customFields,
                          tmfLevel: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domainId">Domain ID Field</Label>
                  <Input
                    id="domainId"
                    placeholder="Custom.DomainId"
                    value={configuration.customFields.domainId}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        customFields: {
                          ...configuration.customFields,
                          domainId: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capabilityId">Capability ID Field</Label>
                  <Input
                    id="capabilityId"
                    placeholder="Custom.CapabilityId"
                    value={configuration.customFields.capabilityId}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        customFields: {
                          ...configuration.customFields,
                          capabilityId: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirementId">Requirement ID Field</Label>
                  <Input
                    id="requirementId"
                    placeholder="Custom.RequirementId"
                    value={configuration.customFields.requirementId}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        customFields: {
                          ...configuration.customFields,
                          requirementId: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project ID Field</Label>
                  <Input
                    id="projectId"
                    placeholder="Custom.ProjectId"
                    value={configuration.customFields.projectId}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        customFields: {
                          ...configuration.customFields,
                          projectId: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer Field</Label>
                  <Input
                    id="customer"
                    placeholder="Custom.Customer"
                    value={configuration.customFields.customer}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        customFields: {
                          ...configuration.customFields,
                          customer: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Field Mapping Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Field Mapping Reference</span>
              </CardTitle>
              <CardDescription>
                Source to target field mappings for work item generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Blue Dolphin Field Mappings */}
                <div>
                  <h4 className="font-medium text-lg mb-4 text-blue-900">Blue Dolphin → ADO Field Mappings</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">Source Field (Blue Dolphin)</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">Target Field (ADO)</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">ID</td>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">Custom.BlueDolphinId</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">Unique Blue Dolphin object identifier</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">Title</td>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">System.Title</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">Object title becomes work item title</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">Description</td>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">System.Description</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">Object description becomes work item description</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">Workspace</td>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">Custom.Workspace</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">Blue Dolphin workspace identifier</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">Definition</td>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">Custom.ObjectType</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">Object type (Deliverable, Application Function, etc.)</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">Status</td>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">Custom.ObjectStatus</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">Object status in Blue Dolphin</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SpecSync Field Mappings */}
                <div>
                  <h4 className="font-medium text-lg mb-4 text-green-900">SpecSync → ADO Field Mappings</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-green-50">
                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">Source Field (SpecSync)</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">Target Field (ADO)</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">requirementId</td>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">Custom.RequirementId</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">SpecSync requirement identifier</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">functionName</td>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">System.Title</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">Function name becomes work item title</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">domain</td>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">Custom.DomainId</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">TMF domain identifier</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">capability</td>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">Custom.CapabilityId</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">TMF capability identifier</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">usecase1</td>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">System.Description</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">Use case becomes work item description</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blue Dolphin Field Mapping */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Blue Dolphin Field Mapping</span>
              </CardTitle>
              <CardDescription>
                Configure custom field mappings for Blue Dolphin objects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="blueDolphinId">Blue Dolphin ID Field</Label>
                  <Input
                    id="blueDolphinId"
                    placeholder="Custom.BlueDolphinId"
                    value={configuration.customFields.blueDolphinId}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        customFields: {
                          ...configuration.customFields,
                          blueDolphinId: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workspace">Workspace Field</Label>
                  <Input
                    id="workspace"
                    placeholder="Custom.Workspace"
                    value={configuration.customFields.workspace}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        customFields: {
                          ...configuration.customFields,
                          workspace: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objectType">Object Type Field</Label>
                  <Input
                    id="objectType"
                    placeholder="Custom.ObjectType"
                    value={configuration.customFields.objectType}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        customFields: {
                          ...configuration.customFields,
                          objectType: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objectStatus">Object Status Field</Label>
                  <Input
                    id="objectStatus"
                    placeholder="Custom.ObjectStatus"
                    value={configuration.customFields.objectStatus}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        customFields: {
                          ...configuration.customFields,
                          objectStatus: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliverableStatus">Deliverable Status Field</Label>
                  <Input
                    id="deliverableStatus"
                    placeholder="Custom.DeliverableStatus"
                    value={configuration.customFields.deliverableStatus}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        customFields: {
                          ...configuration.customFields,
                          deliverableStatus: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="functionType">Function Type Field</Label>
                  <Input
                    id="functionType"
                    placeholder="Custom.FunctionType"
                    value={configuration.customFields.functionType}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        customFields: {
                          ...configuration.customFields,
                          functionType: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interfaceType">Interface Type Field</Label>
                  <Input
                    id="interfaceType"
                    placeholder="Custom.InterfaceType"
                    value={configuration.customFields.interfaceType}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        customFields: {
                          ...configuration.customFields,
                          interfaceType: e.target.value,
                        },
                      })
                    }
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
              <CardDescription>Configure work item templates for different types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="epicTemplate">Epic Template</Label>
                  <Input
                    id="epicTemplate"
                    placeholder="Epic template name"
                    value={configuration.mapping.epicTemplate}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        mapping: {
                          ...configuration.mapping,
                          epicTemplate: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="featureTemplate">Feature Template</Label>
                  <Input
                    id="featureTemplate"
                    placeholder="Feature template name"
                    value={configuration.mapping.featureTemplate}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        mapping: {
                          ...configuration.mapping,
                          featureTemplate: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userStoryTemplate">User Story Template</Label>
                  <Input
                    id="userStoryTemplate"
                    placeholder="User Story template name"
                    value={configuration.mapping.userStoryTemplate}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        mapping: {
                          ...configuration.mapping,
                          userStoryTemplate: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskTemplate">Task Template</Label>
                  <Input
                    id="taskTemplate"
                    placeholder="Task template name"
                    value={configuration.mapping.taskTemplate}
                    onChange={(e) =>
                      setConfiguration({
                        ...configuration,
                        mapping: {
                          ...configuration.mapping,
                          taskTemplate: e.target.value,
                        },
                      })
                    }
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
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-sm text-gray-500">No logs available</p>
                  ) : (
                    logs
                      .slice(-20)
                      .reverse()
                      .map((log) => (
                        <div key={log.id} className="rounded bg-gray-50 p-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <Badge
                              variant={
                                log.level === 'error'
                                  ? 'destructive'
                                  : log.level === 'warning'
                                    ? 'secondary'
                                    : 'default'
                              }
                            >
                              {log.level.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="mt-1">{log.message}</div>
                          {log.details && (
                            <details className="mt-1">
                              <summary className="cursor-pointer text-xs text-gray-600">
                                Details
                              </summary>
                              <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-2 text-xs">
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
              <CardDescription>View system notifications and alerts</CardDescription>
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
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-500">No notifications available</p>
                  ) : (
                    notifications
                      .slice(-10)
                      .reverse()
                      .map((notification) => (
                        <div
                          key={notification.id}
                          className={`rounded border-l-4 p-3 ${
                            notification.type === 'error'
                              ? 'border-red-500 bg-red-50'
                              : notification.type === 'warning'
                                ? 'border-yellow-500 bg-yellow-50'
                                : notification.type === 'success'
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-blue-500 bg-blue-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">{notification.title}</h5>
                            <span className="text-xs text-gray-500">
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="mt-1 text-sm">{notification.message}</p>
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

      {/* Network connectivity help section - shown when there are network errors */}
      {authStatus && !authStatus.isAuthenticated && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <CardTitle className="text-sm text-amber-800">Connection Issue</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-amber-700">
              Unable to connect to Azure DevOps. This could be due to:
            </p>
            <ul className="ml-4 list-disc space-y-1 text-sm text-amber-700">
              <li><strong>Network Connectivity:</strong> Check your internet connection and VPN status</li>
              <li><strong>Incorrect Organization/Project:</strong> Verify the organization and project names are correct</li>
              <li><strong>Invalid PAT:</strong> Ensure your Personal Access Token is valid and has the correct permissions</li>
              <li><strong>Firewall/Proxy:</strong> Your network may be blocking access to dev.azure.com</li>
            </ul>
            <div className="rounded bg-amber-100 p-3">
              <p className="text-xs text-amber-800">
                <strong>Quick Fix:</strong> Verify your organization and project names, check your PAT permissions, 
                and ensure you can access dev.azure.com in your browser.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
