'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { SpecSyncItem } from '@/types';
import type { BlueDolphinObjectEnhanced } from '@/types/blue-dolphin';

interface SpecSyncBlueDolphinMappingProps {
  specSyncItems: SpecSyncItem[];
  blueDolphinConfig: {
    protocol: string;
    apiUrl: string;
    odataUrl: string;
    apiKey: string;
    username: string;
    password: string;
  };
  onMappingComplete?: (results: MappingResult[]) => void; // NEW - Optional callback for relationship traversal
}

interface MappingResult {
  specSyncFunctionName: string;
  specSyncRequirementId: string;
  blueDolphinObject: BlueDolphinObjectEnhanced;
  matchType: 'exact' | 'contains';
  confidence: number;
}

interface FilterCriteria {
  workspace: string;
  status: string;
  objectType: string;
}

export function SpecSyncBlueDolphinMapping({ 
  specSyncItems, 
  blueDolphinConfig,
  onMappingComplete // NEW - Optional callback parameter
}: SpecSyncBlueDolphinMappingProps) {
  // State management
  // Selection is tracked at requirement+function granularity to avoid collapsing rows
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const SELECTION_DELIM = '|||';
  const buildSelectionKey = (requirementId: string, functionName: string) => `${requirementId}${SELECTION_DELIM}${functionName}`;
  const parseSelectionKey = (key: string): { requirementId: string; functionName: string } => {
    const [requirementId, ...rest] = key.split(SELECTION_DELIM);
    return { requirementId, functionName: rest.join(SELECTION_DELIM) };
  };
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    workspace: '',
    status: 'Accepted',
    objectType: 'Application Function'
  });
  const [availableWorkspaces, setAvailableWorkspaces] = useState<string[]>([]);
  const [mappingResults, setMappingResults] = useState<MappingResult[]>([]);
  // const [isLoading, setIsLoading] = useState(false); // Will be used in future iterations
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAvailableWorkspaces = useCallback(async () => {
    try {
      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-objects-enhanced',
          config: blueDolphinConfig,
          data: {
            endpoint: '/Objects',
            filter: "Definition eq 'Application Function'",
            top: 1000,
            moreColumns: true
          }
        })
      });

      const result = await response.json();
      if (result.success && result.data) {
        const workspaces = Array.from(new Set(
          result.data.map((obj: BlueDolphinObjectEnhanced) => obj.Workspace).filter(Boolean)
        )).sort() as string[];
        setAvailableWorkspaces(workspaces);
        console.log('📊 Available workspaces loaded:', workspaces);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    }
  }, [blueDolphinConfig]);

  // Load available workspaces on mount
  useEffect(() => {
    loadAvailableWorkspaces();
  }, [loadAvailableWorkspaces]);

  const handleRowSelection = (item: SpecSyncItem, checked: boolean) => {
    const rid = item.rephrasedRequirementId || item.requirementId;
    const key = buildSelectionKey(rid, item.functionName);
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (checked) next.add(key); else next.delete(key);
      return next;
    });
  };

  const handleSelectAll = () => {
    const keys = filteredSpecSyncItems.map(item => buildSelectionKey(item.rephrasedRequirementId || item.requirementId, item.functionName));
    setSelectedKeys(new Set(keys));
  };

  const handleClearSelection = () => {
    setSelectedKeys(new Set());
  };

  const filteredSpecSyncItems = specSyncItems.filter(item => 
    item.functionName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Debug logging for requirement IDs
  console.log('🔍 [SpecSync Mapping] SpecSync items loaded:', specSyncItems.length);
  console.log('📋 [SpecSync Mapping] Sample requirement IDs:');
  specSyncItems.slice(0, 5).forEach((item, index) => {
    console.log(`  ${index + 1}. requirementId: "${item.requirementId}"`);
    console.log(`     rephrasedRequirementId: "${item.rephrasedRequirementId}"`);
    console.log(`     functionName: "${item.functionName}"`);
  });

  const searchBlueDolphin = async () => {
    if (selectedKeys.size === 0) {
      setError('Please select at least one function name to search');
      return;
    }

    if (!filterCriteria.workspace) {
      setError('Please select a workspace');
      return;
    }

    setIsSearching(true);
    setError(null);
    setMappingResults([]);

    try {
      console.log('🔍 Starting Blue Dolphin search with criteria:', {
        selectedKeys: Array.from(selectedKeys),
        filterCriteria
      });

      // Build filter for Blue Dolphin query
      const workspaceFilter = `Workspace eq '${filterCriteria.workspace}'`;
      const definitionFilter = `Definition eq '${filterCriteria.objectType}'`;
      const statusFilter = filterCriteria.status !== 'all' ? `Status eq '${filterCriteria.status}'` : '';
      
      const filterParts = [workspaceFilter, definitionFilter, statusFilter].filter(Boolean);
      const combinedFilter = filterParts.join(' and ');

      console.log('📋 Blue Dolphin filter:', combinedFilter);

      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-objects-enhanced',
          config: blueDolphinConfig,
          data: {
            endpoint: '/Objects',
            filter: combinedFilter,
            moreColumns: true,
            top: 1000
          }
        })
      });

      const result = await response.json();
      console.log('📊 Blue Dolphin response:', result);

      if (result.success && result.data) {
        const blueDolphinObjects = result.data as BlueDolphinObjectEnhanced[];
        console.log('📋 Retrieved Blue Dolphin objects:', blueDolphinObjects.length);

        // Match SpecSync selection rows (requirement+function) to Blue Dolphin objects
        const matches: MappingResult[] = [];
        for (const key of Array.from(selectedKeys)) {
          const { requirementId, functionName } = parseSelectionKey(key);
          // Find the exact SpecSync row that was selected
          const specSyncItem = specSyncItems.find(item =>
            item.functionName === functionName &&
            (item.rephrasedRequirementId === requirementId || item.requirementId === requirementId)
          );
          if (!specSyncItem) continue;

          // Try exact match first
          let matchedObject = blueDolphinObjects.find(obj => 
            obj.Title === functionName
          );

          let matchType: 'exact' | 'contains' = 'exact';
          let confidence = 1.0;

          // Try contains match if exact match not found
          if (!matchedObject) {
            matchedObject = blueDolphinObjects.find(obj => 
              obj.Title.toLowerCase().includes(functionName.toLowerCase())
            );
            matchType = 'contains';
            confidence = 0.7;
          }

          if (matchedObject) {
            console.log(`🎯 [SpecSync Mapping] Creating mapping for function: ${functionName}, requirementId: ${specSyncItem.rephrasedRequirementId || specSyncItem.requirementId}`);
            matches.push({
              specSyncFunctionName: functionName,
              specSyncRequirementId: specSyncItem.rephrasedRequirementId || specSyncItem.requirementId,
              blueDolphinObject: matchedObject,
              matchType,
              confidence
            });
          }
        }

        console.log('✅ Mapping results:', matches);
        setMappingResults(matches);
        onMappingComplete?.(matches); // NEW - Call callback if provided for relationship traversal
      } else {
        setError(result.error || 'Failed to retrieve Blue Dolphin objects');
      }
    } catch (error) {
      console.error('❌ Search failed:', error);
      setError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const exportResults = () => {
    if (mappingResults.length === 0) return;

    // Get all unique enhanced field names from all Blue Dolphin objects
    const allEnhancedFields = new Set<string>();
    mappingResults.forEach(result => {
      Object.keys(result.blueDolphinObject).forEach(key => {
        if (key.startsWith('Object_Properties_') || 
            key.startsWith('Deliverable_Object_Status_') || 
            key.startsWith('Ameff_properties_') ||
            key.startsWith('Resource_x26_Rate_') ||
            key.startsWith('External_Design_')) {
          allEnhancedFields.add(key);
        }
      });
    });

    // Create header row with all fields
    const headers = [
      'SpecSync Function Name',
      'SpecSync Requirement ID', 
      'Blue Dolphin ID',
      'Blue Dolphin Title',
      'Blue Dolphin Definition',
      'Blue Dolphin Description',
      'Blue Dolphin Status',
      'Blue Dolphin Workspace',
      'Blue Dolphin CreatedOn',
      'Blue Dolphin ChangedOn',
      'Blue Dolphin ArchimateType',
      'Blue Dolphin Category',
      'Blue Dolphin ObjectLifecycleState',
      'Blue Dolphin Completeness',
      'Blue Dolphin CreatedBy',
      'Blue Dolphin ChangedBy',
      'Match Type',
      'Confidence',
      ...Array.from(allEnhancedFields).sort()
    ];

    // Create data rows with all fields
    const csvContent = [
      headers,
      ...mappingResults.map(result => {
        const baseFields = [
          result.specSyncFunctionName,
          result.specSyncRequirementId,
          result.blueDolphinObject.ID,
          result.blueDolphinObject.Title,
          result.blueDolphinObject.Definition || '',
          result.blueDolphinObject.Description || '',
          result.blueDolphinObject.Status || '',
          result.blueDolphinObject.Workspace || '',
          result.blueDolphinObject.CreatedOn || '',
          result.blueDolphinObject.ChangedOn || '',
          result.blueDolphinObject.ArchimateType || '',
          result.blueDolphinObject.Category || '',
          result.blueDolphinObject.ObjectLifecycleState || '',
          result.blueDolphinObject.Completeness?.toString() || '',
          result.blueDolphinObject.CreatedBy || '',
          result.blueDolphinObject.ChangedBy || '',
          result.matchType,
          result.confidence.toString()
        ];

        // Add enhanced fields in the same order as headers
        const enhancedFields = Array.from(allEnhancedFields).sort().map(field => 
          result.blueDolphinObject[field as keyof BlueDolphinObjectEnhanced] || ''
        );

        return [...baseFields, ...enhancedFields];
      })
    ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `specsync-blue-dolphin-mapping-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">SpecSync to Model Function Mapping</h3>
          <p className="text-sm text-gray-600">
            Map SpecSync function names to Blue Dolphin Application Functions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {specSyncItems.length} SpecSync Items
          </Badge>
          <Badge variant="outline">
            {selectedKeys.size} Selected
          </Badge>
        </div>
      </div>

      {/* Filter Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Criteria</CardTitle>
          <CardDescription>
            Configure Blue Dolphin search parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workspace">Workspace</Label>
              <Select
                value={filterCriteria.workspace}
                onValueChange={(value) => setFilterCriteria(prev => ({ ...prev, workspace: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                  {availableWorkspaces.map(workspace => (
                    <SelectItem key={workspace} value={workspace}>
                      {workspace}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filterCriteria.status}
                onValueChange={(value) => setFilterCriteria(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="objectType">Object Type</Label>
              <Select
                value={filterCriteria.objectType}
                onValueChange={(value) => setFilterCriteria(prev => ({ ...prev, objectType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Application Function">Application Function</SelectItem>
                  <SelectItem value="Application Component">Application Component</SelectItem>
                  <SelectItem value="Business Process">Business Process</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SpecSync Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SpecSync Data Preview</CardTitle>
          <CardDescription>
            Select function names to search in Blue Dolphin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Selection Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search function names..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={filteredSpecSyncItems.length === 0}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearSelection}
                    disabled={selectedKeys.size === 0}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Showing {filteredSpecSyncItems.length} of {specSyncItems.length} items
              </div>
            </div>

            {/* SpecSync Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        Select
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requirement ID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Function Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Domain
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSpecSyncItems.map((item, _index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <Checkbox
                            checked={selectedKeys.has(buildSelectionKey(item.rephrasedRequirementId || item.requirementId, item.functionName))}
                            onCheckedChange={(checked) => 
                              handleRowSelection(item, checked as boolean)
                            }
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {item.rephrasedRequirementId || item.requirementId}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                          {item.functionName}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {item.domain}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Blue Dolphin Search</CardTitle>
          <CardDescription>
            Search for matching Application Functions in Blue Dolphin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Button */}
            <div className="flex items-center justify-between">
              <Button
                onClick={searchBlueDolphin}
                disabled={selectedKeys.size === 0 || !filterCriteria.workspace || isSearching}
                className="flex items-center space-x-2"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>
                  {isSearching ? 'Searching...' : `Search Blue Dolphin (${selectedKeys.size} selections)`}
                </span>
              </Button>

              {mappingResults.length > 0 && (
                <Button
                  variant="outline"
                  onClick={exportResults}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Results</span>
                </Button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Results Display */}
            {mappingResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    Mapping Results ({mappingResults.length} matches found)
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {mappingResults.filter(r => r.matchType === 'exact').length} Exact
                    </Badge>
                    <Badge variant="outline" className="text-yellow-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {mappingResults.filter(r => r.matchType === 'contains').length} Contains
                    </Badge>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SpecSync TMF Function
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Blue Dolphin ID
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Model TMF Function
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Match Type
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Workspace
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {mappingResults.map((result, _index) => (
                          <tr key={_index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                              {result.specSyncFunctionName}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600 font-mono">
                              {result.blueDolphinObject.ID}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {result.blueDolphinObject.Title}
                            </td>
                            <td className="px-4 py-2">
                              <Badge 
                                variant={result.matchType === 'exact' ? 'default' : 'secondary'}
                                className={result.matchType === 'exact' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                              >
                                {result.matchType}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {result.blueDolphinObject.Status || 'N/A'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {result.blueDolphinObject.Workspace || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* No Results */}
            {!isSearching && mappingResults.length === 0 && selectedKeys.size > 0 && !error && (
              <div className="text-center py-8 text-gray-500">
                <XCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No matching Application Functions found for selected function names.</p>
                <p className="text-sm">Try adjusting your filter criteria or check the function names.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
