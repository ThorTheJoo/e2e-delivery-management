'use client';

import { useState, useEffect } from 'react';
import { ADOWorkItemMapping, ADOValidationResult, ADOPreviewData, ADOExportStatus } from '@/types/ado';
import { Project, TMFOdaDomain, SpecSyncItem } from '@/types';
import { adoService } from '@/lib/ado-service';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Play,
  Square,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  RefreshCw,
  Filter,
  Search,
  Layers,
  GitBranch,
  Calendar,
  Clock,
  Target,
  Zap
} from 'lucide-react';

interface ADOIntegrationProps {
  project: Project;
  tmfDomains: TMFOdaDomain[];
  specSyncItems: SpecSyncItem[];
}

export function ADOIntegration({ project, tmfDomains, specSyncItems }: ADOIntegrationProps) {
  const [workItemMappings, setWorkItemMappings] = useState<ADOWorkItemMapping[]>([]);
  const [previewData, setPreviewData] = useState<ADOPreviewData | null>(null);
  const [validation, setValidation] = useState<ADOValidationResult | null>(null);
  const [exportStatus, setExportStatus] = useState<ADOExportStatus | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  const toast = useToast();

  useEffect(() => {
    // Initialize with all domains and capabilities selected
    const allDomainIds = tmfDomains.map(d => d.id);
    const allCapabilityIds = tmfDomains.flatMap(d => d.capabilities.map(c => c.id));
    const allRequirementIds = specSyncItems.map(r => r.id);
    
    setSelectedDomains(allDomainIds);
    setSelectedCapabilities(allCapabilityIds);
    setSelectedRequirements(allRequirementIds);
  }, [tmfDomains, specSyncItems]);

  const generateWorkItems = async () => {
    setIsGenerating(true);
    try {
      // Filter domains and items based on selection
      const filteredDomains = tmfDomains.filter(d => selectedDomains.includes(d.id));
      const filteredSpecSyncItems = specSyncItems.filter(r => selectedRequirements.includes(r.id));
      
      const mappings = adoService.generateWorkItemMappings(project, filteredDomains, filteredSpecSyncItems);
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

    setIsExporting(true);
    try {
      const status = await adoService.exportToADO(workItemMappings);
      setExportStatus(status);
      
      if (status.status === 'completed') {
        toast.showSuccess(`Successfully exported ${status.processedItems} work items to ADO`);
      } else {
        toast.showError(`Export failed: ${status.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Failed to export to ADO:', error);
      toast.showError('Failed to export to ADO');
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

  const filteredMappings = workItemMappings.filter(mapping => {
    const matchesSearch = mapping.targetTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mapping.targetDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || mapping.targetType === filterType;
    return matchesSearch && matchesFilter;
  });

  const getWorkItemIcon = (type: string) => {
    switch (type) {
      case 'epic': return <Target className="h-4 w-4" />;
      case 'feature': return <Layers className="h-4 w-4" />;
      case 'userstory': return <Users className="h-4 w-4" />;
      case 'task': return <Settings className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getWorkItemColor = (type: string) => {
    switch (type) {
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'feature': return 'bg-blue-100 text-blue-800';
      case 'userstory': return 'bg-green-100 text-green-800';
      case 'task': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Azure DevOps Integration</h2>
          <p className="text-gray-600">Transform TMF domains and capabilities into ADO work items</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={generateWorkItems}
            disabled={isGenerating || selectedDomains.length === 0}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <p className="text-2xl font-bold">{tmfDomains.reduce((sum, d) => sum + d.capabilities.length, 0)}</p>
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
              <CardDescription>
                Overview of the ADO integration mapping strategy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mapping Strategy */}
              <div 
                className="cursor-pointer hover:bg-muted/50 p-4 rounded-lg transition-colors"
                onClick={() => toggleSection('strategy')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg border-2 border-blue-200">
                      {expandedSections.has('strategy') ? (
                        <ChevronDown className="w-5 h-5 text-blue-700" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-blue-700" />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-semibold text-purple-800 mb-2">Epic Level</h4>
                        <p className="text-sm text-purple-700">Project + TMF Domains → ADO Epic</p>
                        <p className="text-xs text-purple-600 mt-1">Each BSS transformation becomes an epic</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">Feature Level</h4>
                        <p className="text-sm text-blue-700">TMF Domains → ADO Features</p>
                        <p className="text-xs text-blue-600 mt-1">Each TMF domain becomes a feature</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">User Story Level</h4>
                        <p className="text-sm text-green-700">TMF Capabilities → ADO User Stories</p>
                        <p className="text-xs text-green-600 mt-1">Each capability becomes a user story</p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <h4 className="font-semibold text-orange-800 mb-2">Task Level</h4>
                        <p className="text-sm text-orange-700">SpecSync Requirements → ADO Tasks</p>
                        <p className="text-xs text-orange-600 mt-1">Each requirement becomes a task</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Selection */}
              <div 
                className="cursor-pointer hover:bg-muted/50 p-4 rounded-lg transition-colors"
                onClick={() => toggleSection('selection')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg border-2 border-green-200">
                      {expandedSections.has('selection') ? (
                        <ChevronDown className="w-5 h-5 text-green-700" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-green-700" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Data Selection</h3>
                      <p className="text-sm text-gray-600">Select which data to include in the integration</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {selectedDomains.length} domains, {selectedCapabilities.length} capabilities, {selectedRequirements.length} requirements
                    </Badge>
                  </div>
                </div>
                {expandedSections.has('selection') && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">TMF Domains</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {tmfDomains.map(domain => (
                            <label key={domain.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedDomains.includes(domain.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDomains([...selectedDomains, domain.id]);
                                  } else {
                                    setSelectedDomains(selectedDomains.filter(id => id !== domain.id));
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
                        <h4 className="font-medium mb-2">TMF Capabilities</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {tmfDomains.flatMap(d => d.capabilities).map(capability => (
                            <label key={capability.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedCapabilities.includes(capability.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCapabilities([...selectedCapabilities, capability.id]);
                                  } else {
                                    setSelectedCapabilities(selectedCapabilities.filter(id => id !== capability.id));
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
                        <h4 className="font-medium mb-2">SpecSync Requirements</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {specSyncItems.map(item => (
                            <label key={item.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedRequirements.includes(item.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRequirements([...selectedRequirements, item.id]);
                                  } else {
                                    setSelectedRequirements(selectedRequirements.filter(id => id !== item.id));
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
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search work items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
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
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No work items generated yet. Click "Generate Work Items" to get started.</p>
                    </div>
                  ) : (
                    filteredMappings.map((mapping, index) => (
                      <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              {getWorkItemIcon(mapping.targetType)}
                              <Badge className={getWorkItemColor(mapping.targetType)}>
                                {mapping.targetType.toUpperCase()}
                              </Badge>
                              <h3 className="font-semibold">{mapping.targetTitle}</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{mapping.targetDescription}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Source: {mapping.sourceType}</span>
                              <span>Priority: {mapping.priority}</span>
                              {mapping.estimatedEffort && <span>Effort: {mapping.estimatedEffort}d</span>}
                              {mapping.storyPoints && <span>Story Points: {mapping.storyPoints}</span>}
                            </div>
                            {mapping.tags && mapping.tags.length > 0 && (
                              <div className="flex items-center space-x-1 mt-2">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{previewData.summary.totalItems}</div>
                        <div className="text-sm text-gray-600">Total Items</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{previewData.summary.totalEffort}</div>
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
                          <span className="font-medium">{previewData.summary.breakdown.features}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>User Stories:</span>
                          <span className="font-medium">{previewData.summary.breakdown.userStories}</span>
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
                      <div key={index} className="p-3 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-900">{epic.targetTitle}</h4>
                        <p className="text-sm text-purple-700 mt-1">{epic.targetDescription}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className="bg-purple-100 text-purple-800">Epic</Badge>
                          <span className="text-xs text-purple-600">Effort: {epic.estimatedEffort}d</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No preview data available. Generate work items first.</p>
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
                      <h4 className="font-medium text-red-700 mb-2">Errors</h4>
                      <div className="space-y-2">
                        {validation.errors.map((error, index) => (
                          <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
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
                      <h4 className="font-medium text-yellow-700 mb-2">Warnings</h4>
                      <div className="space-y-2">
                        {validation.warnings.map((warning, index) => (
                          <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
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
                      <h4 className="font-medium text-blue-700 mb-2">Information</h4>
                      <div className="space-y-2">
                        {validation.info.map((info, index) => (
                          <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
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
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No validation data available. Generate work items first.</p>
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
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportStatus.progress}%` }}
                ></div>
              </div>
              {exportStatus.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-2">Export Errors</h4>
                  <div className="space-y-1">
                    {exportStatus.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600">{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
