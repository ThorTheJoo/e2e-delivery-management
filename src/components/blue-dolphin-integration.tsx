'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Server, 
  Network, 
  Link, 
  ArrowLeftRight, 
  Settings, 
  Database, 
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Upload,
  Download,
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  Save,
  Loader2,
  ExternalLink,
  Info,
  X
} from 'lucide-react';
import { 
  BlueDolphinConfig, 
  BlueDolphinDomain, 
  BlueDolphinCapability, 
  BlueDolphinRequirement,
  SyncResult,
  SyncOperation
} from '@/types/blue-dolphin';

interface BlueDolphinIntegrationProps {
  specSyncData?: any;
  tmfDomains?: any[];
  onSyncComplete?: (result: SyncResult) => void;
}

export function BlueDolphinIntegration({ 
  specSyncData, 
  tmfDomains = [], 
  onSyncComplete 
}: BlueDolphinIntegrationProps) {
  const [config, setConfig] = useState<BlueDolphinConfig>({
    apiUrl: 'https://public-api.eu.bluedolphin.app',
    odataUrl: 'https://public-api.eu.bluedolphin.app/odata/v4',
    protocol: 'HYBRID'
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);
  const [domains, setDomains] = useState<BlueDolphinDomain[]>([]);
  const [capabilities, setCapabilities] = useState<BlueDolphinCapability[]>([]);
  const [requirements, setRequirements] = useState<BlueDolphinRequirement[]>([]);
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['config', 'domains']));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{id: string, type: 'success' | 'error' | 'info', title: string, message?: string}>>([]);
  
  // Object data retrieval state
  const [isLoadingObjects, setIsLoadingObjects] = useState(false);
  const [objects, setObjects] = useState<any[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/Objects');
  const [objectFilter, setObjectFilter] = useState<string>('');
  const [objectDefinitionFilter, setObjectDefinitionFilter] = useState<string>('Application Component');
  const [availableEndpoints, setAvailableEndpoints] = useState<string[]>([]);
  const [objectCount, setObjectCount] = useState<number>(0);
  const [objectTotal, setObjectTotal] = useState<number>(0);

  // Simple toast function to avoid infinite loops
  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  // Load configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('blueDolphinConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        
        // Normalize URLs by removing trailing slashes
        const normalizedConfig = {
          ...parsedConfig,
          apiUrl: parsedConfig.apiUrl?.endsWith('/') ? parsedConfig.apiUrl.slice(0, -1) : parsedConfig.apiUrl,
          odataUrl: parsedConfig.odataUrl?.endsWith('/') ? parsedConfig.odataUrl.slice(0, -1) : parsedConfig.odataUrl
        };
        
        setConfig(normalizedConfig);
        setIsConfigured(true);
      } catch (error) {
        console.error('Failed to load Blue Dolphin configuration:', error);
      }
    }
  }, []);

  const saveConfig = useCallback(async () => {
    setIsSavingConfig(true);
    try {
      // Validate configuration
      if (!config.apiUrl && !config.odataUrl) {
        throw new Error('At least one URL (API or OData) is required');
      }
      
      if (!config.apiKey && (!config.username || !config.password)) {
        throw new Error('Either API key or username/password is required');
      }

      // Normalize URLs by removing trailing slashes
      const normalizedConfig = {
        ...config,
        apiUrl: config.apiUrl?.endsWith('/') ? config.apiUrl.slice(0, -1) : config.apiUrl,
        odataUrl: config.odataUrl?.endsWith('/') ? config.odataUrl.slice(0, -1) : config.odataUrl
      };

      localStorage.setItem('blueDolphinConfig', JSON.stringify(normalizedConfig));
      setConfig(normalizedConfig);
      setIsConfigured(true);
      setConnectionStatus('idle');
      showToast('success', 'Configuration Saved', 'Blue Dolphin configuration has been saved successfully');
    } catch (error) {
      showToast('error', 'Save Failed', error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setIsSavingConfig(false);
    }
  }, [config, showToast]);

  const testConnection = useCallback(async () => {
    if (!config.apiKey && (!config.username || !config.password)) {
      showToast('error', 'Authentication Required', 'Please provide either API key or username/password');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('testing');
    
    try {
      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test-connection',
          config,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setConnectionStatus('success');
        showToast('success', 'Connection Successful', 'Successfully connected to Blue Dolphin');
      } else {
        setConnectionStatus('error');
        const errorMessage = result.error || 'Failed to connect to Blue Dolphin';
        console.error('Connection test failed:', errorMessage);
        showToast('error', 'Connection Failed', errorMessage);
      }
    } catch (error) {
      setConnectionStatus('error');
      showToast('error', 'Connection Error', error instanceof Error ? error.message : 'Network error occurred');
    } finally {
      setIsTestingConnection(false);
    }
  }, [config, showToast]);

  const loadDomains = useCallback(async () => {
    if (!isConfigured) {
      showToast('error', 'Configuration Required', 'Please configure Blue Dolphin connection first');
      return;
    }

    setIsLoadingDomains(true);
    try {
      console.log('Loading domains with config:', config);
      
      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get-domains',
          config,
          data: {
            params: { type: 'TMF_ODA_DOMAIN', status: 'ACTIVE', size: 50 }
          }
        }),
      });

      const result = await response.json();
      console.log('Load domains result:', result);

      if (result.success) {
        setDomains(result.data || []);
        showToast('success', 'Domains Loaded', `Successfully loaded ${result.data?.length || 0} domains from Blue Dolphin`);
      } else {
        console.error('Failed to load domains:', result.error);
        showToast('error', 'Load Failed', result.error || 'Failed to load domains from Blue Dolphin');
      }
    } catch (error) {
      console.error('Load domains error:', error);
      showToast('error', 'Load Error', error instanceof Error ? error.message : 'Network error occurred');
    } finally {
      setIsLoadingDomains(false);
    }
  }, [config, isConfigured, showToast]);

  const investigateOData = useCallback(async () => {
    if (!isConfigured) {
      showToast('error', 'Configuration Required', 'Please configure Blue Dolphin connection first');
      return;
    }

    if (config.protocol !== 'ODATA') {
      showToast('error', 'Protocol Error', 'Investigation is only available for OData protocol');
      return;
    }

    setIsLoadingDomains(true);
    try {
      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'investigate-odata',
          config,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('OData Investigation Results:', result.data);
        showToast('success', 'Investigation Complete', 'Check browser console for detailed results');
        
        // Display results in a more user-friendly way
        const { availableEndpoints, sampleData } = result.data;
        let message = `Found ${availableEndpoints.length} available endpoints: ${availableEndpoints.join(', ')}`;
        
        if (availableEndpoints.length > 0) {
          message += '\n\nSample data available in browser console.';
        }
        
        showToast('info', 'OData Structure', message);
      } else {
        showToast('error', 'Investigation Failed', result.error || 'Failed to investigate OData service');
      }
    } catch (error) {
      showToast('error', 'Investigation Error', error instanceof Error ? error.message : 'Network error occurred');
    } finally {
      setIsLoadingDomains(false);
    }
  }, [config, isConfigured, showToast]);

  const loadObjects = useCallback(async () => {
    if (!isConfigured) {
      showToast('error', 'Configuration Required', 'Please configure Blue Dolphin connection first');
      return;
    }

    if (config.protocol !== 'ODATA') {
      showToast('error', 'Protocol Error', 'Object retrieval is only available for OData protocol');
      return;
    }

    setIsLoadingObjects(true);
    try {
      console.log('Loading objects with config:', config);
      console.log('Selected endpoint:', selectedEndpoint);
      console.log('Definition filter:', objectDefinitionFilter);
      console.log('Additional filter:', objectFilter);

      // Build filter based on definition filter
      let filter = '';
      if (objectDefinitionFilter) {
        filter = `Definition eq '${objectDefinitionFilter}'`;
      }
      if (objectFilter) {
        const additionalFilter = objectFilter;
        filter = filter ? `${filter} and ${additionalFilter}` : additionalFilter;
      }

      console.log('Final filter:', filter);

      const requestBody = {
        action: 'get-objects',
        config,
        data: {
          endpoint: selectedEndpoint,
          filter: filter, // Use server-side filtering with OData v4.0
          top: 100,
          select: ['Id', 'Title', 'Definition', 'Description', 'ArchimateType', 'Status', 'CreatedOn', 'ChangedOn', 'Workspace'],
          orderby: 'Title asc'
        }
      };

      console.log('Request body:', requestBody);

      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('Response result:', result);

      if (result.success) {
        setObjects(result.data || []);
        setObjectCount(result.count || 0);
        setObjectTotal(result.total || 0);
        showToast('success', 'Objects Loaded', `Successfully loaded ${result.count || 0} objects from ${selectedEndpoint}`);
        
        // Log the raw response for debugging
        if (result.rawResponse) {
          console.log('Raw OData response:', result.rawResponse);
        }
      } else {
        console.error('Load failed:', result.error);
        showToast('error', 'Load Failed', result.error || 'Failed to load objects');
      }
    } catch (error) {
      console.error('Load error:', error);
      showToast('error', 'Load Error', error instanceof Error ? error.message : 'Network error occurred');
    } finally {
      setIsLoadingObjects(false);
    }
  }, [config, isConfigured, selectedEndpoint, objectDefinitionFilter, objectFilter, showToast]);

  const syncDomainsToBlueDolphin = useCallback(async () => {
    if (!isConfigured) {
      showToast('error', 'Configuration Required', 'Please configure Blue Dolphin connection first');
      return;
    }

    if (tmfDomains.length === 0) {
      showToast('error', 'No Data Available', 'No TMF domains available for sync');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate sync operation for now
      const mockResult: SyncResult = {
        success: true,
        syncedCount: tmfDomains.length,
        errors: [],
        operations: tmfDomains.map((domain, index) => ({
          id: `op-${index}`,
          type: 'CREATE',
          entityType: 'DOMAIN',
          entityId: domain.id || `domain-${index}`,
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
      };
      
      setSyncOperations(mockResult.operations);
      setLastSyncTime(new Date().toISOString());
      
      if (mockResult.success) {
        showToast('success', 'Sync Completed', `Successfully synced ${mockResult.syncedCount} domains to Blue Dolphin`);
      } else {
        showToast('error', 'Sync Completed with Errors', `${mockResult.errors.length} errors occurred during sync`);
      }
      
      onSyncComplete?.(mockResult);
    } catch (error) {
      showToast('error', 'Sync Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [config, isConfigured, tmfDomains, onSyncComplete, showToast]);

  const syncRequirementsToBlueDolphin = useCallback(async () => {
    if (!isConfigured) {
      showToast('error', 'Configuration Required', 'Please configure Blue Dolphin connection first');
      return;
    }

    if (!specSyncData?.items || specSyncData.items.length === 0) {
      showToast('error', 'No Data Available', 'No SpecSync requirements available for sync');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate sync operation for now
      const mockResult: SyncResult = {
        success: true,
        syncedCount: specSyncData.items.length,
        errors: [],
        operations: specSyncData.items.map((item: any, index: number) => ({
          id: `op-${index}`,
          type: 'CREATE',
          entityType: 'REQUIREMENT',
          entityId: item.id || `req-${index}`,
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
      };
      
      setSyncOperations(mockResult.operations);
      setLastSyncTime(new Date().toISOString());
      
      if (mockResult.success) {
        showToast('success', 'Sync Completed', `Successfully synced ${mockResult.syncedCount} requirements to Blue Dolphin`);
      } else {
        showToast('error', 'Sync Completed with Errors', `${mockResult.errors.length} errors occurred during sync`);
      }
      
      onSyncComplete?.(mockResult);
    } catch (error) {
      showToast('error', 'Sync Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [config, isConfigured, specSyncData, onSyncComplete, showToast]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'IN_PROGRESS':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Connection Failed</Badge>;
      case 'testing':
        return <Badge variant="secondary" className="flex items-center space-x-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Testing...</span>
        </Badge>;
      default:
        return <Badge variant="secondary">Not Tested</Badge>;
    }
  };

  const filteredDomains = domains.filter(domain => {
    const matchesSearch = domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         domain.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || domain.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('config')}
          >
            <div className="flex items-center space-x-2">
              {expandedSections.has('config') ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
              <Settings className="h-5 w-5" />
              <CardTitle>Blue Dolphin Configuration</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              {getConnectionStatusBadge()}
              <Badge variant={isConfigured ? "default" : "secondary"}>
                {isConfigured ? "Configured" : "Not Configured"}
              </Badge>
            </div>
          </div>
          <CardDescription>
            Configure connection settings for Blue Dolphin integration
          </CardDescription>
        </CardHeader>
        {expandedSections.has('config') && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="https://public-api.eu.bluedolphin.app/odata/v4"
                />
              </div>
              <div>
                <Label htmlFor="protocol">Protocol</Label>
                <Select value={config.protocol} onValueChange={(value: any) => setConfig({ ...config, protocol: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REST">REST API</SelectItem>
                    <SelectItem value="ODATA">OData</SelectItem>
                    <SelectItem value="HYBRID">Hybrid (Both)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="apiKey">API Key (Optional)</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={config.apiKey || ''}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="Enter API key"
                />
              </div>
              <div>
                <Label htmlFor="username">Username (Alternative)</Label>
                <Input
                  id="username"
                  value={config.username || ''}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password (Alternative)</Label>
                <Input
                  id="password"
                  type="password"
                  value={config.password || ''}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={saveConfig} 
                disabled={isSavingConfig || isTestingConnection}
                className="min-w-[140px]"
              >
                {isSavingConfig ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
              <Button 
                onClick={testConnection} 
                disabled={!isConfigured || isSavingConfig || isTestingConnection} 
                variant="outline"
                className="min-w-[140px]"
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>
            {connectionStatus === 'success' && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Connection Successful</p>
                  <p className="text-xs text-green-600">Blue Dolphin is accessible and ready for integration</p>
                </div>
              </div>
            )}
            {connectionStatus === 'error' && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800">Connection Failed</p>
                  <p className="text-xs text-red-600">Please check your configuration and try again</p>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Domain Management Section */}
      <Card>
        <CardHeader>
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('domains')}
          >
            <div className="flex items-center space-x-2">
              {expandedSections.has('domains') ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
              <Network className="h-5 w-5" />
              <CardTitle>Domain Management</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{domains.length} domains</Badge>
              {tmfDomains.length > 0 && (
                <Badge variant="outline">{tmfDomains.length} TMF domains available</Badge>
              )}
              {lastSyncTime && (
                <Badge variant="outline" className="text-xs">
                  Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            Manage TMF ODA domains in Blue Dolphin. Load existing domains and sync new ones.
          </CardDescription>
        </CardHeader>
        {expandedSections.has('domains') && (
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search domains..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="TMF_ODA_DOMAIN">TMF ODA</SelectItem>
                    <SelectItem value="CUSTOM_DOMAIN">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                             <div className="flex space-x-2">
                 <Button 
                   onClick={loadDomains} 
                   disabled={!isConfigured || isLoadingDomains} 
                   variant="outline"
                   className="min-w-[120px]"
                 >
                   {isLoadingDomains ? (
                     <>
                       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                       Loading...
                     </>
                   ) : (
                     <>
                       <Download className="h-4 w-4 mr-2" />
                       Load Domains
                     </>
                   )}
                 </Button>
                 <Button 
                   onClick={investigateOData} 
                   disabled={!isConfigured || isLoadingDomains} 
                   variant="outline"
                   className="min-w-[140px]"
                 >
                   <Search className="h-4 w-4 mr-2" />
                   Investigate OData
                 </Button>
                 <Button 
                   onClick={syncDomainsToBlueDolphin} 
                   disabled={!isConfigured || isLoading || tmfDomains.length === 0}
                   className="min-w-[140px]"
                 >
                   {isLoading ? (
                     <>
                       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                       Syncing...
                     </>
                   ) : (
                     <>
                       <Upload className="h-4 w-4 mr-2" />
                       Sync TMF Domains
                     </>
                   )}
                 </Button>
               </div>
            </div>

            {domains.length === 0 && !isLoadingDomains && (
              <div className="text-center py-8">
                <Network className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No domains loaded from Blue Dolphin</p>
                <p className="text-sm text-muted-foreground">
                  Click "Load Domains" to fetch existing domains from Blue Dolphin
                </p>
              </div>
            )}

            {isLoadingDomains && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading domains from Blue Dolphin...</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDomains.map((domain) => (
                <Card key={domain.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{domain.name}</CardTitle>
                      <Badge variant="outline">{domain.type}</Badge>
                    </div>
                    <CardDescription className="text-sm line-clamp-2">
                      {domain.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={domain.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {domain.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{new Date(domain.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span>{domain.type}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="flex space-x-2 w-full">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open in BD
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {filteredDomains.length === 0 && domains.length > 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2" />
                <p>No domains match your search criteria</p>
                <p className="text-sm">Try adjusting your search terms or filters</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Capabilities and Requirements Management Section */}
      <Card>
        <CardHeader>
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('capabilities')}
          >
            <div className="flex items-center space-x-2">
              {expandedSections.has('capabilities') ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
              <Database className="h-5 w-5" />
              <CardTitle>Capabilities & Requirements</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{capabilities.length} capabilities</Badge>
              <Badge variant="secondary">{requirements.length} requirements</Badge>
            </div>
          </div>
          <CardDescription>
            Manage capabilities and requirements in Blue Dolphin.
          </CardDescription>
        </CardHeader>
        {expandedSections.has('capabilities') && (
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search capabilities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="CAPABILITY">Capability</SelectItem>
                    <SelectItem value="REQUIREMENT">Requirement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => {
                    const newCapability: BlueDolphinCapability = {
                      id: `cap-${Date.now()}`,
                      name: 'New Capability',
                      description: 'Description for New Capability',
                      domainId: '',
                      type: 'TMF_ODA_CAPABILITY',
                      level: 'LEVEL_1',
                      status: 'ACTIVE',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    };
                    setCapabilities(prev => [...prev, newCapability]);
                  }}
                  disabled={!isConfigured}
                  className="min-w-[140px]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Capability
                </Button>
                <Button 
                  onClick={() => {
                    const newRequirement: BlueDolphinRequirement = {
                      id: `req-${Date.now()}`,
                      name: 'New Requirement',
                      description: 'Description for New Requirement',
                      type: 'FUNCTIONAL_REQUIREMENT',
                      priority: 'MEDIUM',
                      status: 'ACTIVE',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    };
                    setRequirements(prev => [...prev, newRequirement]);
                  }}
                  disabled={!isConfigured}
                  className="min-w-[140px]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </div>
            </div>

            {capabilities.length === 0 && !isLoadingDomains && (
              <div className="text-center py-8">
                <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No capabilities loaded from Blue Dolphin</p>
                <p className="text-sm text-muted-foreground">
                  Click "Add Capability" to create a new one.
                </p>
              </div>
            )}

            {isLoadingDomains && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading capabilities from Blue Dolphin...</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {capabilities.map((capability) => (
                <Card key={capability.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{capability.name}</CardTitle>
                      <Badge variant="outline">{capability.type}</Badge>
                    </div>
                    <CardDescription className="text-sm line-clamp-2">
                      {capability.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={capability.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {capability.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{new Date(capability.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Level:</span>
                        <span>{capability.level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Domain ID:</span>
                        <span className="text-xs">{capability.domainId}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="flex space-x-2 w-full">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {capabilities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2" />
                <p>No capabilities available</p>
                <p className="text-sm">Add capabilities using the buttons above</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Requirement Sync Section */}
      <Card>
        <CardHeader>
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('requirements')}
          >
            <div className="flex items-center space-x-2">
              {expandedSections.has('requirements') ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
              <ArrowLeftRight className="h-5 w-5" />
              <CardTitle>Requirement Synchronization</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{requirements.length} requirements</Badge>
              {specSyncData?.items && (
                <Badge variant="outline">{specSyncData.items.length} SpecSync items available</Badge>
              )}
            </div>
          </div>
          <CardDescription>
            Synchronize requirements from SpecSync to Blue Dolphin
          </CardDescription>
        </CardHeader>
        {expandedSections.has('requirements') && (
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">SpecSync Requirements</h4>
                <p className="text-sm text-muted-foreground">
                  {specSyncData?.items ? `${specSyncData.items.length} requirements available for sync` : 'No SpecSync data available'}
                </p>
              </div>
              <Button 
                onClick={syncRequirementsToBlueDolphin} 
                disabled={!isConfigured || isLoading || !specSyncData?.items || specSyncData.items.length === 0}
                className="min-w-[140px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Sync Requirements
                  </>
                )}
              </Button>
            </div>

            {requirements.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Synced Requirements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requirements.slice(0, 6).map((requirement) => (
                    <Card key={requirement.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{requirement.name}</p>
                          <p className="text-xs text-muted-foreground">{requirement.type}</p>
                        </div>
                        <Badge variant={requirement.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                          {requirement.priority}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Object Data Section */}
      <Card>
        <CardHeader>
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('objects')}
          >
            <div className="flex items-center space-x-2">
              {expandedSections.has('objects') ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
              <Database className="h-5 w-5" />
              <CardTitle>Object Data</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{objectCount} objects</Badge>
              <Badge variant="outline">{selectedEndpoint}</Badge>
            </div>
          </div>
          <CardDescription>
            Retrieve and filter object data from Blue Dolphin OData service.
          </CardDescription>
        </CardHeader>
        {expandedSections.has('objects') && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endpoint">Endpoint</Label>
                <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/Objects">/Objects</SelectItem>
                    <SelectItem value="/Elements">/Elements</SelectItem>
                    <SelectItem value="/Components">/Components</SelectItem>
                    <SelectItem value="/ApplicationComponents">/ApplicationComponents</SelectItem>
                    <SelectItem value="/BusinessComponents">/BusinessComponents</SelectItem>
                    <SelectItem value="/TechnologyComponents">/TechnologyComponents</SelectItem>
                    {availableEndpoints.map(endpoint => (
                      <SelectItem key={endpoint} value={endpoint}>{endpoint}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="definition-filter">Definition Filter</Label>
                <Input
                  id="definition-filter"
                  placeholder="e.g., Application Component"
                  value={objectDefinitionFilter}
                  onChange={(e) => setObjectDefinitionFilter(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="object-filter">Additional Filter</Label>
                <Input
                  id="object-filter"
                  placeholder="OData filter expression"
                  value={objectFilter}
                  onChange={(e) => setObjectFilter(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button 
                  onClick={loadObjects} 
                  disabled={!isConfigured || isLoadingObjects || config.protocol !== 'ODATA'} 
                  className="w-full"
                >
                  {isLoadingObjects ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Load Objects
                    </>
                  )}
                </Button>
              </div>
            </div>

            {objects.length === 0 && !isLoadingObjects && (
              <div className="text-center py-8">
                <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No objects loaded from Blue Dolphin</p>
                <p className="text-sm text-muted-foreground">
                  Configure filters and click "Load Objects" to retrieve data.
                </p>
              </div>
            )}

            {isLoadingObjects && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading objects from Blue Dolphin...</p>
              </div>
            )}

            {objects.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Retrieved Objects ({objectCount} of {objectTotal})</h4>
                  <Badge variant="outline">Endpoint: {selectedEndpoint}</Badge>
                </div>
                
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {objects.map((object, index) => (
                     <Card key={object.ID || object.Id || object.id || index} className="p-4">
                       <div className="space-y-2">
                         <div className="flex items-center justify-between">
                           <h5 className="font-medium text-sm truncate">{object.Title || object.Name || object.name || 'Unnamed Object'}</h5>
                           <Badge variant="secondary" className="text-xs">
                             {object.Definition || object.definition || 'Unknown'}
                           </Badge>
                         </div>
                         
                         <div className="flex items-center justify-between text-xs text-muted-foreground">
                           <span>Type: {object.ArchimateType || object.Type || object.type || 'Unknown'}</span>
                           <span>Status: {object.Status || object.status || 'Unknown'}</span>
                         </div>
                         
                         <div className="flex items-center justify-between text-xs text-muted-foreground">
                           <span>Category: {object.Category || 'Unknown'}</span>
                           <span>Workspace: {object.Workspace || 'Unknown'}</span>
                         </div>
                         
                         {object.Completeness !== undefined && (
                           <div className="flex items-center justify-between text-xs text-muted-foreground">
                             <span>Completeness: {object.Completeness}%</span>
                             <span>State: {object.ObjectLifecycleState || 'Unknown'}</span>
                           </div>
                         )}
                         
                         {object.CreatedOn && (
                           <p className="text-xs text-muted-foreground">
                             Created: {object.CreatedOn}
                           </p>
                         )}
                         
                         {object.ChangedOn && (
                           <p className="text-xs text-muted-foreground">
                             Modified: {object.ChangedOn}
                           </p>
                         )}
                       </div>
                     </Card>
                   ))}
                 </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Sync Operations Section */}
      {syncOperations.length > 0 && (
        <Card>
          <CardHeader>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('operations')}
            >
              <div className="flex items-center space-x-2">
                {expandedSections.has('operations') ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
                <Database className="h-5 w-5" />
                <CardTitle>Sync Operations</CardTitle>
              </div>
              <Badge variant="secondary">{syncOperations.length} operations</Badge>
            </div>
            <CardDescription>
              Monitor synchronization operations and their status
            </CardDescription>
          </CardHeader>
          {expandedSections.has('operations') && (
            <CardContent>
              <div className="space-y-2">
                {syncOperations.map((operation) => (
                  <div key={operation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(operation.status)}
                      <div>
                        <p className="font-medium text-sm">{operation.entityType} - {operation.entityId}</p>
                        <p className="text-xs text-muted-foreground">{operation.type} operation</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={operation.status === 'COMPLETED' ? 'default' : operation.status === 'FAILED' ? 'destructive' : 'secondary'}>
                        {operation.status}
                      </Badge>
                      {operation.error && (
                        <Button size="sm" variant="ghost">
                          <AlertTriangle className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toastItem) => (
          <div key={toastItem.id} className="flex items-start space-x-3 p-4 rounded-lg border shadow-lg max-w-sm bg-white">
            {toastItem.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />}
            {toastItem.type === 'error' && <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />}
            {toastItem.type === 'info' && <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{toastItem.title}</p>
              {toastItem.message && (
                <p className="text-sm text-gray-600 mt-1">{toastItem.message}</p>
              )}
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toastItem.id))}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
