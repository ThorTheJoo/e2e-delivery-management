'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible } from '@/components/ui/collapsible';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { BlueDolphinConfig } from '@/types/blue-dolphin';
import { 
  MappingResult, 
  TraversalResult, 
  TraversalResultWithPayloads,
  HierarchicalObject 
} from '@/types/blue-dolphin-relationships';
import { BlueDolphinRelationshipService } from '@/lib/blue-dolphin-relationship-service';

interface SpecSyncRelationshipTraversalProps {
  mappingResults: MappingResult[];
  blueDolphinConfig: BlueDolphinConfig;
  workspaceFilter: string;
}

export function SpecSyncRelationshipTraversal({ 
  mappingResults, 
  blueDolphinConfig, 
  workspaceFilter 
}: SpecSyncRelationshipTraversalProps) {
  const [traversalResults, setTraversalResults] = useState<TraversalResult[]>([]);
  
  // Debug logging for mapping results
  console.log('🔍 [Traversal Component] Received mapping results:', mappingResults.length);
  console.log('📋 [Traversal Component] Sample mapping results:');
  mappingResults.slice(0, 3).forEach((mapping, index) => {
    console.log(`  ${index + 1}. specSyncRequirementId: "${mapping.specSyncRequirementId}"`);
    console.log(`     specSyncFunctionName: "${mapping.specSyncFunctionName}"`);
    console.log(`     blueDolphinObjectId: "${mapping.blueDolphinObject.ID}"`);
  });
  const [isTraversing, setIsTraversing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [traversingFunction, setTraversingFunction] = useState<string | null>(null);
  const [extractingFunction, setExtractingFunction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxDepth, setMaxDepth] = useState<number>(5);

  // Initialize relationship service with dynamic workspace detection
  const relationshipService = useMemo(() => {
    // Use the workspace from the first mapping result if available
    const detectedWorkspace = mappingResults.length > 0 
      ? mappingResults[0].blueDolphinObject.Workspace || workspaceFilter
      : workspaceFilter;
    
    console.log(`🏢 Using workspace: ${detectedWorkspace} (from mapping results: ${mappingResults.length > 0})`);
    
    return new BlueDolphinRelationshipService(blueDolphinConfig, detectedWorkspace);
  }, [blueDolphinConfig, workspaceFilter, mappingResults]);

  /**
   * Main traversal function
   */
  const traverseRelationships = useCallback(async (mappingResult: MappingResult) => {
    setIsTraversing(true);
    setTraversingFunction(mappingResult.specSyncFunctionName);
    setError(null);

    console.log(`🚀 Starting relationship traversal for: ${mappingResult.specSyncFunctionName}`);
    console.log(`📊 Application Function: ${mappingResult.blueDolphinObject.Title}`);
    console.log(`🏢 Workspace: ${workspaceFilter}`);

    try {
      const result = await relationshipService.traverseRelationships(mappingResult, {
        maxDepth,
        maxObjectsPerLevel: 100,
        includeCircular: false,
        cacheEnabled: true,
        parallelProcessing: true
      });
      
      console.log(`✅ Traversal completed for: ${mappingResult.specSyncFunctionName}`);
      console.log(`📈 Results:`, {
        businessProcesses: result.businessProcesses.topLevel.length + result.businessProcesses.childLevel.length + result.businessProcesses.grandchildLevel.length,
        applicationServices: result.applicationServices.topLevel.length + result.applicationServices.childLevel.length + result.applicationServices.grandchildLevel.length,
        applicationInterfaces: result.applicationInterfaces.topLevel.length + result.applicationInterfaces.childLevel.length + result.applicationInterfaces.grandchildLevel.length,
        relatedFunctions: result.relatedApplicationFunctions.length
      });

      // If multiple mappings exist, prefer building a combined set in the caller
      setTraversalResults(prev => {
        const filtered = prev.filter(r => r.specSyncFunctionName !== mappingResult.specSyncFunctionName);
        return [...filtered, result];
      });

    } catch (error) {
      console.error(`❌ Traversal failed for ${mappingResult.specSyncFunctionName}:`, error);
      setError(error instanceof Error ? error.message : 'Traversal failed');
    } finally {
      setIsTraversing(false);
      setTraversingFunction(null);
    }
  }, [relationshipService, workspaceFilter]);

  /**
   * Combined traversal for all mapping results (deduped by Application Function ID)
   */
  const traverseAllCombined = useCallback(async () => {
    if (!mappingResults || mappingResults.length === 0) return;

    setIsTraversing(true);
    setError(null);

    try {
      // Unique seed Application Function IDs
      const byFunctionId = new Map<string, MappingResult>();
      mappingResults.forEach(m => {
        if (!byFunctionId.has(m.blueDolphinObject.ID)) byFunctionId.set(m.blueDolphinObject.ID, m);
      });

      const seeds = Array.from(byFunctionId.values());
      const results: TraversalResult[] = [];
      for (const seed of seeds) {
        const result = await relationshipService.traverseRelationships(seed, {
          maxDepth,
          maxObjectsPerLevel: 100,
          includeCircular: false,
          cacheEnabled: true,
          parallelProcessing: true
        });
        results.push(result);
      }

      // Merge all results into a single combined view
      // Use object ID to dedupe across seeds
      const seen = new Set<string>();
      const merged: TraversalResult[] = [];
      // Keep individual results for optional drill-down but also compute a synthetic combined result
      const combined = combineTraversalResults(results);
      merged.push(combined);
      setTraversalResults(merged);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Combined traversal failed');
    } finally {
      setIsTraversing(false);
      setTraversingFunction(null);
    }
  }, [mappingResults, relationshipService, maxDepth]);

  // Helper: combine multiple TraversalResult objects into one unified result
  function combineTraversalResults(results: TraversalResult[]): TraversalResult {
    if (results.length === 0) {
      return {
        applicationFunction: {} as any,
        businessProcesses: { topLevel: [], childLevel: [], grandchildLevel: [] },
        applicationServices: { topLevel: [], childLevel: [], grandchildLevel: [] },
        applicationInterfaces: { topLevel: [], childLevel: [], grandchildLevel: [] },
        relatedApplicationFunctions: [],
        specSyncFunctionName: 'Combined',
        traversalMetadata: { totalObjectsFound: 0, maxDepthReached: 0, processingTimeMs: 0, cacheHitRate: 0.8 }
      };
    }

    const dedupe = <T extends { ID: string }>(arr: T[]) => {
      const map = new Map<string, T>();
      arr.forEach(o => { if (!map.has(o.ID)) map.set(o.ID, o); });
      return Array.from(map.values());
    };

    const mergeSections = (a: any, b: any) => ({
      topLevel: dedupe([...(a?.topLevel || []), ...(b?.topLevel || [])]),
      childLevel: dedupe([...(a?.childLevel || []), ...(b?.childLevel || [])]),
      grandchildLevel: dedupe([...(a?.grandchildLevel || []), ...(b?.grandchildLevel || [])])
    });

    let acc = results[0];
    for (let i = 1; i < results.length; i++) {
      const cur = results[i];
      acc = {
        ...acc,
        businessProcesses: mergeSections(acc.businessProcesses, cur.businessProcesses),
        applicationServices: mergeSections(acc.applicationServices, cur.applicationServices),
        applicationInterfaces: mergeSections(acc.applicationInterfaces, cur.applicationInterfaces),
        relatedApplicationFunctions: dedupe([...(acc.relatedApplicationFunctions || []), ...(cur.relatedApplicationFunctions || [])]),
        specSyncFunctionName: 'Combined',
        traversalMetadata: {
          totalObjectsFound: 0,
          maxDepthReached: Math.max(acc.traversalMetadata.maxDepthReached, cur.traversalMetadata.maxDepthReached),
          processingTimeMs: acc.traversalMetadata.processingTimeMs + cur.traversalMetadata.processingTimeMs,
          cacheHitRate: 0.8
        }
      } as TraversalResult;
    }

    // Fix total count after dedupe
    const total = acc.businessProcesses.topLevel.length + acc.businessProcesses.childLevel.length + acc.businessProcesses.grandchildLevel.length +
      acc.applicationServices.topLevel.length + acc.applicationServices.childLevel.length + acc.applicationServices.grandchildLevel.length +
      acc.applicationInterfaces.topLevel.length + acc.applicationInterfaces.childLevel.length + acc.applicationInterfaces.grandchildLevel.length +
      (acc.relatedApplicationFunctions || []).length;
    acc.traversalMetadata.totalObjectsFound = total;
    return acc;
  }

  /**
   * Extract full payloads with extended properties and download CSV
   */
  const extractFullPayloads = useCallback(async (traversalResult: TraversalResult) => {
    setIsExtracting(true);
    setExtractingFunction(traversalResult.specSyncFunctionName);
    setError(null);

    console.log(`🔍 Starting full payload extraction for: ${traversalResult.specSyncFunctionName}`);
    console.log(`📊 Objects to extract: ${traversalResult.traversalMetadata.totalObjectsFound}`);

    try {
      const result = await relationshipService.extractFullPayloads(traversalResult);
      
      console.log(`✅ Full payload extraction completed for: ${traversalResult.specSyncFunctionName}`);
      console.log(`📈 Payload metadata:`, result.payloadMetadata);

      // Generate and download CSV directly
      const csvData = generateFullPayloadCSV(result);
      const csv = convertToCSV(csvData);
      downloadCSV(csv, `specsync-full-payload-extraction-${traversalResult.specSyncFunctionName}-${Date.now()}.csv`);
      
      console.log(`📊 Downloaded full payload CSV with ${csvData.length} rows`);

    } catch (error) {
      console.error(`❌ Full payload extraction failed for ${traversalResult.specSyncFunctionName}:`, error);
      setError(error instanceof Error ? error.message : 'Full payload extraction failed');
    } finally {
      setIsExtracting(false);
      setExtractingFunction(null);
    }
  }, [relationshipService]);

  /**
   * Export results to CSV
   */
  const exportResults = useCallback(() => {
    if (traversalResults.length === 0) return;

    console.log('📤 Exporting traversal results to CSV');

    const csvData = traversalResults.flatMap(result => {
      const rows = [];

      // Application Function
      rows.push({
        'SpecSync Function': result.specSyncFunctionName,
        'Application Function': result.applicationFunction.Title,
        'Object Type': 'Application Function',
        'Object Title': result.applicationFunction.Title,
        'Object Level': 'Root',
        'Workspace': result.applicationFunction.Workspace,
        'Relationship Type': 'N/A',
        'Relationship Path': 'N/A'
      });

      // Business Processes
      [...result.businessProcesses.topLevel, ...result.businessProcesses.childLevel, ...result.businessProcesses.grandchildLevel].forEach(obj => {
        rows.push({
          'SpecSync Function': result.specSyncFunctionName,
          'Application Function': result.applicationFunction.Title,
          'Object Type': 'Business Process',
          'Object Title': obj.Title,
          'Object Level': obj.hierarchyLevel,
          'Workspace': obj.Workspace,
          'Relationship Type': obj.relationshipType || 'N/A',
          'Relationship Path': obj.relationshipPath?.join(' → ') || 'N/A'
        });
      });

      // Application Services
      [...result.applicationServices.topLevel, ...result.applicationServices.childLevel, ...result.applicationServices.grandchildLevel].forEach(obj => {
        rows.push({
          'SpecSync Function': result.specSyncFunctionName,
          'Application Function': result.applicationFunction.Title,
          'Object Type': 'Application Service',
          'Object Title': obj.Title,
          'Object Level': obj.hierarchyLevel,
          'Workspace': obj.Workspace,
          'Relationship Type': obj.relationshipType || 'N/A',
          'Relationship Path': obj.relationshipPath?.join(' → ') || 'N/A'
        });
      });

      // Application Interfaces
      [...result.applicationInterfaces.topLevel, ...result.applicationInterfaces.childLevel, ...result.applicationInterfaces.grandchildLevel].forEach(obj => {
        rows.push({
          'SpecSync Function': result.specSyncFunctionName,
          'Application Function': result.applicationFunction.Title,
          'Object Type': 'Application Interface',
          'Object Title': obj.Title,
          'Object Level': obj.hierarchyLevel,
          'Workspace': obj.Workspace,
          'Relationship Type': obj.relationshipType || 'N/A',
          'Relationship Path': obj.relationshipPath?.join(' → ') || 'N/A'
        });
      });

      // Related Application Functions
      result.relatedApplicationFunctions.forEach(obj => {
        rows.push({
          'SpecSync Function': result.specSyncFunctionName,
          'Application Function': result.applicationFunction.Title,
          'Object Type': 'Related Application Function',
          'Object Title': obj.Title,
          'Object Level': obj.hierarchyLevel,
          'Workspace': obj.Workspace,
          'Relationship Type': obj.relationshipType || 'N/A',
          'Relationship Path': obj.relationshipPath?.join(' → ') || 'N/A'
        });
      });

      return rows;
    });

    const csv = convertToCSV(csvData);
    downloadCSV(csv, `specsync-relationship-traversal-${Date.now()}.csv`);
    
    console.log(`📊 Exported ${csvData.length} rows to CSV`);
  }, [traversalResults]);

  /**
   * Object-only deduped export with aggregated requirement IDs
   */
  const exportObjectsOnly = useCallback(() => {
    if (traversalResults.length === 0) return;

    // Build aggregated requirement IDs per Application Function ID
    const aggReqIdsByFunctionId = new Map<string, string[]>();
    mappingResults.forEach(m => {
      const list = aggReqIdsByFunctionId.get(m.blueDolphinObject.ID) || [];
      if (m.specSyncRequirementId && !list.includes(m.specSyncRequirementId)) list.push(m.specSyncRequirementId);
      aggReqIdsByFunctionId.set(m.blueDolphinObject.ID, list);
    });

    const dedup = new Map<string, any>();
    const push = (obj: any, type: string, appFuncId?: string) => {
      const key = obj.ID;
      if (dedup.has(key)) return;
      const reqIds = appFuncId ? (aggReqIdsByFunctionId.get(appFuncId) || []) : [];
      dedup.set(key, {
        'SpecSync Requirement IDs (all)': reqIds.join(', '),
        'Object Type': type,
        'Object ID': obj.ID,
        'Object Title': obj.Title,
        'Status': obj.Status || '',
        'Workspace': obj.Workspace || ''
      });
    };

    traversalResults.forEach(tr => {
      const appId = tr.applicationFunction.ID;
      push(tr.applicationFunction, 'Application Function', appId);
      [...tr.businessProcesses.topLevel, ...tr.businessProcesses.childLevel, ...tr.businessProcesses.grandchildLevel].forEach(o => push(o, 'Business Process', appId));
      [...tr.applicationServices.topLevel, ...tr.applicationServices.childLevel, ...tr.applicationServices.grandchildLevel].forEach(o => push(o, 'Application Service', appId));
      [...tr.applicationInterfaces.topLevel, ...tr.applicationInterfaces.childLevel, ...tr.applicationInterfaces.grandchildLevel].forEach(o => push(o, 'Application Interface', appId));
      tr.relatedApplicationFunctions.forEach(o => push(o, 'Related Application Function', appId));
    });

    const rows = Array.from(dedup.values());
    const csv = convertToCSV(rows);
    downloadCSV(csv, `specsync-objects-only-${Date.now()}.csv`);
  }, [traversalResults, mappingResults]);

  /**
   * Generate CSV data for full payload results with selected enhanced fields
   */
  const generateFullPayloadCSV = useCallback((result: TraversalResultWithPayloads) => {
    const rows = [];

    // Find all mapping results that match this application function to get all requirement IDs
    const matchingMappings = mappingResults.filter(mapping => 
      mapping.blueDolphinObject.ID === result.applicationFunction.ID
    );
    
    console.log(`🔍 [Traversal] Looking for mappings for Application Function ID: ${result.applicationFunction.ID}`);
    console.log(`📊 [Traversal] Total mapping results available: ${mappingResults.length}`);
    console.log(`🎯 [Traversal] Matching mappings found: ${matchingMappings.length}`);
    console.log(`📋 [Traversal] Matching mappings:`, matchingMappings.map(m => ({
      specSyncRequirementId: m.specSyncRequirementId,
      specSyncFunctionName: m.specSyncFunctionName,
      blueDolphinObjectId: m.blueDolphinObject.ID
    })));
    
    // Serialize all requirement IDs into a string
    const requirementIds = matchingMappings.map(mapping => mapping.specSyncRequirementId).filter(Boolean);
    const requirementIdString = requirementIds.length > 0 ? requirementIds.join(', ') : 'N/A';
    
    console.log(`🔍 [Traversal] Raw requirement IDs from mappings:`, requirementIds);
    console.log(`✅ [Traversal] Final requirement ID string: "${requirementIdString}"`);

    // Helper function to create a comprehensive row with selected enhanced fields
    const createComprehensiveRow = (obj: any, objectType: string, objectLevel: string, relationshipType: string = 'N/A', relationshipPath: string = 'N/A') => {
      const baseRow = {
        'SpecSync Requirement ID': requirementIdString,
        'SpecSync Function': result.specSyncFunctionName,
        'Application Function': result.applicationFunction.Title,
        'Object Type': objectType,
        'Object Title': obj.Title,
        'Object Level': objectLevel,
        'Workspace': obj.Workspace,
        'Status': obj.Status,
        'Description': obj.Description || '',
        'Relationship Type': relationshipType,
        'Relationship Path': relationshipPath,
        'Enhanced Fields Count': Object.keys(obj).filter(key => 
          key.startsWith('Object_Properties_') || 
          key.startsWith('Deliverable_Object_Status_') || 
          key.startsWith('Ameff_properties_')
        ).length
      };

      // Add only the specific enhanced fields we want to keep
      const selectedFields = [
        'Ameff_properties_Function_Description_Link',
        'Ameff_properties_Interface_Description_Link',
        'Ameff_properties_Service_Description_Link',
        'Ameff_properties_TMF_Function_ID'
      ];

      selectedFields.forEach(field => {
        (baseRow as any)[field] = obj[field] || '';
      });

      return baseRow;
    };

    // Application Function with full payload
    rows.push(createComprehensiveRow(
      result.applicationFunction, 
      'Application Function', 
      'Root'
    ));

    // Business Processes with full payload
    [...result.businessProcesses.topLevel, ...result.businessProcesses.childLevel, ...result.businessProcesses.grandchildLevel].forEach(obj => {
      rows.push(createComprehensiveRow(
        obj, 
        'Business Process', 
        obj.hierarchyLevel,
        obj.relationshipType || 'N/A',
        obj.relationshipPath?.join(' → ') || 'N/A'
      ));
    });

    // Application Services with full payload
    [...result.applicationServices.topLevel, ...result.applicationServices.childLevel, ...result.applicationServices.grandchildLevel].forEach(obj => {
      rows.push(createComprehensiveRow(
        obj, 
        'Application Service', 
        obj.hierarchyLevel,
        obj.relationshipType || 'N/A',
        obj.relationshipPath?.join(' → ') || 'N/A'
      ));
    });

    // Application Interfaces with full payload
    [...result.applicationInterfaces.topLevel, ...result.applicationInterfaces.childLevel, ...result.applicationInterfaces.grandchildLevel].forEach(obj => {
      rows.push(createComprehensiveRow(
        obj, 
        'Application Interface', 
        obj.hierarchyLevel,
        obj.relationshipType || 'N/A',
        obj.relationshipPath?.join(' → ') || 'N/A'
      ));
    });

    // Related Application Functions with full payload
    result.relatedApplicationFunctions.forEach(obj => {
      rows.push(createComprehensiveRow(
        obj, 
        'Related Application Function', 
        obj.hierarchyLevel,
        obj.relationshipType || 'N/A',
        obj.relationshipPath?.join(' → ') || 'N/A'
      ));
    });

    return rows;
  }, [mappingResults]);

  /**
   * Clear all results
   */
  const clearResults = useCallback(() => {
    setTraversalResults([]);
    setError(null);
    console.log('🧹 Cleared all traversal results');
  }, []);

  // Build unique mappings list to render available functions and to use as seeds
  const uniqueMappings = useMemo(() => {
    const byId = new Map<string, MappingResult>();
    mappingResults.forEach(m => {
      if (!byId.has(m.blueDolphinObject.ID)) byId.set(m.blueDolphinObject.ID, m);
    });
    return Array.from(byId.values());
  }, [mappingResults]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Relationship Traversal</h3>
          <p className="text-sm text-gray-600">
            Discover related Application Services, Business Processes, and Application Interfaces
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 mr-3">
            <span className="text-sm text-gray-600">Max depth</span>
            <select
              aria-label="Traversal max depth"
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              {[3,4,5,6,7,8,9,10].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          {uniqueMappings.length > 0 && (
            <Button onClick={traverseAllCombined} variant="outline" size="sm" disabled={isTraversing}>
              {isTraversing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traversing...
                </>
              ) : (
                'Traverse All (Combined)'
              )}
            </Button>
          )}
          {traversalResults.length > 0 && (
            <>
              <Button onClick={exportResults} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Basic CSV
              </Button>
              <Button onClick={exportObjectsOnly} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Objects Only
              </Button>
              <Button onClick={clearResults} variant="outline" size="sm">
                Clear Results
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Debug Information */}
      {mappingResults.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div><strong>Debug Info:</strong></div>
              <div>• Mapping Results: {mappingResults.length}</div>
              <div>• Workspace: {mappingResults[0]?.blueDolphinObject.Workspace || 'Unknown'}</div>
              <div>• Object ID: {mappingResults[0]?.blueDolphinObject.ID || 'Unknown'}</div>
              <div>• Object Type: {mappingResults[0]?.blueDolphinObject.Definition || 'Unknown'}</div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Mapping Results with Traverse Buttons (unique by Application Function) */}
      <div className="space-y-3">
        <h4 className="font-medium">Available Functions for Traversal</h4>
        {uniqueMappings.map((result, index) => (
          <Card key={index} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h5 className="font-medium">{result.specSyncFunctionName}</h5>
                  <Badge variant="outline" className="text-xs">
                    {result.matchType} ({Math.round(result.confidence * 100)}%)
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">{result.blueDolphinObject.Title}</p>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {result.blueDolphinObject.Workspace}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {result.blueDolphinObject.Status}
                  </Badge>
                </div>
              </div>
              <Button
                onClick={() => traverseRelationships(result)}
                disabled={isTraversing}
                size="sm"
                variant="outline"
              >
                {isTraversing && traversingFunction === result.specSyncFunctionName ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Traversing...
                  </>
                ) : (
                  'Traverse Relationships'
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Traversal Results */}
      {traversalResults.length > 0 && (
        <div className="space-y-6">
          <h4 className="font-medium">Traversal Results</h4>
          {traversalResults.map((result, index) => (
            <TraversalResultCard 
              key={index} 
              result={result}
              onExtractFullPayloads={extractFullPayloads}
              isExtracting={isExtracting && extractingFunction === result.specSyncFunctionName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual traversal result card component
 */
function TraversalResultCard({ 
  result,
  onExtractFullPayloads,
  isExtracting
}: { 
  result: TraversalResult;
  onExtractFullPayloads: (result: TraversalResult) => void;
  isExtracting: boolean;
}) {
  const totalObjects = 
    result.businessProcesses.topLevel.length + result.businessProcesses.childLevel.length + result.businessProcesses.grandchildLevel.length +
    result.applicationServices.topLevel.length + result.applicationServices.childLevel.length + result.applicationServices.grandchildLevel.length +
    result.applicationInterfaces.topLevel.length + result.applicationInterfaces.childLevel.length + result.applicationInterfaces.grandchildLevel.length +
    result.relatedApplicationFunctions.length;

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>
            {result.specSyncFunctionName} → {result.applicationFunction.Title}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {totalObjects} objects found
            </Badge>
            <Button
              onClick={() => onExtractFullPayloads(result)}
              disabled={isExtracting}
              size="sm"
              variant="default"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Extract Full Payloads
                </>
              )}
            </Button>
          </div>
        </CardTitle>
        <div className="text-xs text-gray-500">
          Processing time: {result.traversalMetadata.processingTimeMs}ms | 
          Max depth: {result.traversalMetadata.maxDepthReached} | 
          Cache hit rate: {Math.round(result.traversalMetadata.cacheHitRate * 100)}%
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Business Processes */}
        <HierarchicalSection
          title="Business Processes"
          color="green"
          icon="🏢"
          data={result.businessProcesses}
        />

        {/* Application Services */}
        <HierarchicalSection
          title="Application Services"
          color="blue"
          icon="⚙️"
          data={result.applicationServices}
        />

        {/* Application Interfaces */}
        <HierarchicalSection
          title="Application Interfaces"
          color="purple"
          icon="🔌"
          data={result.applicationInterfaces}
        />

        {/* Related Application Functions */}
        {result.relatedApplicationFunctions.length > 0 && (
          <HierarchicalSection
            title="Related Application Functions"
            color="orange"
            icon="🔧"
            data={{
              topLevel: result.relatedApplicationFunctions,
              childLevel: [],
              grandchildLevel: []
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}


/**
 * Hierarchical section component
 */
function HierarchicalSection({
  title,
  color,
  icon,
  data
}: {
  title: string;
  color: string;
  icon: string;
  data: {
    topLevel: HierarchicalObject[];
    childLevel: HierarchicalObject[];
    grandchildLevel: HierarchicalObject[];
  };
}) {
  const totalCount = data.topLevel.length + data.childLevel.length + data.grandchildLevel.length;

  if (totalCount === 0) return null;

  const colorClasses = {
    green: 'text-green-700 bg-green-50 border-green-200',
    blue: 'text-blue-700 bg-blue-50 border-blue-200',
    purple: 'text-purple-700 bg-purple-50 border-purple-200',
    orange: 'text-orange-700 bg-orange-50 border-orange-200'
  };

  return (
    <Collapsible
      title={`${icon} ${title} (${totalCount})`}
      defaultCollapsed={false}
      className="border rounded-lg"
      headerClassName="p-3 hover:bg-gray-50"
      contentClassName="p-3 pt-0"
    >
      <div className="space-y-3">
        {/* Top Level */}
        {data.topLevel.length > 0 && (
          <div className="ml-0">
            <h6 className={`font-medium text-sm mb-2 px-2 py-1 rounded border ${colorClasses[color as keyof typeof colorClasses]}`}>
              Top Level ({data.topLevel.length})
            </h6>
            <ObjectList objects={data.topLevel} level="top" />
          </div>
        )}

        {/* Child Level */}
        {data.childLevel.length > 0 && (
          <div className="ml-4">
            <h6 className={`font-medium text-sm mb-2 px-2 py-1 rounded border ${colorClasses[color as keyof typeof colorClasses]}`}>
              Child Level ({data.childLevel.length})
            </h6>
            <ObjectList objects={data.childLevel} level="child" />
          </div>
        )}

        {/* Grandchild Level */}
        {data.grandchildLevel.length > 0 && (
          <div className="ml-8">
            <h6 className={`font-medium text-sm mb-2 px-2 py-1 rounded border ${colorClasses[color as keyof typeof colorClasses]}`}>
              Grandchild Level ({data.grandchildLevel.length})
            </h6>
            <ObjectList objects={data.grandchildLevel} level="grandchild" />
          </div>
        )}
      </div>
    </Collapsible>
  );
}

/**
 * Object list component
 */
function ObjectList({ 
  objects, 
  level 
}: { 
  objects: HierarchicalObject[]; 
  level: 'top' | 'child' | 'grandchild';
}) {
  if (objects.length === 0) return null;

  const levelStyles = {
    top: 'border-l-2 border-green-500',
    child: 'border-l-2 border-blue-500',
    grandchild: 'border-l-2 border-purple-500'
  };

  return (
    <div className="space-y-1">
      {objects.map((obj, _index) => (
        <div 
          key={obj.ID} 
          className={`p-2 rounded text-xs bg-gray-50 ${levelStyles[level]}`}
        >
          <div className="font-medium truncate" title={obj.Title}>
            {obj.Title}
          </div>
          <div className="text-gray-500 text-xs mt-1">
            {obj.Workspace} • {obj.Status}
            {obj.relationshipType && ` • ${obj.relationshipType}`}
          </div>
          {obj.relationshipPath && obj.relationshipPath.length > 0 && (
            <div className="text-gray-400 text-xs mt-1 truncate">
              Path: {obj.relationshipPath.join(' → ')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Helper functions for CSV export
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      return `"${value.toString().replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
