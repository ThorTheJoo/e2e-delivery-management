'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { BlueDolphinConfig, BlueDolphinObjectEnhanced } from '@/types/blue-dolphin';

interface BlueDolphinIntegrationProps {
  config: BlueDolphinConfig;
}

export function BlueDolphinIntegration({ config }: BlueDolphinIntegrationProps) {
  const [objects, setObjects] = useState<BlueDolphinObjectEnhanced[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objectCount, setObjectCount] = useState(0);
  const [objectTotal, setObjectTotal] = useState(0);
  const [selectedEndpoint, setSelectedEndpoint] = useState('/Objects');
  const [filter, setFilter] = useState('');
  const [objectDefinitionFilter, setObjectDefinitionFilter] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState('');
  const [useEnhancedFields, setUseEnhancedFields] = useState(true);
  const [showEnhancedFields, setShowEnhancedFields] = useState(true);
  const [resultsLimit, setResultsLimit] = useState(10);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['debug', 'raw-data', 'enhanced-analysis']));

  const loadObjects = useCallback(async () => {
    if (!config.odataUrl) {
      setError('OData URL not configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const action = useEnhancedFields ? 'get-objects-enhanced' : 'get-objects';
      
      // Build combined filter including workspace filter
      let combinedFilter = filter;
      if (workspaceFilter && workspaceFilter !== 'all') {
        const workspaceCondition = `Workspace eq '${workspaceFilter}'`;
        combinedFilter = filter ? `${filter} and ${workspaceCondition}` : workspaceCondition;
      }
      
      const requestBody = {
        action: action,
        config: config,
        data: {
          endpoint: selectedEndpoint,
          filter: combinedFilter,
          top: resultsLimit, // Use the selected results limit
          orderby: 'Title asc',
          ...(useEnhancedFields && { moreColumns: true })
        }
      };

      console.log(`Loading objects with ${action}...`, requestBody);

      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        setObjects(result.data || []);
        setObjectCount(result.count || 0);
        setObjectTotal(result.total || 0);
        console.log(`✅ Loaded ${result.count} objects with enhanced fields:`, result.enhancedFields);
      } else {
        setError(result.error || 'Failed to load objects');
        console.error('❌ Failed to load objects:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Error loading objects:', error);
    } finally {
      setLoading(false);
    }
  }, [config, selectedEndpoint, filter, objectDefinitionFilter, workspaceFilter, useEnhancedFields, resultsLimit]);

  const clearObjects = () => {
    setObjects([]);
    setObjectCount(0);
    setObjectCount(0);
    setObjectTotal(0);
    setError(null);
    setWorkspaceFilter('');
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

  // Filter objects by definition if filter is set
  const filteredObjects = objectDefinitionFilter 
    ? objects.filter(obj => obj.Definition === objectDefinitionFilter)
    : objects;

  // Get unique definitions for filtering
  const uniqueDefinitions = Array.from(new Set(objects.map(obj => obj.Definition))).sort();

  // Get enhanced field count for an object
  const getEnhancedFieldCount = (obj: BlueDolphinObjectEnhanced) => {
    // Check all possible enhanced fields, not just a subset
    const allEnhancedFields = Object.keys(obj).filter(key => 
      key.startsWith('Object_Properties_') || 
      key.startsWith('Deliverable_Object_Status_') || 
      key.startsWith('Ameff_properties_') ||
      key.startsWith('Resource_x26_Rate_') ||
      key.startsWith('External_Design_')
    );
    return allEnhancedFields.filter(field => obj[field as keyof BlueDolphinObjectEnhanced] && obj[field as keyof BlueDolphinObjectEnhanced] !== '').length;
  };

  // ------------------------------
  // Relationship Data (Relations_table)
  // ------------------------------

  interface BlueDolphinRelation {
    Id: string;
    RelationshipId: string;
    BlueDolphinObjectItemId: string;
    RelatedBlueDolphinObjectItemId: string;
    RelationshipDefinitionId?: string;
    RelationshipDefinitionName?: string;
    BlueDolphinObjectWorkspaceName?: string;
    BlueDolphinObjectDefinitionName?: string;
    RelatedBlueDolphinObjectWorkspaceName?: string;
    RelatedBlueDolphinObjectDefinitionName?: string;
    Type?: string;
    Name?: string;
    IsRelationshipDirectionAlternative?: boolean;
    [key: string]: any;
  }

  const [relations, setRelations] = useState<BlueDolphinRelation[]>([]);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [relationsError, setRelationsError] = useState<string | null>(null);
  const [relationsTop, setRelationsTop] = useState(10);

  // Filters for relations
  const [relDefName, setRelDefName] = useState('');
  const [relSrcDef, setRelSrcDef] = useState('');
  const [relTgtWs, setRelTgtWs] = useState('');
  const [relTgtDef, setRelTgtDef] = useState('');
  const [relType, setRelType] = useState('');
  const [relName, setRelName] = useState('');
  const [relRawFilter, setRelRawFilter] = useState('');

  const buildRelationsFilter = (): string => {
    const parts: string[] = [];
    if (relDefName) parts.push(`RelationshipDefinitionName eq '${relDefName}'`);
    if (relSrcDef) parts.push(`BlueDolphinObjectDefinitionName eq '${relSrcDef}'`);
    if (relTgtWs) parts.push(`RelatedBlueDolphinObjectWorkspaceName eq '${relTgtWs}'`);
    if (relTgtDef) parts.push(`RelatedBlueDolphinObjectDefinitionName eq '${relTgtDef}'`);
    if (relType) parts.push(`Type eq '${relType}'`);
    if (relName) parts.push(`Name eq '${relName}'`);
    if (relRawFilter) parts.push(`(${relRawFilter})`);
    return parts.join(' and ');
  };

  const loadRelations = useCallback(async () => {
    if (!config.odataUrl) {
      setRelationsError('OData URL not configured');
      return;
    }
    setRelationsLoading(true);
    setRelationsError(null);
    try {
      const requestBody = {
        action: 'get-objects-enhanced',
        config: config,
        data: {
          endpoint: '/Relations',
          filter: buildRelationsFilter(),
          top: relationsTop,
          moreColumns: true
        }
      };

      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const result = await response.json();
      if (result.success) {
        setRelations(result.data || []);
      } else {
        setRelationsError(result.error || 'Failed to load relations');
      }
    } catch (e) {
      setRelationsError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setRelationsLoading(false);
    }
  }, [config, relDefName, relSrcDef, relTgtWs, relTgtDef, relType, relName, relRawFilter, relationsTop]);

  const unique = (arr: (string | undefined)[]) => Array.from(new Set(arr.filter(Boolean) as string[])).sort();
  const uniqueRelTypes = unique(relations.map(r => r.Type));
  const uniqueRelNames = unique(relations.map(r => r.Name));
  const uniqueRelDefNames = unique(relations.map(r => r.RelationshipDefinitionName));
  const uniqueSrcDefs = unique(relations.map(r => r.BlueDolphinObjectDefinitionName));
  const uniqueTgtDefs = unique(relations.map(r => r.RelatedBlueDolphinObjectDefinitionName));
  
  // Enhanced workspace list with additional predefined options
  const baseWorkspaces = unique(relations.map(r => r.RelatedBlueDolphinObjectWorkspaceName));
  const additionalWorkspaces = [
    'CSG International',
    'Product Architecture', 
    'Customer Q',
    'Simulated Case Study',
    'RR'
  ];
  const uniqueTgtWs = Array.from(new Set([...baseWorkspaces, ...additionalWorkspaces])).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Blue Dolphin Integration</h2>
        <div className="flex items-center space-x-2">
          <Badge variant={useEnhancedFields ? "default" : "secondary"}>
            {useEnhancedFields ? "Enhanced Fields" : "Standard Fields"}
          </Badge>
          {useEnhancedFields && (
            <Badge variant="outline" className="text-xs">
              MoreColumns=true
            </Badge>
          )}
        </div>
      </div>

      {/* Configuration Display */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><strong>Protocol:</strong> {config.protocol}</div>
          <div><strong>OData URL:</strong> {config.odataUrl}</div>
          <div><strong>Authentication:</strong> {config.apiKey ? 'API Key' : config.username ? 'Basic Auth' : 'None'}</div>
        </CardContent>
      </Card>

      {/* Object Retrieval Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Object Retrieval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="endpoint">Endpoint</Label>
              <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="/Objects">Objects</SelectItem>
                  <SelectItem value="/Domains">Domains</SelectItem>
                  <SelectItem value="/Capabilities">Capabilities</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter">Filter (OData)</Label>
              <Input
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="e.g., Definition eq 'Application Component'"
              />
              <div className="text-xs text-gray-500 mt-1">
                Valid OData syntax: Definition eq 'Business Process', contains(Title, 'Customer')
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="resultsLimit">Results Limit</Label>
              <Select value={resultsLimit.toString()} onValueChange={(value) => setResultsLimit(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 objects</SelectItem>
                  <SelectItem value="25">25 objects</SelectItem>
                  <SelectItem value="50">50 objects</SelectItem>
                  <SelectItem value="100">100 objects</SelectItem>
                  <SelectItem value="250">250 objects</SelectItem>
                  <SelectItem value="500">500 objects</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500 mt-1">
                Number of objects to retrieve (higher = more data, slower response)
                {resultsLimit > 100 && (
                  <div className="text-orange-600 font-medium mt-1">
                    ⚠️ High limit selected - may be slow with enhanced fields
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="workspaceFilter">Workspace Filter</Label>
              <Select value={workspaceFilter || 'all'} onValueChange={(value) => setWorkspaceFilter(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Workspaces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workspaces</SelectItem>
                  <SelectItem value="CSG International">CSG International</SelectItem>
                  <SelectItem value="Product Architecture">Product Architecture</SelectItem>
                  <SelectItem value="Customer Q">Customer Q</SelectItem>
                  <SelectItem value="Simulated Case Study">Simulated Case Study</SelectItem>
                  <SelectItem value="RR">RR</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500 mt-1">
                Filter objects by workspace name
              </div>
            </div>
            <div>
              <Label htmlFor="textSearch">Text Search (Simple)</Label>
              <Input
                id="textSearch"
                placeholder="e.g., Customer Connect, User Interface"
                onChange={(e) => {
                  const searchText = e.target.value.trim();
                  if (searchText) {
                    // Convert simple text to OData contains filter
                    setFilter(`contains(Title, '${searchText}')`);
                  } else {
                    setFilter('');
                  }
                }}
              />
              <div className="text-xs text-gray-500 mt-1">
                Type text to search in object titles (automatically converts to OData filter)
              </div>
            </div>
          </div>
          


          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useEnhancedFields"
                checked={useEnhancedFields}
                onChange={(e) => setUseEnhancedFields(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="useEnhancedFields">Use Enhanced Fields (MoreColumns=true)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showEnhancedFields"
                checked={showEnhancedFields}
                onChange={(e) => setShowEnhancedFields(e.target.checked)}
                className="rounded"
                disabled={!useEnhancedFields}
              />
              <Label htmlFor="showEnhancedFields">Show Enhanced Fields in Cards</Label>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={loadObjects} disabled={loading}>
              {loading ? 'Loading...' : 'Load Objects'}
            </Button>
            <Button onClick={clearObjects} variant="outline">
              Clear
            </Button>
          </div>
          
          {/* Preset Filter Buttons */}
          <div className="mt-2">
            <Label className="text-xs text-gray-600 mb-2 block">Quick Filters:</Label>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => {
                  setFilter("Definition eq 'Business Process'");
                  loadObjects();
                }} 
                variant="outline" 
                size="sm"
              >
                Business Process
              </Button>
              <Button 
                onClick={() => {
                  setFilter("Definition eq 'Application Component'");
                  loadObjects();
                }} 
                variant="outline" 
                size="sm"
              >
                Application Component
              </Button>
              <Button 
                onClick={() => {
                  setFilter("contains(Title, 'Customer')");
                  loadObjects();
                }} 
                variant="outline" 
                size="sm"
              >
                Title Contains 'Customer'
              </Button>
              <Button 
                onClick={() => {
                  setFilter("Status eq 'Archived'");
                  loadObjects();
                }} 
                variant="outline" 
                size="sm"
              >
                Archived Objects
              </Button>
              <Button 
                onClick={() => {
                  setFilter("");
                  loadObjects();
                }} 
                variant="outline" 
                size="sm"
              >
                All Objects
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {objects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Retrieved Objects ({filteredObjects.length} of {objectTotal})</span>
              <div className="flex items-center space-x-2">
                {useEnhancedFields && (
                  <Badge variant="outline">
                    {objects.reduce((sum, obj) => sum + getEnhancedFieldCount(obj), 0)} Enhanced Fields
                  </Badge>
                )}
                                            <Badge variant="secondary">Preview: {resultsLimit}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Debug Information */}
            <Card className="mb-4">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('debug')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Debug Information</CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {expandedSections.has('debug') ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {expandedSections.has('debug') && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><strong>Action:</strong> {useEnhancedFields ? 'get-objects-enhanced' : 'get-objects'}</div>
                    <div><strong>Endpoint:</strong> {selectedEndpoint}</div>
                    <div><strong>Filter:</strong> {filter || 'None'}</div>
                    <div><strong>MoreColumns:</strong> {useEnhancedFields ? 'true' : 'false'}</div>
                    <div><strong>Enhanced Fields:</strong> {useEnhancedFields ? 'Enabled' : 'Disabled'}</div>
                    <div><strong>Total Objects Available:</strong> {objectTotal}</div>
                    <div><strong>Sample Object Fields:</strong> {objects.length > 0 ? Object.keys(objects[0]).length : 0} total fields</div>
                    {objects.length > 0 && (
                      <div><strong>Enhanced Field Count:</strong> {getEnhancedFieldCount(objects[0])} populated</div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Raw Data Preview (for debugging) */}
            <Card className="mb-4">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('raw-data')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Raw Data Preview (First Object)</CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {expandedSections.has('raw-data') ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {expandedSections.has('raw-data') && (
                <CardContent className="pt-0">
                  <div className="p-3 bg-gray-100 rounded-md text-xs font-mono overflow-auto max-h-40">
                    <pre>{objects.length > 0 ? JSON.stringify(objects[0], null, 2) : 'No objects'}</pre>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Section Control Buttons */}
            <div className="mb-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setExpandedSections(new Set(['debug', 'raw-data', 'enhanced-analysis']))}
              >
                Expand All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setExpandedSections(new Set())}
              >
                Collapse All
              </Button>
            </div>

            {/* Enhanced Fields Analysis (for debugging) */}
            {objects.length > 0 && (
              <Card className="mb-4">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection('enhanced-analysis')}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Enhanced Fields Analysis (First Object)</CardTitle>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      {expandedSections.has('enhanced-analysis') ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {expandedSections.has('enhanced-analysis') && (
                  <CardContent className="pt-0">
                    <div className="p-3 bg-blue-50 rounded-md text-xs">
                      <div className="font-semibold mb-2">All Available Fields:</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.keys(objects[0]).map(field => {
                          const value = objects[0][field as keyof BlueDolphinObjectEnhanced];
                          const isEnhanced = field.startsWith('Object_Properties_') || 
                                           field.startsWith('Deliverable_Object_Status_') || 
                                           field.startsWith('Ameff_properties_') ||
                                           field.startsWith('Resource_x26_Rate_') ||
                                           field.startsWith('External_Design_');
                          return (
                            <div key={field} className={`p-1 rounded ${isEnhanced ? 'bg-blue-100' : 'bg-gray-100'}`}>
                              <div className="font-mono text-xs">{field}</div>
                              <div className="text-xs text-gray-600">
                                {value === '' ? 'EMPTY' : value === null ? 'NULL' : value === undefined ? 'UNDEFINED' : `"${value}"`}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Enhanced Fields Summary */}
                      <div className="mt-3 p-2 bg-blue-100 rounded">
                        <div className="font-semibold mb-1">Enhanced Fields Summary:</div>
                        <div className="text-xs">
                          <div><strong>Total Fields:</strong> {Object.keys(objects[0]).length}</div>
                          <div><strong>Enhanced Fields:</strong> {Object.keys(objects[0]).filter(key => 
                            key.startsWith('Object_Properties_') || 
                            key.startsWith('Deliverable_Object_Status_') || 
                            key.startsWith('Ameff_properties_') ||
                            key.startsWith('Resource_x26_Rate_') ||
                            key.startsWith('External_Design_')
                          ).length}</div>
                          <div><strong>Populated Enhanced Fields:</strong> {getEnhancedFieldCount(objects[0])}</div>
                          <div><strong>Standard Fields:</strong> {Object.keys(objects[0]).filter(key => 
                            !key.startsWith('Object_Properties_') && 
                            !key.startsWith('Deliverable_Object_Status_') && 
                            !key.startsWith('Ameff_properties_') &&
                            !key.startsWith('Resource_x26_Rate_') &&
                            !key.startsWith('External_Design_')
                          ).length}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Filter Controls */}
            <div className="mb-4">
              <Label htmlFor="definitionFilter">Filter by Definition:</Label>
              <Select value={objectDefinitionFilter || "all"} onValueChange={(value) => setObjectDefinitionFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Definitions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Definitions</SelectItem>
                  {uniqueDefinitions.map(def => (
                    <SelectItem key={def} value={def}>{def}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Objects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredObjects.map((obj) => (
                <Card key={obj.ID} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="truncate">{obj.Title}</span>
                      <Badge variant="outline" className="text-xs">
                        {obj.Definition}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {/* Standard Fields */}
                    <div className="space-y-1">
                      <div><strong>Status:</strong> {obj.Status || 'N/A'}</div>
                      <div><strong>Workspace:</strong> {obj.Workspace || 'N/A'}</div>
                      <div><strong>Category:</strong> {obj.Category || 'N/A'}</div>
                      {obj.Completeness !== undefined && (
                        <div><strong>Completeness:</strong> {obj.Completeness}%</div>
                      )}
                      {obj.CreatedOn && (
                        <div><strong>Created:</strong> {new Date(obj.CreatedOn).toLocaleDateString()}</div>
                      )}
                    </div>

                    {/* Enhanced Fields (when enabled and available) */}
                    {useEnhancedFields && showEnhancedFields && (
                      <div className="border-t pt-2 mt-2">
                        <div className="font-semibold text-blue-600 mb-2">Enhanced Properties</div>
                        <div className="space-y-1">
                          {/* Show ALL enhanced fields that have values */}
                          {Object.keys(obj).filter(key => 
                            (key.startsWith('Object_Properties_') || 
                             key.startsWith('Deliverable_Object_Status_') || 
                             key.startsWith('Ameff_properties_') ||
                             key.startsWith('Resource_x26_Rate_') ||
                             key.startsWith('External_Design_')) &&
                            obj[key as keyof BlueDolphinObjectEnhanced] && 
                            obj[key as keyof BlueDolphinObjectEnhanced] !== ''
                          ).map(field => (
                            <div key={field}>
                              <strong>{field.replace(/_/g, ' ')}:</strong> {obj[field as keyof BlueDolphinObjectEnhanced]}
                            </div>
                          ))}
                        </div>
                        
                        {/* Show count of populated enhanced fields */}
                        <div className="text-xs text-gray-500 mt-2">
                          {getEnhancedFieldCount(obj)} enhanced fields populated
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-600">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------ */}
      {/* Relationship Data Section     */}
      {/* ------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle>Relationship Data (Relations_table)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Results Limit</Label>
              <Select value={relationsTop.toString()} onValueChange={(v) => setRelationsTop(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 relations</SelectItem>
                  <SelectItem value="25">25 relations</SelectItem>
                  <SelectItem value="50">50 relations</SelectItem>
                  <SelectItem value="100">100 relations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Raw OData Filter (optional)</Label>
              <Input value={relRawFilter} onChange={(e) => setRelRawFilter(e.target.value)} placeholder="e.g., Status eq 2" />
              <div className="text-xs text-gray-500 mt-1">Appends to chosen filters using AND</div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>RelationshipDefinitionName</Label>
              <Select value={relDefName || 'all'} onValueChange={(v) => setRelDefName(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueRelDefNames.map(v => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>BlueDolphinObjectDefinitionName</Label>
              <Select value={relSrcDef || 'all'} onValueChange={(v) => setRelSrcDef(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueSrcDefs.map(v => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>RelatedBlueDolphinObjectWorkspaceName</Label>
              <Select value={relTgtWs || 'all'} onValueChange={(v) => setRelTgtWs(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueTgtWs.map(v => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>RelatedBlueDolphinObjectDefinitionName</Label>
              <Select value={relTgtDef || 'all'} onValueChange={(v) => setRelTgtDef(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueTgtDefs.map(v => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={relType || 'all'} onValueChange={(v) => setRelType(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueRelTypes.map(v => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Name</Label>
              <Select value={relName || 'all'} onValueChange={(v) => setRelName(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueRelNames.map(v => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={loadRelations} disabled={relationsLoading}>{relationsLoading ? 'Loading...' : 'Load Relationships'}</Button>
            <Button variant="outline" onClick={() => setRelations([])}>Clear</Button>
          </div>

          {relationsError && (
            <div className="text-red-600 text-sm">{relationsError}</div>
          )}

          {relations.length > 0 && (
            <Card className="mt-4">
              <CardHeader
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('relations-debug')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Relations Debug & Preview ({relations.length})</CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {expandedSections.has('relations-debug') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {expandedSections.has('relations-debug') && (
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><strong>Endpoint:</strong> /Relations</div>
                    <div><strong>Filter:</strong> {buildRelationsFilter() || 'None'}</div>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-md text-xs font-mono overflow-auto max-h-40">
                    <pre>{JSON.stringify(relations[0], null, 2)}</pre>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {relations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {relations.map((rel) => (
                <Card key={`${rel.Id}-${rel.BlueDolphinObjectItemId}-${rel.RelatedBlueDolphinObjectItemId}`} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="truncate">{rel.RelationshipDefinitionName || rel.Type || 'Relation'}</span>
                      <Badge variant="outline" className="text-xs">{rel.Name || '—'}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    <div><strong>Type:</strong> {rel.Type || 'N/A'}</div>
                    <div><strong>Source:</strong> {rel.BlueDolphinObjectDefinitionName || 'N/A'} ({rel.BlueDolphinObjectItemId})</div>
                    <div><strong>Target:</strong> {rel.RelatedBlueDolphinObjectDefinitionName || 'N/A'} ({rel.RelatedBlueDolphinObjectItemId})</div>
                    <div><strong>Workspace (Target):</strong> {rel.RelatedBlueDolphinObjectWorkspaceName || 'N/A'}</div>
                    <div><strong>RelationshipId:</strong> {rel.RelationshipId}</div>
                    {typeof rel.IsRelationshipDirectionAlternative === 'boolean' && (
                      <div><strong>Directional:</strong> {rel.IsRelationshipDirectionAlternative ? 'Forward' : 'Reverse'}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
