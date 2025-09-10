'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Collapsible } from '@/components/ui/collapsible';
import { 
  Settings, 
  RefreshCw, 
  Save, 
  Eye, 
  Search,
  Plus,
  Trash2,
  Check
} from 'lucide-react';
import { 
  BOMConfiguration as BOMConfigType, 
  BOMConfigState, 
  BOMExportTemplate,
  BUILT_IN_TEMPLATES 
} from '@/types/bom-config';
import { fieldDiscovery } from '@/lib/field-discovery';
import { bomConfigStorage } from '@/lib/bom-config-storage';
import { useToast } from '@/hooks/use-toast';

interface BOMConfigurationProps {
  onConfigurationChange?: (selectedFields: string[]) => void;
}

export function BOMConfiguration({ onConfigurationChange }: BOMConfigurationProps) {
  const [state, setState] = useState<BOMConfigState>({
    availableFields: [],
    categories: [],
    selectedFields: [],
    configurations: [],
    activeConfiguration: null,
    isDiscovering: false,
    lastDiscovery: null,
    exportTemplates: [...BUILT_IN_TEMPLATES]
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  const [newConfigDescription, setNewConfigDescription] = useState('');
  const [isCreatingConfig, setIsCreatingConfig] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const toast = useToast();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load saved configurations
  useEffect(() => {
    loadConfigurations();
  }, []);

  // Notify parent of configuration changes
  useEffect(() => {
    if (onConfigurationChange) {
      onConfigurationChange(state.selectedFields);
    }
  }, [state.selectedFields, onConfigurationChange]);

  const loadInitialData = async () => {
    setState(prev => ({ ...prev, isDiscovering: true }));
    try {
      const discoveryResult = await fieldDiscovery.discoverFields();
      setState(prev => ({
        ...prev,
        availableFields: discoveryResult.fields,
        categories: discoveryResult.categories,
        lastDiscovery: discoveryResult.lastUpdated,
        isDiscovering: false
      }));
    } catch (error) {
      console.error('Failed to discover fields:', error);
      toast.showError('Field Discovery Failed', 'Could not discover available fields');
      setState(prev => ({ ...prev, isDiscovering: false }));
    }
  };

  const loadConfigurations = () => {
    try {
      const configurations = bomConfigStorage.getAllConfigurations();
      setState(prev => ({ ...prev, configurations }));
      
      // Load active configuration if available
      const activeConfig = bomConfigStorage.getActiveConfiguration();
      if (activeConfig) {
        setState(prev => ({ 
          ...prev, 
          selectedFields: activeConfig.selectedFields,
          activeConfiguration: activeConfig.id
        }));
      } else if (configurations.length === 0) {
        // Create default configuration if none exists
        const defaultConfig = bomConfigStorage.createDefaultConfiguration();
        setState(prev => ({ 
          ...prev, 
          configurations: [defaultConfig],
          selectedFields: defaultConfig.selectedFields,
          activeConfiguration: defaultConfig.id
        }));
      }
    } catch (error) {
      console.error('Failed to load configurations:', error);
    }
  };


  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    setState(prev => ({
      ...prev,
      selectedFields: checked 
        ? [...prev.selectedFields, fieldId]
        : prev.selectedFields.filter(id => id !== fieldId)
    }));
  };

  const handleSelectAll = (categoryId: string) => {
    const category = state.categories.find(c => c.id === categoryId);
    if (!category) return;

    const categoryFieldIds = category.fields.map(f => f.id);
    const allSelected = categoryFieldIds.every(id => state.selectedFields.includes(id));

    setState(prev => ({
      ...prev,
      selectedFields: allSelected
        ? prev.selectedFields.filter(id => !categoryFieldIds.includes(id))
        : Array.from(new Set([...prev.selectedFields, ...categoryFieldIds]))
    }));
  };

  const handleTemplateSelect = (template: BOMExportTemplate) => {
    setState(prev => ({
      ...prev,
      selectedFields: template.fieldIds,
      activeConfiguration: null
    }));
    toast.showSuccess('Template Applied', `Applied ${template.name} template`);
  };

  const handleCreateConfiguration = () => {
    if (!newConfigName.trim()) {
      toast.showError('Invalid Name', 'Configuration name is required');
      return;
    }

    const newConfig: BOMConfigType = {
      id: `config-${Date.now()}`,
      name: newConfigName.trim(),
      description: newConfigDescription.trim(),
      selectedFields: state.selectedFields,
      isDefault: state.configurations.length === 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0'
    };

    try {
      bomConfigStorage.saveConfiguration(newConfig);
      bomConfigStorage.setActiveConfiguration(newConfig.id);
      
      const updatedConfigurations = bomConfigStorage.getAllConfigurations();
      setState(prev => ({
        ...prev,
        configurations: updatedConfigurations,
        activeConfiguration: newConfig.id
      }));

      setNewConfigName('');
      setNewConfigDescription('');
      setIsCreatingConfig(false);
      toast.showSuccess('Configuration Saved', `Saved configuration: ${newConfig.name}`);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.showError('Save Failed', 'Could not save configuration');
    }
  };

  const handleLoadConfiguration = (config: BOMConfigType) => {
    try {
      bomConfigStorage.setActiveConfiguration(config.id);
      setState(prev => ({
        ...prev,
        selectedFields: config.selectedFields,
        activeConfiguration: config.id
      }));
      toast.showSuccess('Configuration Loaded', `Loaded configuration: ${config.name}`);
    } catch (error) {
      console.error('Failed to load configuration:', error);
      toast.showError('Load Failed', 'Could not load configuration');
    }
  };

  const handleDeleteConfiguration = (configId: string) => {
    try {
      const success = bomConfigStorage.deleteConfiguration(configId);
      if (success) {
        const updatedConfigurations = bomConfigStorage.getAllConfigurations();
        setState(prev => ({
          ...prev,
          configurations: updatedConfigurations,
          activeConfiguration: state.activeConfiguration === configId ? null : state.activeConfiguration,
          selectedFields: state.activeConfiguration === configId ? [] : state.selectedFields
        }));
        toast.showSuccess('Configuration Deleted', 'Configuration has been removed');
      } else {
        toast.showError('Delete Failed', 'Configuration not found');
      }
    } catch (error) {
      console.error('Failed to delete configuration:', error);
      toast.showError('Delete Failed', 'Could not delete configuration');
    }
  };

  const handleRefreshFields = async () => {
    await loadInitialData();
    toast.showSuccess('Fields Refreshed', 'Field discovery completed');
  };

  const generatePreview = () => {
    // Generate sample data for preview
    const sampleData = state.selectedFields.map(fieldId => {
      const field = state.availableFields.find(f => f.id === fieldId);
      return {
        field: field?.displayName || fieldId,
        sampleValue: field?.sampleValue || 'Sample Data',
        type: field?.type || 'string'
      };
    });
    setPreviewData(sampleData);
  };

  const filteredCategories = state.categories.filter(category => {
    if (selectedCategory !== 'all' && category.id !== selectedCategory) {
      return false;
    }

    const filteredFields = category.fields.filter(field => {
      const matchesSearch = field.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           field.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSelection = !showOnlySelected || state.selectedFields.includes(field.id);
      return matchesSearch && matchesSelection;
    });

    return filteredFields.length > 0;
  });

  const selectedFieldsCount = state.selectedFields.length;
  const totalFieldsCount = state.availableFields.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                BOM Export Configuration
              </CardTitle>
              <CardDescription>
                Configure which fields to include in your Bill of Materials exports
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshFields}
                disabled={state.isDiscovering}
              >
                <RefreshCw className={`h-4 w-4 ${state.isDiscovering ? 'animate-spin' : ''}`} />
                Refresh Fields
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Selected: {selectedFieldsCount} of {totalFieldsCount} fields</span>
            {state.lastDiscovery && (
              <span>Last updated: {new Date(state.lastDiscovery).toLocaleString()}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="fields" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fields">Field Selection</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="configurations">Saved Configurations</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Field Selection Tab */}
        <TabsContent value="fields" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search fields..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {state.categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-only-selected"
                    checked={showOnlySelected}
                    onCheckedChange={(checked) => setShowOnlySelected(checked === true)}
                  />
                  <Label htmlFor="show-only-selected" className="text-sm">
                    Show only selected
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Field Categories */}
          <div className="space-y-4">
            {filteredCategories.map(category => {
              const categorySelectedCount = category.fields.filter(f => 
                state.selectedFields.includes(f.id)
              ).length;
              const isAllSelected = category.fields.length > 0 && 
                categorySelectedCount === category.fields.length;

              return (
                <Card key={category.id}>
                  <Collapsible
                    title={`${category.name} (${categorySelectedCount}/${category.fields.length})`}
                    defaultCollapsed={!category.isExpanded}
                    className="border-0 shadow-none"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {category.source}
                        </Badge>
                        {category.description && (
                          <span className="text-sm text-muted-foreground">
                            {category.description}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectAll(category.id)}
                      >
                        {isAllSelected ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {category.fields.map(field => (
                        <div key={field.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                          <Checkbox
                            id={field.id}
                            checked={state.selectedFields.includes(field.id)}
                            onCheckedChange={(checked) => 
                              handleFieldToggle(field.id, checked as boolean)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Label 
                                htmlFor={field.id} 
                                className="font-medium cursor-pointer"
                              >
                                {field.displayName}
                              </Label>
                              {field.isRequired && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                              {field.isCalculated && (
                                <Badge variant="secondary" className="text-xs">
                                  Calculated
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {field.type}
                              </Badge>
                            </div>
                            {field.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {field.description}
                              </p>
                            )}
                            {field.sampleValue && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Sample: {String(field.sampleValue).substring(0, 100)}
                                {String(field.sampleValue).length > 100 ? '...' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Templates</CardTitle>
              <CardDescription>
                Pre-configured field sets for common export scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {state.exportTemplates.map(template => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        {template.isBuiltIn && (
                          <Badge variant="secondary">Built-in</Badge>
                        )}
                      </div>
                      {template.description && (
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {template.fieldIds.length} fields
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          Apply Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Saved Configurations Tab */}
        <TabsContent value="configurations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Saved Configurations</CardTitle>
                  <CardDescription>
                    Save and manage your custom field configurations
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsCreatingConfig(true)}
                  disabled={state.selectedFields.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Save Current
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isCreatingConfig && (
                <Card className="mb-4">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="config-name">Configuration Name</Label>
                        <Input
                          id="config-name"
                          value={newConfigName}
                          onChange={(e) => setNewConfigName(e.target.value)}
                          placeholder="Enter configuration name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="config-description">Description (Optional)</Label>
                        <Input
                          id="config-description"
                          value={newConfigDescription}
                          onChange={(e) => setNewConfigDescription(e.target.value)}
                          placeholder="Enter description"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleCreateConfiguration}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Configuration
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsCreatingConfig(false);
                            setNewConfigName('');
                            setNewConfigDescription('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                {state.configurations.map(config => (
                  <Card key={config.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{config.name}</h3>
                            {config.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                            {state.activeConfiguration === config.id && (
                              <Badge variant="default">
                                <Check className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                          {config.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {config.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span>{config.selectedFields.length} fields</span>
                            <span>Created: {new Date(config.createdAt).toLocaleDateString()}</span>
                            <span>Updated: {new Date(config.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLoadConfiguration(config)}
                          >
                            Load
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteConfiguration(config.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {state.configurations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No saved configurations yet</p>
                    <p className="text-sm">Select some fields and save your first configuration</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Export Preview</CardTitle>
                  <CardDescription>
                    Preview how your selected fields will appear in the export
                  </CardDescription>
                </div>
                <Button onClick={generatePreview} disabled={state.selectedFields.length === 0}>
                  <Eye className="h-4 w-4 mr-2" />
                  Generate Preview
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {previewData.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Preview of {previewData.length} selected fields:
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-medium">Field</th>
                          <th className="text-left p-3 font-medium">Type</th>
                          <th className="text-left p-3 font-medium">Sample Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-3 font-medium">{item.field}</td>
                            <td className="p-3">
                              <Badge variant="outline">{item.type}</Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">{item.sampleValue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No fields selected for preview</p>
                  <p className="text-sm">Select some fields and generate a preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
