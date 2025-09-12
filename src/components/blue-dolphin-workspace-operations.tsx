'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, RefreshCw, Move, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { BlueDolphinConfig } from '@/types/blue-dolphin';

interface BlueDolphinWorkspaceOperationsProps {
  config: BlueDolphinConfig;
}

export function BlueDolphinWorkspaceOperations({ config }: BlueDolphinWorkspaceOperationsProps) {
  // Workspace Operations State
  const [sourceWorkspaceId, setSourceWorkspaceId] = useState('');
  const [targetWorkspaceId, setTargetWorkspaceId] = useState('');
  // const [_objectId, _setObjectId] = useState('');
  // const [_isMoving, _setIsMoving] = useState(false);
  const [isLoadingObjects, setIsLoadingObjects] = useState(false);
  const [objects, setObjects] = useState<any[]>([]);
  // const [_selectedObject, _setSelectedObject] = useState<any>(null);
  // const [_moveHistory, _setMoveHistory] = useState<any[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<Set<string>>(new Set());
  const [showAllObjects, setShowAllObjects] = useState(false);
  const [objectLimit] = useState(100); // Limit for performance

  // REST API Retrieve Objects State
  const [retrieveWorkspaceId, setRetrieveWorkspaceId] = useState('');
  const [retrieveObjectId, setRetrieveObjectId] = useState('');
  const [retrieveTop, setRetrieveTop] = useState(10);
  const [retrieveStatus, setRetrieveStatus] = useState('');
  const [retrieveFilter, setRetrieveFilter] = useState('');
  const [retrieveOrderBy, setRetrieveOrderBy] = useState('');
  const [isRetrievingObjects, setIsRetrievingObjects] = useState(false);
  const [retrievedObjects, setRetrievedObjects] = useState<any[]>([]);
  const [retrievedObjectDetails, setRetrievedObjectDetails] = useState<any>(null);
  const [retrieveResponse, setRetrieveResponse] = useState<any>(null);
  const [showFullResponse, setShowFullResponse] = useState(false);

  const toast = useToast();

  // Load objects from source workspace
  const loadObjectsFromWorkspace = useCallback(async (workspaceId: string) => {
    if (!config.userApiKey || !workspaceId) {
      toast.showError('User API Key and Workspace ID required');
      return;
    }

    setIsLoadingObjects(true);
    try {
      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-objects-rest',
          config: config,
          data: {
            endpoint: 'Objects',
            workspace_id: workspaceId,
            top: showAllObjects ? 1000 : objectLimit
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Handle both direct array and items structure
        const objects = result.data?.items || result.data || [];
        setObjects(objects);
        toast.showSuccess(`Loaded ${objects.length} objects from workspace`);
        console.log('Loaded objects:', objects.length, 'First object:', objects[0]);
      } else {
        toast.showError('Failed to load objects', result.error);
      }
    } catch (error) {
      toast.showError('Error loading objects', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoadingObjects(false);
    }
  }, [config, toast, showAllObjects, objectLimit]);

  // Export object data for manual import
  const exportObjectData = useCallback(async (objectId: string) => {
    if (!config.userApiKey || !objectId) {
      toast.showError('User API Key and Object ID required');
      return;
    }

    try {
      // Get object details
      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-object-details',
          config: config,
          objectId: objectId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Create downloadable JSON file
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `object-${objectId}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        toast.showSuccess(`Object ${objectId} exported successfully`);
      } else {
        toast.showError('Failed to export object', result.error);
      }
    } catch (error) {
      toast.showError('Error exporting object', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [config, toast]);

  // Update object definition (workspace change simulation)
  const updateObjectDefinition = useCallback(async (objectId: string, newName: string) => {
    if (!config.userApiKey || !objectId) {
      toast.showError('User API Key and Object ID required');
      return;
    }

    try {
      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-object-definition',
          config: config,
          objectDefinitionId: objectId,
          updateData: {
            name: newName,
            object_properties: [],
            related_boem: []
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.showSuccess(`Object definition ${objectId} updated successfully`);
        // Refresh objects list
        if (sourceWorkspaceId) {
          await loadObjectsFromWorkspace(sourceWorkspaceId);
        }
      } else {
        toast.showError('Failed to update object definition', result.error);
      }
    } catch (error) {
      toast.showError('Error updating object definition', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [config, toast, sourceWorkspaceId, loadObjectsFromWorkspace]);

  // Select/deselect objects
  const toggleObjectSelection = (objectId: string) => {
    setSelectedObjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(objectId)) {
        newSet.delete(objectId);
      } else {
        newSet.add(objectId);
      }
      return newSet;
    });
  };

  // Select all visible objects
  const selectAllObjects = () => {
    const visibleObjects = objects.slice(0, showAllObjects ? 1000 : objectLimit);
    setSelectedObjects(new Set(visibleObjects.map(obj => obj.id || obj.ID)));
  };

  // Deselect all objects
  const deselectAllObjects = () => {
    setSelectedObjects(new Set());
  };

  // Retrieve objects with full parameters
  const retrieveObjects = useCallback(async () => {
    if (!config.userApiKey) {
      toast.showError('User API Key required');
      return;
    }

    setIsRetrievingObjects(true);
    try {
      const requestData: any = {
        action: 'get-objects-rest',
        config: config,
        data: {
          endpoint: 'Objects'
        }
      };

      // Add parameters if provided
      if (retrieveWorkspaceId) requestData.data.workspace_id = retrieveWorkspaceId;
      if (retrieveTop) requestData.data.top = parseInt(retrieveTop.toString());
      if (retrieveStatus) requestData.data.status = retrieveStatus;
      if (retrieveFilter) requestData.data.filter = retrieveFilter;
      if (retrieveOrderBy) requestData.data.orderby = retrieveOrderBy;

      console.log('🔍 [Frontend] Retrieving objects with parameters:', requestData);
      console.log('🔍 [Frontend] Top parameter value:', retrieveTop);
      console.log('🔍 [Frontend] Parsed top value:', parseInt(retrieveTop.toString()));

      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      setRetrieveResponse(result);
      
      if (result.success) {
        const objects = result.data?.items || result.data || [];
        setRetrievedObjects(objects);
        toast.showSuccess(`Retrieved ${objects.length} objects successfully`);
        console.log('Retrieved objects:', objects);
      } else {
        toast.showError('Failed to retrieve objects', result.error);
      }
    } catch (error) {
      toast.showError('Error retrieving objects', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRetrievingObjects(false);
    }
  }, [config, toast, retrieveWorkspaceId, retrieveTop, retrieveStatus, retrieveFilter, retrieveOrderBy]);

  // Retrieve specific object details
  const retrieveObjectDetails = useCallback(async (objectId: string) => {
    if (!config.userApiKey || !objectId) {
      toast.showError('User API Key and Object ID required');
      return;
    }

    try {
      console.log('🔍 [Frontend] Retrieving object details for ID:', objectId);
      
      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get-object-details',
          config: config,
          data: { objectId }
        })
      });

      const result = await response.json();

      if (result.success) {
        setRetrievedObjectDetails(result.data);
        toast.showSuccess(`Retrieved details for object ${objectId}`);
        console.log('✅ [Frontend] Object details retrieved:', result.data);
      } else {
        toast.showError('Failed to retrieve object details', result.error || 'Unknown error');
        console.error('❌ [Frontend] Object details retrieval failed:', result.error);
      }
    } catch (error) {
      toast.showError('Error retrieving object details', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ [Frontend] Object details retrieval error:', error);
    }
  }, [config, toast]);

  // Handle object selection
  // const _handleObjectSelect = (object: any) => {
  //   _setSelectedObject(object);
  //   _setObjectId(object.id || object.ID);
  // };

  return (
    <div className="space-y-6">
      {/* Main REST API Operations Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">REST API Operations</h2>
          <p className="text-gray-600">Comprehensive Model REST API integration and workspace management</p>
        </div>
        <div className="flex space-x-2">
          <Badge variant="outline" className="text-xs">
            REST API
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Full Integration
          </Badge>
        </div>
      </div>

      {/* REST API Retrieve Objects Section */}
      <Card>
        <CardHeader>
          <CardTitle>REST API Retrieve Objects</CardTitle>
          <CardDescription>
            Configure and execute Model REST API calls to retrieve objects with full parameter control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Parameter Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="retrieveWorkspaceId">Workspace ID</Label>
              <Input
                id="retrieveWorkspaceId"
                value={retrieveWorkspaceId}
                onChange={(e) => setRetrieveWorkspaceId(e.target.value)}
                placeholder="e.g., 686bc177266606c567669730"
              />
            </div>
            <div>
              <Label htmlFor="retrieveObjectId">Specific Object ID (Optional)</Label>
              <Input
                id="retrieveObjectId"
                value={retrieveObjectId}
                onChange={(e) => setRetrieveObjectId(e.target.value)}
                placeholder="e.g., 689760750803bfed17323410"
              />
            </div>
            <div>
              <Label htmlFor="retrieveTop">Top (Limit)</Label>
              <Input
                id="retrieveTop"
                type="number"
                value={retrieveTop}
                onChange={(e) => setRetrieveTop(parseInt(e.target.value) || 10)}
                placeholder="10"
              />
            </div>
            <div>
              <Label htmlFor="retrieveStatus">Status Filter</Label>
              <Input
                id="retrieveStatus"
                value={retrieveStatus}
                onChange={(e) => setRetrieveStatus(e.target.value)}
                placeholder="e.g., Accepted, Under Consideration"
              />
            </div>
            <div>
              <Label htmlFor="retrieveFilter">Filter Expression</Label>
              <Input
                id="retrieveFilter"
                value={retrieveFilter}
                onChange={(e) => setRetrieveFilter(e.target.value)}
                placeholder="e.g., contains(title,'API')"
              />
            </div>
            <div>
              <Label htmlFor="retrieveOrderBy">Order By</Label>
              <Input
                id="retrieveOrderBy"
                value={retrieveOrderBy}
                onChange={(e) => setRetrieveOrderBy(e.target.value)}
                placeholder="e.g., title asc, created_date desc"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              onClick={retrieveObjects}
              disabled={isRetrievingObjects}
              className="flex items-center space-x-2"
            >
              {isRetrievingObjects ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{isRetrievingObjects ? 'Retrieving...' : 'Retrieve Objects'}</span>
            </Button>
            
            {retrieveObjectId && (
              <Button
                variant="outline"
                onClick={() => retrieveObjectDetails(retrieveObjectId)}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Get Object Details</span>
              </Button>
            )}
          </div>

          {/* Retrieved Objects List */}
          {retrievedObjects.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Retrieved Objects ({retrievedObjects.length})</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullResponse(!showFullResponse)}
                >
                  {showFullResponse ? 'Hide' : 'Show'} Full Response
                </Button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {retrievedObjects.map((object, index) => {
                  const objectId = object.id || object.ID;
                  return (
                    <div
                      key={objectId || index}
                      className="p-3 border rounded hover:border-gray-300 cursor-pointer"
                      onClick={() => retrieveObjectDetails(objectId)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{object.title || object.Title || object.object_title || 'Untitled'}</p>
                          <p className="text-sm text-gray-500">
                            ID: {objectId} | Type: {object.type?.name || object.definition || 'Unknown'}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {object.status || object.Status || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full Response Display */}
          {showFullResponse && retrieveResponse && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Full API Response</h3>
              <div className="p-4 bg-gray-50 border rounded max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(retrieveResponse, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Object Details Display */}
          {retrievedObjectDetails && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Object Details</h3>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <div className="space-y-2">
                  <div>
                    <strong>Title:</strong> {retrievedObjectDetails.object_title || retrievedObjectDetails.title}
                  </div>
                  <div>
                    <strong>Type:</strong> {retrievedObjectDetails.type?.name || 'Unknown'}
                  </div>
                  <div>
                    <strong>Workspace:</strong> {retrievedObjectDetails.workspace?.name || 'Unknown'}
                  </div>
                  <div>
                    <strong>Status:</strong> {retrievedObjectDetails.status || 'Unknown'}
                  </div>
                  
                  {/* Object Properties Array */}
                  {retrievedObjectDetails.object_properties && (
                    <div>
                      <strong>Object Properties ({retrievedObjectDetails.object_properties.length}):</strong>
                      <div className="ml-4 space-y-1">
                        {retrievedObjectDetails.object_properties.map((prop: any, index: number) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{prop.name}:</span> "{prop.value}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BOEM Structure */}
                  {retrievedObjectDetails.boem && retrievedObjectDetails.boem.length > 0 && (
                    <div>
                      <strong>BOEM Structure ({retrievedObjectDetails.boem.length} groups):</strong>
                      <div className="ml-4 space-y-2">
                        {retrievedObjectDetails.boem.map((boem: any, index: number) => (
                          <div key={index} className="text-sm">
                            <div className="font-medium">{boem.name} ({boem.items?.length || 0} items)</div>
                            {boem.items && boem.items.length > 0 && (
                              <div className="ml-4 space-y-1">
                                {boem.items.slice(0, 5).map((item: any, itemIndex: number) => (
                                  <div key={itemIndex} className="text-xs text-gray-600">
                                    {item.name} ({item.field_type}): "{item.value}"
                                  </div>
                                ))}
                                {boem.items.length > 5 && (
                                  <div className="text-xs text-gray-500">... and {boem.items.length - 5} more items</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full Object Details JSON */}
                  <details className="mt-4">
                    <summary className="cursor-pointer font-medium">Show Full JSON</summary>
                    <pre className="mt-2 text-xs text-gray-700 whitespace-pre-wrap bg-white p-2 rounded border">
                      {JSON.stringify(retrievedObjectDetails, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workspace Operations Section */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Operations</CardTitle>
          <CardDescription>
            Export objects from Model workspaces for manual import and update object definitions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Workspace Configuration</h3>
            <p className="text-sm text-gray-600 mb-4">Configure source and target workspaces for object operations</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sourceWorkspace">Source Workspace ID</Label>
                <div className="flex space-x-2">
                  <Input
                    id="sourceWorkspace"
                    value={sourceWorkspaceId}
                    onChange={(e) => setSourceWorkspaceId(e.target.value)}
                    placeholder="e.g., 68b8214f5b12ebdcb8e00345"
                  />
                  <Button
                    variant="outline"
                    onClick={() => loadObjectsFromWorkspace(sourceWorkspaceId)}
                    disabled={isLoadingObjects || !sourceWorkspaceId}
                  >
                    {isLoadingObjects ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="targetWorkspace">Target Workspace ID</Label>
                <Input
                  id="targetWorkspace"
                  value={targetWorkspaceId}
                  onChange={(e) => setTargetWorkspaceId(e.target.value)}
                  placeholder="e.g., 68b8214f5b12ebdcb8e00345"
                />
              </div>
            </div>

            {config.workspaceId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Current Configuration Workspace:</strong> {config.workspaceId}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setSourceWorkspaceId(config.workspaceId || '')}
                >
                  Use Current Workspace
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Objects List */}
      {objects.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Objects in Source Workspace</CardTitle>
                <CardDescription>
                  Export objects for manual import to target workspace
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllObjects}
                  disabled={objects.length === 0}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAllObjects}
                  disabled={selectedObjects.size === 0}
                >
                  Deselect All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllObjects(!showAllObjects)}
                >
                  {showAllObjects ? 'Show First 100' : 'Show All'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Model REST API supports updating object definitions. 
                You can export objects for manual import or update object definitions directly.
              </p>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {objects.slice(0, showAllObjects ? 1000 : objectLimit).map((object, index) => {
                const objectId = object.id || object.ID;
                const isSelected = selectedObjects.has(objectId);
                
                return (
                  <div
                    key={objectId || index}
                    className={`p-3 border rounded transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleObjectSelection(objectId)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <div>
                          <p className="font-medium">{object.title || object.Title || object.name || 'Untitled'}</p>
                          <p className="text-sm text-gray-500">
                            ID: {objectId} | Type: {object.definition || object.Definition || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {object.status || object.Status || 'Unknown'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportObjectData(objectId)}
                        >
                          Export
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const newName = prompt('Enter new name for object definition:', object.title || object.Title || 'Untitled');
                            if (newName && newName !== (object.title || object.Title)) {
                              updateObjectDefinition(objectId, newName);
                            }
                          }}
                        >
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {objects.length > objectLimit && !showAllObjects && (
              <div className="mt-4 p-3 bg-gray-50 border rounded text-center">
                <p className="text-sm text-gray-600">
                  Showing first {objectLimit} of {objects.length} objects. 
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowAllObjects(true)}
                    className="ml-1"
                  >
                    Show All
                  </Button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Export Operations */}
      {selectedObjects.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Export Selected Objects</CardTitle>
            <CardDescription>
              Export {selectedObjects.size} selected objects for manual import
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <p className="font-medium">{selectedObjects.size} Objects Selected</p>
                  <p className="text-sm text-blue-600">
                    Export these objects as JSON files for manual import to target workspace
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-blue-400" />
                <div className="flex-1">
                  <p className="font-medium">Target Workspace</p>
                  <p className="text-sm text-blue-600">{targetWorkspaceId || 'Not specified'}</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={() => {
                  selectedObjects.forEach(objectId => {
                    exportObjectData(objectId);
                  });
                }}
                className="flex items-center space-x-2"
              >
                <Move className="h-4 w-4" />
                <span>Export All Selected</span>
              </Button>

              <Button
                variant="outline"
                onClick={deselectAllObjects}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Move History */}
      {/* {moveHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Move History</CardTitle>
            <CardDescription>
              Recent object move operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {moveHistory.map((move, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded flex items-center space-x-3 ${
                    move.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  {move.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Object {move.objectId} → Workspace {move.targetWorkspaceId}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(move.timestamp).toLocaleString()}
                    </p>
                    {!move.success && move.error && (
                      <p className="text-xs text-red-600 mt-1">{move.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>1. <strong>Configure REST API Parameters:</strong> Set workspace ID, filters, and other parameters for object retrieval</p>
          <p>2. <strong>Retrieve Objects:</strong> Click "Retrieve Objects" to fetch objects with full parameter control</p>
          <p>3. <strong>View Object Details:</strong> Click on any object to see its full properties and BOEM structure</p>
          <p>4. <strong>Export Objects:</strong> Use workspace operations to export objects for manual import</p>
          <p>5. <strong>Update Object Definitions:</strong> Modify object definition names and properties directly</p>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800">
              <strong>Full REST API Integration:</strong> This interface provides comprehensive Model REST API access 
              with full parameter control and detailed response visualization.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BlueDolphinWorkspaceOperations;