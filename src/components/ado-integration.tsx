'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ADOWorkItemMapping,
  ADOValidationResult,
  ADOPreviewData,
  ADOExportStatus,
} from '@/types/ado';
import { Project, TMFOdaDomain, SpecSyncItem } from '@/types';
import { BlueDolphinObjectEnhanced } from '@/types/blue-dolphin';
import { adoService } from '@/lib/ado-service';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import {
  Server,
  FileText,
  Download,
  Upload,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Network,
  Users,
  Settings,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Copy,
  Search,
  Layers,
  Target,
  Zap,
} from 'lucide-react';

interface ADOIntegrationProps {
  project: Project;
  tmfDomains: TMFOdaDomain[];
  specSyncItems: SpecSyncItem[];
  blueDolphinObjects?: BlueDolphinObjectEnhanced[];
}

export function ADOIntegration({ project, tmfDomains, specSyncItems, blueDolphinObjects = [] }: ADOIntegrationProps) {
  const [workItemMappings, setWorkItemMappings] = useState<ADOWorkItemMapping[]>([]);
  const [previewData, setPreviewData] = useState<ADOPreviewData | null>(null);
  const [validation, setValidation] = useState<ADOValidationResult | null>(null);
  const [exportStatus, setExportStatus] = useState<ADOExportStatus | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>([]);
  const [selectedApplicationFunctions, setSelectedApplicationFunctions] = useState<string[]>([]);
  const [selectedApplicationInterfaces, setSelectedApplicationInterfaces] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const toast = useToast();

  useEffect(() => {
    // Load Blue Dolphin objects from local storage if not provided via props
    const loadBlueDolphinObjectsFromStorage = () => {
      try {
        const stored = localStorage.getItem('blueDolphinTraversalObjects');
        if (stored) {
          const data = JSON.parse(stored);
          if (data.objects && Array.isArray(data.objects)) {
            console.log('💾 [ADO Integration] Loaded Blue Dolphin objects from local storage:', data.objects.length);
            console.log('💾 [ADO Integration] Storage metadata:', {
              timestamp: data.timestamp,
              source: data.source,
              totalObjects: data.totalObjects,
              objectTypes: data.objectTypes
            });
            return data.objects;
          }
        }
      } catch (error) {
        console.error('❌ [ADO Integration] Failed to load Blue Dolphin objects from storage:', error);
      }
      return [];
    };

    // Initialize with all domains and capabilities selected
    const allDomainIds = tmfDomains.map((d) => d.id);
    const allCapabilityIds = tmfDomains.flatMap((d) => d.capabilities.map((c) => c.id));
    const allRequirementIds = specSyncItems.map((r) => r.id);

    // Get Blue Dolphin objects from props or local storage
    const availableBlueDolphinObjects = blueDolphinObjects.length > 0 
      ? blueDolphinObjects 
      : loadBlueDolphinObjectsFromStorage();

    // Initialize Blue Dolphin object selections
    const allDeliverableIds = availableBlueDolphinObjects
      .filter((obj: any) => obj.Definition === 'Deliverable')
      .map((obj: any) => obj.ID);
    const allApplicationFunctionIds = availableBlueDolphinObjects
      .filter((obj: any) => obj.Definition === 'Application Function')
      .map((obj: any) => obj.ID);
    const allApplicationInterfaceIds = availableBlueDolphinObjects
      .filter((obj: any) => obj.Definition === 'Application Interface')
      .map((obj: any) => obj.ID);

    setSelectedDomains(allDomainIds);
    setSelectedCapabilities(allCapabilityIds);
    setSelectedRequirements(allRequirementIds);
    setSelectedDeliverables(allDeliverableIds);
    setSelectedApplicationFunctions(allApplicationFunctionIds);
    setSelectedApplicationInterfaces(allApplicationInterfaceIds);

    console.log('🔧 [ADO Integration] Initialized with data:', {
      tmfDomains: allDomainIds.length,
      specSyncItems: allRequirementIds.length,
      blueDolphinObjects: availableBlueDolphinObjects.length,
      deliverables: allDeliverableIds.length,
      applicationFunctions: allApplicationFunctionIds.length,
      applicationInterfaces: allApplicationInterfaceIds.length
    });
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps -- Initialize only once on mount to prevent infinite loops

  const generateWorkItems = async () => {
    setIsGenerating(true);
    try {
      let mappings: ADOWorkItemMapping[] = [];

      // Load and validate ADO configuration
      const config = await adoService.loadConfiguration();
      if (!config) {
        console.log('⚠️ [ADO Integration] No ADO configuration found, using defaults');
        toast.showWarning('No ADO configuration found. Using default settings.');
      }
      
      const dataSource = config?.dataSource || 'blueDolphin'; // Default to Blue Dolphin
      
      console.log('🔧 [ADO Integration] Data source configuration:', dataSource);
      console.log('🔧 [ADO Integration] Configuration status:', {
        hasConfig: !!config,
        organization: config?.organization || 'Not configured',
        project: config?.project || 'Not configured',
        dataSource: dataSource
      });
      console.log('🔧 [ADO Integration] Available data:', {
        blueDolphinObjects: blueDolphinObjects.length,
        specSyncItems: specSyncItems.length,
        tmfDomains: tmfDomains.length
      });

      // Enforce data source priority based on configuration
      if (dataSource === 'blueDolphin' || dataSource === 'both') {
        // Use Blue Dolphin objects when configured as primary or both
        if (blueDolphinObjects.length > 0) {
          console.log('🔵 [ADO Integration] Using Blue Dolphin objects as primary data source');
          const blueDolphinMappings = adoService.generateWorkItemMappingsFromBlueDolphin(
            project,
            blueDolphinObjects,
            selectedDeliverables,
            selectedApplicationFunctions,
            selectedApplicationInterfaces,
          );
          mappings = [...mappings, ...blueDolphinMappings];
        } else if (dataSource === 'blueDolphin') {
          console.log('⚠️ [ADO Integration] Blue Dolphin data required but not available');
          toast.showError('Blue Dolphin data is required but not available. Please run traversal first.');
          return;
        }
      }

      if (dataSource === 'specsync' || dataSource === 'both') {
        // Use SpecSync data when configured as primary or both
        if (specSyncItems.length > 0) {
          console.log('📋 [ADO Integration] Using SpecSync data as', dataSource === 'both' ? 'secondary' : 'primary', 'data source');
          const filteredDomains = tmfDomains.filter((d) => selectedDomains.includes(d.id));
          const filteredSpecSyncItems = specSyncItems.filter((r) =>
            selectedRequirements.includes(r.id),
          );

          const specSyncMappings = adoService.generateWorkItemMappings(
            project,
            filteredDomains,
            filteredSpecSyncItems,
          );
          mappings = [...mappings, ...specSyncMappings];
        } else if (dataSource === 'specsync') {
          console.log('⚠️ [ADO Integration] SpecSync data required but not available');
          toast.showError('SpecSync data is required but not available.');
          return;
        }
      }

      // Fallback: If no configuration or both data sources are empty, use available data
      if (mappings.length === 0) {
        console.log('🔄 [ADO Integration] No configuration found, using fallback logic');
        if (blueDolphinObjects.length > 0) {
          console.log('🔵 [ADO Integration] Fallback: Using Blue Dolphin objects');
          const blueDolphinMappings = adoService.generateWorkItemMappingsFromBlueDolphin(
            project,
            blueDolphinObjects,
            selectedDeliverables,
            selectedApplicationFunctions,
            selectedApplicationInterfaces,
          );
          mappings = [...mappings, ...blueDolphinMappings];
        } else if (specSyncItems.length > 0) {
          console.log('📋 [ADO Integration] Fallback: Using SpecSync data');
          const filteredDomains = tmfDomains.filter((d) => selectedDomains.includes(d.id));
          const filteredSpecSyncItems = specSyncItems.filter((r) =>
            selectedRequirements.includes(r.id),
          );

          const specSyncMappings = adoService.generateWorkItemMappings(
            project,
            filteredDomains,
            filteredSpecSyncItems,
          );
          mappings = [...mappings, ...specSyncMappings];
        }
      }

      setWorkItemMappings(mappings);

      const preview = adoService.generatePreview(mappings);
      setPreviewData(preview);

      const validationResult = adoService.validateWorkItemMappings(mappings);
      setValidation(validationResult);

      toast.showSuccess(`Generated ${mappings.length} work item mappings`);

      console.log('Generated work item mappings:', mappings);
      console.log('Preview data:', preview);
      console.log('Validation result:', validationResult);
    } catch (error) {
      console.error('Failed to generate work items:', error);
      toast.showError('Failed to generate work items');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToJSON = async () => {
    if (workItemMappings.length === 0) {
      toast.showError('No work items to export');
      return;
    }

    try {
      const jsonData = await adoService.exportToJSON(workItemMappings);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ado-work-items-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.showSuccess('Work items exported to JSON successfully');
    } catch (error) {
      console.error('Failed to export to JSON:', error);
      toast.showError('Failed to export to JSON');
    }
  };

  const exportToADO = async () => {
    if (workItemMappings.length === 0) {
      toast.showError('No work items to export');
      return;
    }

    // Check if ADO is configured first
    const config = adoService.getConfiguration();
    if (!config) {
      toast.showError(
        'ADO not configured. Please go to ADO Configuration and set up your connection first.',
        'Configuration Required'
      );
      return;
    }

    console.log('🚀 Starting ADO export with mappings:', workItemMappings);
    console.log(
      '📊 Mapping details:',
      workItemMappings.map((m) => ({
        type: m.targetType,
        title: m.targetTitle,
        source: m.sourceType,
      })),
    );
    setIsExporting(true);

    try {
      console.log('🔍 ADO Configuration found:', config);

      // Ensure authentication
      console.log('🔐 Ensuring ADO authentication...');
      const isAuthenticated = await adoService.ensureAuthenticated();
      
      if (!isAuthenticated) {
        console.log('❌ ADO authentication failed - stopping export');
        toast.showError(
          'ADO authentication failed. Please check your configuration and test connection.',
          'Authentication Failed'
        );
        return;
      }

      const authStatus = adoService.getAuthStatus();
      console.log('🔐 ADO Authentication status:', authStatus);

      // Test basic connection first
      console.log('🔗 Testing basic ADO connection...');
      try {
        const connectionTest = await adoService.testConnection();
        console.log('🔗 Connection test result:', connectionTest);
        if (!connectionTest) {
          console.log('❌ Connection test failed - stopping export');
          toast.showError('ADO connection test failed. Please check your configuration.');
          return;
        }
      } catch (error) {
        console.error('❌ Connection test error:', error);
        toast.showError('ADO connection test failed');
        return;
      }

      // First, let's check what work item types are available
      console.log('🔍 Starting work item type check...');
      try {
        const availableTypes = await adoService.getAvailableWorkItemTypes();
        console.log('📋 Available work item types:', availableTypes);
      } catch (error) {
        console.error('❌ Failed to get available work item types:', error);
        toast.showError('Failed to get available work item types');
        return;
      }

      // Validate work item types
      console.log('✅ Starting work item type validation...');
      try {
        const validation = await adoService.validateWorkItemTypes();
        console.log('🔍 Work item type validation:', validation);
      } catch (error) {
        console.error('❌ Failed to validate work item types:', error);
        toast.showError('Failed to validate work item types');
        return;
      }

      // Now proceed with export
      console.log('📤 Proceeding with export...');
      const status = await adoService.exportToADO(workItemMappings);
      console.log('📊 Export status received:', status);

      setExportStatus(status);

      if (status.status === 'completed') {
        toast.showSuccess(`Successfully exported ${status.processedItems} work items to ADO`);
        console.log('🎉 Export completed successfully!');
      } else if (status.status === 'completed_with_errors') {
        toast.showWarning(
          `Export completed with ${status.errors.length} errors. ${status.processedItems} items exported.`,
        );
        console.log('⚠️ Export completed with errors:', status.errors);
      } else {
        toast.showError(`Export failed: ${status.errors.join(', ')}`);
        console.log('❌ Export failed:', status.errors);
      }
    } catch (error) {
      console.error('💥 Failed to export to ADO:', error);
      toast.showError(
        `Failed to export to ADO: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const filteredMappings = useMemo(() => {
    return workItemMappings.filter((mapping) => {
      const matchesSearch =
        mapping.targetTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mapping.targetDescription.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || mapping.targetType === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [workItemMappings, searchTerm, filterType]);

  const getWorkItemIcon = (type: string) => {
    switch (type) {
      case 'epic':
        return <Target className="h-4 w-4" />;
      case 'feature':
        return <Layers className="h-4 w-4" />;
      case 'User Story':
        return <Users className="h-4 w-4" />;
      case 'task':
        return <Settings className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getWorkItemColor = (type: string) => {
    switch (type) {
      case 'epic':
        return 'bg-purple-100 text-purple-800';
      case 'feature':
        return 'bg-blue-100 text-blue-800';
      case 'User Story':
        return 'bg-green-100 text-green-800';
      case 'task':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Azure DevOps Integration</h2>
          <p className="text-gray-600">
            Transform Blue Dolphin objects into ADO work items (with SpecSync fallback)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={generateWorkItems}
            disabled={isGenerating || (blueDolphinObjects.length === 0 && selectedDomains.length === 0 && selectedDeliverables.length === 0 && selectedApplicationFunctions.length === 0 && selectedApplicationInterfaces.length === 0)}
            className="flex items-center space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span>{isGenerating ? 'Generating...' : 'Generate Work Items'}</span>
          </Button>
          <Button
            onClick={exportToJSON}
            disabled={workItemMappings.length === 0}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export JSON</span>
          </Button>
          <Button
            onClick={exportToADO}
            disabled={workItemMappings.length === 0 || isExporting}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>{isExporting ? 'Exporting...' : 'Export to ADO'}</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">TMF Domains</p>
                <p className="text-2xl font-bold">{tmfDomains.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Layers className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Capabilities</p>
                <p className="text-2xl font-bold">
                  {tmfDomains.reduce((sum, d) => sum + d.capabilities.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Requirements</p>
                <p className="text-2xl font-bold">{specSyncItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Server className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Work Items</p>
                <p className="text-2xl font-bold">{workItemMappings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {blueDolphinObjects.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Blue Dolphin Objects</p>
                  <p className="text-2xl font-bold">{blueDolphinObjects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="mappings" className="flex items-center space-x-2">
            <Network className="h-4 w-4" />
            <span>Work Items</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Preview</span>
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Validation</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>Integration Overview</span>
              </CardTitle>
              <CardDescription>Overview of the ADO integration mapping strategy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mapping Strategy */}
              <div
                className="cursor-pointer rounded-lg p-4 transition-colors hover:bg-muted/50"
                onClick={() => toggleSection('strategy')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-blue-200 bg-blue-100">
                      {expandedSections.has('strategy') ? (
                        <ChevronDown className="h-5 w-5 text-blue-700" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-blue-700" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Mapping Strategy</h3>
                      <p className="text-sm text-gray-600">How TMF data maps to ADO work items</p>
                    </div>
                  </div>
                </div>
                {expandedSections.has('strategy') && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-lg bg-purple-50 p-4">
                        <h4 className="mb-2 font-semibold text-purple-800">Epic Level</h4>
                        <p className="text-sm text-purple-700">Blue Dolphin Deliverables → ADO Epics</p>
                        <p className="mt-1 text-xs text-purple-600">
                          Each deliverable becomes an epic
                        </p>
                      </div>
                      <div className="rounded-lg bg-blue-50 p-4">
                        <h4 className="mb-2 font-semibold text-blue-800">Feature Level</h4>
                        <p className="text-sm text-blue-700">Blue Dolphin Application Functions → ADO Features</p>
                        <p className="mt-1 text-xs text-blue-600">
                          Each application function becomes a feature
                        </p>
                      </div>
                      <div className="rounded-lg bg-green-50 p-4">
                        <h4 className="mb-2 font-semibold text-green-800">Feature Level</h4>
                        <p className="text-sm text-green-700">
                          Blue Dolphin Application Interfaces → ADO Features
                        </p>
                        <p className="mt-1 text-xs text-green-600">
                          Each application interface becomes a feature
                        </p>
                      </div>
                      <div className="rounded-lg bg-orange-50 p-4">
                        <h4 className="mb-2 font-semibold text-orange-800">Fallback Mode</h4>
                        <p className="text-sm text-orange-700">SpecSync Requirements → ADO Tasks (if no Blue Dolphin data)</p>
                        <p className="mt-1 text-xs text-orange-600">
                          Falls back to SpecSync when Blue Dolphin data is unavailable
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Selection */}
              <div
                className="cursor-pointer rounded-lg p-4 transition-colors hover:bg-muted/50"
                onClick={() => toggleSection('selection')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-green-200 bg-green-100">
                      {expandedSections.has('selection') ? (
                        <ChevronDown className="h-5 w-5 text-green-700" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-green-700" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Data Selection</h3>
                      <p className="text-sm text-gray-600">
                        {blueDolphinObjects.length > 0 
                          ? "Select which Blue Dolphin objects to include in the integration"
                          : "Select which SpecSync data to include in the integration (Blue Dolphin objects not available)"
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {blueDolphinObjects.length > 0 ? (
                        <>
                          {selectedDeliverables.length} deliverables, {selectedApplicationFunctions.length} functions, {selectedApplicationInterfaces.length} interfaces
                        </>
                      ) : (
                        <>
                          {selectedDomains.length} domains, {selectedCapabilities.length} capabilities,{' '}
                          {selectedRequirements.length} requirements
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
                {expandedSections.has('selection') && (
                  <div className="mt-4 space-y-4">
                    {/* Blue Dolphin Objects Selection - Show First */}
                    {blueDolphinObjects.length > 0 && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <h4 className="mb-2 font-medium">Blue Dolphin Deliverables</h4>
                          <div className="max-h-32 space-y-2 overflow-y-auto">
                            {blueDolphinObjects
                              .filter(obj => obj.Definition === 'Deliverable')
                              .map((deliverable) => (
                                <label key={deliverable.ID} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedDeliverables.includes(deliverable.ID)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedDeliverables([...selectedDeliverables, deliverable.ID]);
                                      } else {
                                        setSelectedDeliverables(
                                          selectedDeliverables.filter((id) => id !== deliverable.ID),
                                        );
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-sm">{deliverable.Title}</span>
                                </label>
                              ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 font-medium">Application Functions</h4>
                          <div className="max-h-32 space-y-2 overflow-y-auto">
                            {blueDolphinObjects
                              .filter(obj => obj.Definition === 'Application Function')
                              .map((appFunction) => (
                                <label key={appFunction.ID} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedApplicationFunctions.includes(appFunction.ID)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedApplicationFunctions([...selectedApplicationFunctions, appFunction.ID]);
                                      } else {
                                        setSelectedApplicationFunctions(
                                          selectedApplicationFunctions.filter((id) => id !== appFunction.ID),
                                        );
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-sm">{appFunction.Title}</span>
                                </label>
                              ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 font-medium">Application Interfaces</h4>
                          <div className="max-h-32 space-y-2 overflow-y-auto">
                            {blueDolphinObjects
                              .filter(obj => obj.Definition === 'Application Interface')
                              .map((appInterface) => (
                                <label key={appInterface.ID} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedApplicationInterfaces.includes(appInterface.ID)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedApplicationInterfaces([...selectedApplicationInterfaces, appInterface.ID]);
                                      } else {
                                        setSelectedApplicationInterfaces(
                                          selectedApplicationInterfaces.filter((id) => id !== appInterface.ID),
                                        );
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-sm">{appInterface.Title}</span>
                                </label>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SpecSync Data Selection - Show Only if No Blue Dolphin Data */}
                    {blueDolphinObjects.length === 0 && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <h4 className="mb-2 font-medium">TMF Domains</h4>
                          <div className="max-h-32 space-y-2 overflow-y-auto">
                            {tmfDomains.map((domain) => (
                              <label key={domain.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={selectedDomains.includes(domain.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedDomains([...selectedDomains, domain.id]);
                                    } else {
                                      setSelectedDomains(
                                        selectedDomains.filter((id) => id !== domain.id),
                                      );
                                    }
                                  }}
                                  className="rounded"
                                />
                                <span className="text-sm">{domain.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 font-medium">TMF Capabilities</h4>
                          <div className="max-h-32 space-y-2 overflow-y-auto">
                            {tmfDomains
                              .flatMap((d) => d.capabilities)
                              .map((capability) => (
                                <label key={capability.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedCapabilities.includes(capability.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedCapabilities([
                                          ...selectedCapabilities,
                                          capability.id,
                                        ]);
                                      } else {
                                        setSelectedCapabilities(
                                          selectedCapabilities.filter((id) => id !== capability.id),
                                        );
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-sm">{capability.name}</span>
                                </label>
                              ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 font-medium">SpecSync Requirements</h4>
                          <div className="max-h-32 space-y-2 overflow-y-auto">
                            {specSyncItems.map((item) => (
                              <label key={item.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={selectedRequirements.includes(item.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedRequirements([...selectedRequirements, item.id]);
                                    } else {
                                      setSelectedRequirements(
                                        selectedRequirements.filter((id) => id !== item.id),
                                      );
                                    }
                                  }}
                                  className="rounded"
                                />
                                <span className="text-sm">{item.rephrasedRequirementId}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Items Tab */}
        <TabsContent value="mappings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Network className="h-5 w-5" />
                <span>Generated Work Items</span>
              </CardTitle>
              <CardDescription>
                Preview and manage the generated ADO work item mappings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search work items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="epic">Epics</SelectItem>
                      <SelectItem value="feature">Features</SelectItem>
                      <SelectItem value="userstory">User Stories</SelectItem>
                      <SelectItem value="task">Tasks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Work Items List */}
                <div className="space-y-3">
                  {filteredMappings.length === 0 ? (
                    <div className="py-8 text-center">
                      <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <p className="text-gray-500">
                        No work items generated yet. Click "Generate Work Items" to get started.
                      </p>
                    </div>
                  ) : (
                    filteredMappings.map((mapping, index) => (
                      <div
                        key={index}
                        className="rounded-lg border p-4 transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center space-x-3">
                              {getWorkItemIcon(mapping.targetType)}
                              <Badge className={getWorkItemColor(mapping.targetType)}>
                                {mapping.targetType.toUpperCase()}
                              </Badge>
                              <h3 className="font-semibold">{mapping.targetTitle}</h3>
                            </div>
                            <p className="mb-2 text-sm text-gray-600">
                              {mapping.targetDescription}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Source: {mapping.sourceType}</span>
                              <span>Priority: {mapping.priority}</span>
                              {mapping.estimatedEffort && (
                                <span>Effort: {mapping.estimatedEffort}d</span>
                              )}
                              {mapping.storyPoints && (
                                <span>Story Points: {mapping.storyPoints}</span>
                              )}
                            </div>
                            {mapping.tags && mapping.tags.length > 0 && (
                              <div className="mt-2 flex items-center space-x-1">
                                {mapping.tags.slice(0, 3).map((tag, tagIndex) => (
                                  <Badge key={tagIndex} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {mapping.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{mapping.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const fieldData = JSON.stringify(mapping.targetFields, null, 2);
                                navigator.clipboard.writeText(fieldData);
                                toast.showSuccess('Fields copied to clipboard');
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          {previewData ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-gray-50 p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {previewData.summary.totalItems}
                        </div>
                        <div className="text-sm text-gray-600">Total Items</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {previewData.summary.totalEffort}
                        </div>
                        <div className="text-sm text-gray-600">Total Effort (days)</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Breakdown</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Epics:</span>
                          <span className="font-medium">{previewData.summary.breakdown.epics}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Features:</span>
                          <span className="font-medium">
                            {previewData.summary.breakdown.features}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>User Stories:</span>
                          <span className="font-medium">
                            {previewData.summary.breakdown.userStories}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tasks:</span>
                          <span className="font-medium">{previewData.summary.breakdown.tasks}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Epics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {previewData.epics.map((epic, index) => (
                      <div key={index} className="rounded-lg bg-purple-50 p-3">
                        <h4 className="font-medium text-purple-900">{epic.targetTitle}</h4>
                        <p className="mt-1 text-sm text-purple-700">{epic.targetDescription}</p>
                        <div className="mt-2 flex items-center space-x-2">
                          <Badge className="bg-purple-100 text-purple-800">Epic</Badge>
                          <span className="text-xs text-purple-600">
                            Effort: {epic.estimatedEffort}d
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-500">
                  No preview data available. Generate work items first.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="space-y-6">
          {validation ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Validation Results</span>
                </CardTitle>
                <CardDescription>
                  Validation status and issues for the generated work items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Validation Status */}
                  <div className="flex items-center space-x-3">
                    {validation.isValid ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                    <div>
                      <h3 className="font-medium">
                        {validation.isValid ? 'Validation Passed' : 'Validation Failed'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {validation.errors.length} errors, {validation.warnings.length} warnings
                      </p>
                    </div>
                  </div>

                  {/* Errors */}
                  {validation.errors.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-medium text-red-700">Errors</h4>
                      <div className="space-y-2">
                        {validation.errors.map((error, index) => (
                          <div
                            key={index}
                            className="rounded-lg border border-red-200 bg-red-50 p-3"
                          >
                            <div className="flex items-center space-x-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-red-700">{error}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {validation.warnings.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-medium text-yellow-700">Warnings</h4>
                      <div className="space-y-2">
                        {validation.warnings.map((warning, index) => (
                          <div
                            key={index}
                            className="rounded-lg border border-yellow-200 bg-yellow-50 p-3"
                          >
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm text-yellow-700">{warning}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Info */}
                  {validation.info.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-medium text-blue-700">Information</h4>
                      <div className="space-y-2">
                        {validation.info.map((info, index) => (
                          <div
                            key={index}
                            className="rounded-lg border border-blue-200 bg-blue-50 p-3"
                          >
                            <div className="flex items-center space-x-2">
                              <Info className="h-4 w-4 text-blue-500" />
                              <span className="text-sm text-blue-700">{info}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-500">
                  No validation data available. Generate work items first.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Export Status */}
      {exportStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Export Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status: {exportStatus.status}</span>
                <span className="text-sm text-gray-600">
                  {exportStatus.processedItems} / {exportStatus.totalItems} items
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${exportStatus.progress}%` }}
                ></div>
              </div>

              {/* Status Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Items:</span> {exportStatus.totalItems}
                </div>
                <div>
                  <span className="font-medium">Processed:</span> {exportStatus.processedItems}
                </div>
                <div>
                  <span className="font-medium">Exported:</span> {exportStatus.exportedItems.length}
                </div>
                <div>
                  <span className="font-medium">Errors:</span> {exportStatus.errors.length}
                </div>
              </div>

              {/* Success Items */}
              {exportStatus.exportedItems.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium text-green-700">Successfully Exported Items</h4>
                  <div className="max-h-32 space-y-1 overflow-y-auto">
                    {exportStatus.exportedItems.map((item, index) => (
                      <div key={index} className="rounded bg-green-50 p-2 text-sm text-green-600">
                        ID: {item.id} - {String(item.fields['System.Title'] || 'Untitled')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {exportStatus.errors.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium text-red-700">Export Errors</h4>
                  <div className="space-y-1">
                    {exportStatus.errors.map((error, index) => (
                      <div key={index} className="rounded bg-red-50 p-2 text-sm text-red-600">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Debug Info */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-600">
                  Debug Information
                </summary>
                <pre className="mt-2 overflow-x-auto rounded bg-gray-100 p-2 text-xs">
                  {JSON.stringify(exportStatus, null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
