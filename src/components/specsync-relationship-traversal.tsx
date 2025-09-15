'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible } from '@/components/ui/collapsible';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { matchPdfContent, MatchedContent } from '@/lib/pdf-matcher';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SolutionPdf } from '@/lib/solution-pdf';
import { BlueDolphinConfig, BlueDolphinObjectEnhanced } from '@/types/blue-dolphin';
import { 
  MappingResult, 
  TraversalResult, 
  TraversalResultWithPayloads,
  HierarchicalObject 
} from '@/types/blue-dolphin-relationships';
import { BlueDolphinRelationshipService } from '@/lib/blue-dolphin-relationship-service';
import { SolutionDescriptionService, SolutionDescriptionData } from '@/lib/solution-description-service';
import { SpecSyncItem } from '@/types';

interface SpecSyncRelationshipTraversalProps {
  mappingResults: MappingResult[];
  blueDolphinConfig: BlueDolphinConfig;
  workspaceFilter: string;
  requirements?: SpecSyncItem[];
  onBlueDolphinObjectsLoaded?: (objects: BlueDolphinObjectEnhanced[]) => void;
}

export function SpecSyncRelationshipTraversal({ 
  mappingResults, 
  blueDolphinConfig, 
  workspaceFilter,
  requirements = [],
  onBlueDolphinObjectsLoaded
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
  
  // Solution Description Generation State
  const [isGeneratingSolution, setIsGeneratingSolution] = useState(false);
  const [solutionDescriptionData, setSolutionDescriptionData] = useState<SolutionDescriptionData | null>(null);
  const [solutionDescriptionMarkdown, setSolutionDescriptionMarkdown] = useState<string>('');
  const [showSolutionDescription, setShowSolutionDescription] = useState(false);
  const [matchedContent, setMatchedContent] = useState<MatchedContent | null>(null);

  // Initialize relationship service with dynamic workspace detection
  const relationshipService = useMemo(() => {
    // Use the workspace from the first mapping result if available
    const detectedWorkspace = mappingResults.length > 0 
      ? mappingResults[0].blueDolphinObject.Workspace || workspaceFilter
      : workspaceFilter;
    
    console.log(`🏢 Using workspace: ${detectedWorkspace} (from mapping results: ${mappingResults.length > 0})`);
    
    return new BlueDolphinRelationshipService(blueDolphinConfig, detectedWorkspace);
  }, [blueDolphinConfig, workspaceFilter, mappingResults]); // Include mappingResults dependency

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

      // Extract Blue Dolphin objects from this single traversal result and call callback
      if (onBlueDolphinObjectsLoaded) {
        const blueDolphinObjects: BlueDolphinObjectEnhanced[] = [];
        
        // Add Application Function
        if (result.applicationFunction && result.applicationFunction.ID) {
          blueDolphinObjects.push(result.applicationFunction as BlueDolphinObjectEnhanced);
        }
        
        // Add Business Processes
        [...result.businessProcesses.topLevel, ...result.businessProcesses.childLevel, ...result.businessProcesses.grandchildLevel].forEach(obj => {
          if (obj.ID) {
            blueDolphinObjects.push(obj as BlueDolphinObjectEnhanced);
          }
        });
        
        // Add Application Services
        [...result.applicationServices.topLevel, ...result.applicationServices.childLevel, ...result.applicationServices.grandchildLevel].forEach(obj => {
          if (obj.ID) {
            blueDolphinObjects.push(obj as BlueDolphinObjectEnhanced);
          }
        });
        
        // Add Application Interfaces
        [...result.applicationInterfaces.topLevel, ...result.applicationInterfaces.childLevel, ...result.applicationInterfaces.grandchildLevel].forEach(obj => {
          if (obj.ID) {
            blueDolphinObjects.push(obj as BlueDolphinObjectEnhanced);
          }
        });
        
        // Add Deliverables
        [...result.deliverables.topLevel, ...result.deliverables.childLevel, ...result.deliverables.grandchildLevel].forEach(obj => {
          if (obj.ID) {
            blueDolphinObjects.push(obj as BlueDolphinObjectEnhanced);
          }
        });
        
        // Add Related Application Functions
        result.relatedApplicationFunctions.forEach(obj => {
          if (obj.ID) {
            blueDolphinObjects.push(obj as BlueDolphinObjectEnhanced);
          }
        });

        // Deduplicate by ID
        const uniqueObjects = blueDolphinObjects.filter((obj, index, self) => 
          index === self.findIndex(o => o.ID === obj.ID)
        );

        console.log('🔵 [Single Traversal] Extracted Blue Dolphin objects:', uniqueObjects.length);
        console.log('🔵 [Single Traversal] Object types breakdown:', {
          deliverables: uniqueObjects.filter(obj => obj.Definition === 'Deliverable').length,
          applicationFunctions: uniqueObjects.filter(obj => obj.Definition === 'Application Function').length,
          applicationInterfaces: uniqueObjects.filter(obj => obj.Definition === 'Application Interface').length,
          applicationServices: uniqueObjects.filter(obj => obj.Definition === 'Application Service').length,
          businessProcesses: uniqueObjects.filter(obj => obj.Definition === 'Business Process').length
        });
        
        // Persist Blue Dolphin objects to local storage
        try {
          const storageKey = 'blueDolphinTraversalObjects';
          const storageData = {
            objects: uniqueObjects,
            timestamp: new Date().toISOString(),
            source: 'traversal',
            workspaceFilter: workspaceFilter,
            totalObjects: uniqueObjects.length,
            objectTypes: {
              deliverables: uniqueObjects.filter(obj => obj.Definition === 'Deliverable').length,
              applicationFunctions: uniqueObjects.filter(obj => obj.Definition === 'Application Function').length,
              applicationInterfaces: uniqueObjects.filter(obj => obj.Definition === 'Application Interface').length,
              applicationServices: uniqueObjects.filter(obj => obj.Definition === 'Application Service').length,
              businessProcesses: uniqueObjects.filter(obj => obj.Definition === 'Business Process').length
            }
          };
          localStorage.setItem(storageKey, JSON.stringify(storageData));
          console.log('💾 [Single Traversal] Blue Dolphin objects saved to local storage:', uniqueObjects.length);
        } catch (error) {
          console.error('❌ [Single Traversal] Failed to save Blue Dolphin objects to local storage:', error);
        }
        
        onBlueDolphinObjectsLoaded(uniqueObjects);
      }

    } catch (error) {
      console.error(`❌ Traversal failed for ${mappingResult.specSyncFunctionName}:`, error);
      setError(error instanceof Error ? error.message : 'Traversal failed');
    } finally {
      setIsTraversing(false);
      setTraversingFunction(null);
    }
  }, [relationshipService, workspaceFilter, maxDepth, onBlueDolphinObjectsLoaded]);

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
      // const _seen = new Set<string>();
      const merged: TraversalResult[] = [];
      // Keep individual results for optional drill-down but also compute a synthetic combined result
      const combined = combineTraversalResults(results);
      merged.push(combined);
      setTraversalResults(merged);

      // Extract Blue Dolphin objects from traversal results and call callback
      if (onBlueDolphinObjectsLoaded) {
        const blueDolphinObjects: BlueDolphinObjectEnhanced[] = [];
        
        // Collect all Blue Dolphin objects from traversal results
        results.forEach(result => {
          // Add Application Function
          if (result.applicationFunction && result.applicationFunction.ID) {
            blueDolphinObjects.push(result.applicationFunction as BlueDolphinObjectEnhanced);
          }
          
          // Add Business Processes
          [...result.businessProcesses.topLevel, ...result.businessProcesses.childLevel, ...result.businessProcesses.grandchildLevel].forEach(obj => {
            if (obj.ID) {
              blueDolphinObjects.push(obj as BlueDolphinObjectEnhanced);
            }
          });
          
          // Add Application Services
          [...result.applicationServices.topLevel, ...result.applicationServices.childLevel, ...result.applicationServices.grandchildLevel].forEach(obj => {
            if (obj.ID) {
              blueDolphinObjects.push(obj as BlueDolphinObjectEnhanced);
            }
          });
          
          // Add Application Interfaces
          [...result.applicationInterfaces.topLevel, ...result.applicationInterfaces.childLevel, ...result.applicationInterfaces.grandchildLevel].forEach(obj => {
            if (obj.ID) {
              blueDolphinObjects.push(obj as BlueDolphinObjectEnhanced);
            }
          });
          
          // Add Deliverables
          [...result.deliverables.topLevel, ...result.deliverables.childLevel, ...result.deliverables.grandchildLevel].forEach(obj => {
            if (obj.ID) {
              blueDolphinObjects.push(obj as BlueDolphinObjectEnhanced);
            }
          });
          
          // Add Related Application Functions
          result.relatedApplicationFunctions.forEach(obj => {
            if (obj.ID) {
              blueDolphinObjects.push(obj as BlueDolphinObjectEnhanced);
            }
          });
        });

        // Deduplicate by ID
        const uniqueObjects = blueDolphinObjects.filter((obj, index, self) => 
          index === self.findIndex(o => o.ID === obj.ID)
        );

        console.log('🔵 [Traversal] Extracted Blue Dolphin objects:', uniqueObjects.length);
        console.log('🔵 [Traversal] Object types breakdown:', {
          deliverables: uniqueObjects.filter(obj => obj.Definition === 'Deliverable').length,
          applicationFunctions: uniqueObjects.filter(obj => obj.Definition === 'Application Function').length,
          applicationInterfaces: uniqueObjects.filter(obj => obj.Definition === 'Application Interface').length,
          applicationServices: uniqueObjects.filter(obj => obj.Definition === 'Application Service').length,
          businessProcesses: uniqueObjects.filter(obj => obj.Definition === 'Business Process').length
        });
        
        // Persist Blue Dolphin objects to local storage
        try {
          const storageKey = 'blueDolphinTraversalObjects';
          const storageData = {
            objects: uniqueObjects,
            timestamp: new Date().toISOString(),
            source: 'traversal',
            workspaceFilter: workspaceFilter,
            totalObjects: uniqueObjects.length,
            objectTypes: {
              deliverables: uniqueObjects.filter(obj => obj.Definition === 'Deliverable').length,
              applicationFunctions: uniqueObjects.filter(obj => obj.Definition === 'Application Function').length,
              applicationInterfaces: uniqueObjects.filter(obj => obj.Definition === 'Application Interface').length,
              applicationServices: uniqueObjects.filter(obj => obj.Definition === 'Application Service').length,
              businessProcesses: uniqueObjects.filter(obj => obj.Definition === 'Business Process').length
            }
          };
          localStorage.setItem(storageKey, JSON.stringify(storageData));
          console.log('💾 [Traversal] Blue Dolphin objects saved to local storage:', uniqueObjects.length);
        } catch (error) {
          console.error('❌ [Traversal] Failed to save Blue Dolphin objects to local storage:', error);
        }
        
        onBlueDolphinObjectsLoaded(uniqueObjects);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Combined traversal failed');
    } finally {
      setIsTraversing(false);
      setTraversingFunction(null);
    }
  }, [mappingResults, relationshipService, maxDepth, onBlueDolphinObjectsLoaded, workspaceFilter]);

  // Helper: combine multiple TraversalResult objects into one unified result
  function combineTraversalResults(results: TraversalResult[]): TraversalResult {
    if (results.length === 0) {
      return {
        applicationFunction: {} as any,
        businessProcesses: { topLevel: [], childLevel: [], grandchildLevel: [] },
        applicationServices: { topLevel: [], childLevel: [], grandchildLevel: [] },
        applicationInterfaces: { topLevel: [], childLevel: [], grandchildLevel: [] },
        deliverables: { topLevel: [], childLevel: [], grandchildLevel: [] },
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
        deliverables: mergeSections(acc.deliverables, cur.deliverables),
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
      acc.deliverables.topLevel.length + acc.deliverables.childLevel.length + acc.deliverables.grandchildLevel.length +
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
  }, [relationshipService, generateFullPayloadCSV]);

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

      // Deliverables
      [...result.deliverables.topLevel, ...result.deliverables.childLevel, ...result.deliverables.grandchildLevel].forEach(obj => {
        rows.push({
          'SpecSync Function': result.specSyncFunctionName,
          'Application Function': result.applicationFunction.Title,
          'Object Type': 'Deliverable',
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

  // Solution Description Generation
  const handleGenerateSolutionDescription = useCallback(async () => {
    if (traversalResults.length === 0) {
      setError('No traversal results available. Please run traversal and extract payloads first.');
      return;
    }

    setIsGeneratingSolution(true);
    setError(null);

    try {
      // Convert traversal results to the format expected by the service
      const resultsWithPayloads: TraversalResultWithPayloads[] = traversalResults.map(result => ({
        ...result,
        businessProcesses: result.businessProcesses || { topLevel: [], childLevel: [], grandchildLevel: [] },
        applicationServices: result.applicationServices || { topLevel: [], childLevel: [], grandchildLevel: [] },
        applicationInterfaces: result.applicationInterfaces || { topLevel: [], childLevel: [], grandchildLevel: [] },
        applicationFunctions: result.relatedApplicationFunctions || [],
        payloadMetadata: {
          totalObjectsExtracted: 0,
          enhancedFieldsAvailable: 0,
          workspaceScoped: result.applicationFunction.Workspace || 'Unknown',
          extractionTimestamp: new Date().toISOString(),
          extractionTimeMs: 0
        }
      }));

      // Generate solution description data
      const solutionData = SolutionDescriptionService.generateSolutionDescription(
        mappingResults,
        resultsWithPayloads,
        requirements,
        'E2E Delivery Management Solution'
      );

      // Generate markdown document
      const markdown = SolutionDescriptionService.generateMarkdownDocument(solutionData);

      setSolutionDescriptionData(solutionData);
      setSolutionDescriptionMarkdown(markdown);
      setShowSolutionDescription(true);

      // Ingest PDFs and compute matches (non-blocking for markdown)
      try {
        const res = await fetch('/api/pdf-ingest');
        if (res.ok) {
          const payload = await res.json();
          const matches = matchPdfContent(payload.files, requirements, mappingResults, resultsWithPayloads);
          setMatchedContent(matches);
        }
      } catch (e) {
        console.warn('PDF ingestion/matching skipped:', e);
      }

      console.log('✅ [Solution Description] Generated successfully');
    } catch (err) {
      console.error('❌ [Solution Description] Error generating solution description:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate solution description');
    } finally {
      setIsGeneratingSolution(false);
    }
  }, [traversalResults, mappingResults, requirements]);

  const handleDownloadSolutionDescription = useCallback(() => {
    if (!solutionDescriptionMarkdown) return;

    const blob = new Blob([solutionDescriptionMarkdown], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solution-description-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [solutionDescriptionMarkdown]);

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

    // Build global aggregated requirement IDs across all selected mappings (for Combined view)
    const globalReqIdSet = new Set<string>();
    mappingResults.forEach(m => {
      const ids: string[] = Array.isArray((m as any).specSyncRequirementIds)
        ? (m as any).specSyncRequirementIds as string[]
        : (m.specSyncRequirementId ? [m.specSyncRequirementId] : []);
      ids.forEach(id => id && globalReqIdSet.add(id));
    });
    const globalReqIds = Array.from(globalReqIdSet);

    const dedup = new Map<string, any>();
    const push = (obj: any, type: string, appFuncId?: string, isCombined?: boolean) => {
      const key = obj.ID;
      if (dedup.has(key)) return;
      const reqIds = isCombined
        ? globalReqIds
        : (appFuncId ? (aggReqIdsByFunctionId.get(appFuncId) || []) : []);
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
      const isCombined = tr.specSyncFunctionName === 'Combined';
      push(tr.applicationFunction, 'Application Function', appId, isCombined);
      [...tr.businessProcesses.topLevel, ...tr.businessProcesses.childLevel, ...tr.businessProcesses.grandchildLevel].forEach(o => push(o, 'Business Process', appId, isCombined));
      [...tr.applicationServices.topLevel, ...tr.applicationServices.childLevel, ...tr.applicationServices.grandchildLevel].forEach(o => push(o, 'Application Service', appId, isCombined));
      [...tr.applicationInterfaces.topLevel, ...tr.applicationInterfaces.childLevel, ...tr.applicationInterfaces.grandchildLevel].forEach(o => push(o, 'Application Interface', appId, isCombined));
      tr.relatedApplicationFunctions.forEach(o => push(o, 'Related Application Function', appId, isCombined));
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

    // Determine which mappings to use when computing SpecSync Requirement IDs
    // - For Combined view: use ALL selected mappings (union across seeds)
    // - For per-function view: only mappings for that Application Function ID
    const isCombined = result.specSyncFunctionName === 'Combined';
    const matchingMappings = isCombined
      ? mappingResults
      : mappingResults.filter(mapping => mapping.blueDolphinObject.ID === result.applicationFunction.ID);
    
    console.log(`🔍 [Traversal] Looking for mappings for Application Function ID: ${result.applicationFunction.ID}`);
    console.log(`📊 [Traversal] Total mapping results available: ${mappingResults.length}`);
    console.log(`🎯 [Traversal] Matching mappings found: ${matchingMappings.length} (combined=${isCombined})`);
    console.log(`📋 [Traversal] Matching mappings:`, matchingMappings.map(m => ({
      specSyncRequirementId: m.specSyncRequirementId,
      specSyncFunctionName: m.specSyncFunctionName,
      blueDolphinObjectId: m.blueDolphinObject.ID
    })));
    
    // Compute label for Application Function column
    const uniqueSeedFunctionTitles = Array.from(
      new Map(matchingMappings.map(m => [m.blueDolphinObject.ID, m.blueDolphinObject.Title])).values()
    ) as string[];
    const applicationFunctionLabel = isCombined
      ? uniqueSeedFunctionTitles.join(', ')
      : result.applicationFunction.Title;

    // Serialize all requirement IDs into a string (use aggregated ids when available)
    const requirementIdSet = new Set<string>();
    matchingMappings.forEach(m => {
      if (Array.isArray((m as any).specSyncRequirementIds)) {
        (m as any).specSyncRequirementIds!.forEach((id: string) => id && requirementIdSet.add(id));
      } else if (m.specSyncRequirementId) {
        requirementIdSet.add(m.specSyncRequirementId);
      }
    });
    const requirementIds = Array.from(requirementIdSet);
    const requirementIdString = requirementIds.length > 0 ? requirementIds.join(', ') : 'N/A';
    
    console.log(`🔍 [Traversal] Raw requirement IDs from mappings:`, requirementIds);
    console.log(`✅ [Traversal] Final requirement ID string: "${requirementIdString}"`);

    // Helper function to create a comprehensive row with selected enhanced fields
    const createComprehensiveRow = (obj: any, objectType: string, objectLevel: string, relationshipType: string = 'N/A', relationshipPath: string = 'N/A') => {
      const baseRow = {
        'SpecSync Requirement ID': requirementIdString,
        'SpecSync Function': result.specSyncFunctionName,
        'Application Function': applicationFunctionLabel,
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

    // Deliverables with full payload
    [...result.deliverables.topLevel, ...result.deliverables.childLevel, ...result.deliverables.grandchildLevel].forEach(obj => {
      rows.push(createComprehensiveRow(
        obj, 
        'Deliverable', 
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

      {/* Solution Description Generation */}
      {traversalResults.length > 0 && (
        <div className="space-y-4">
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-medium text-lg">Solution Description Generation</h4>
                <p className="text-sm text-gray-600">
                  Generate comprehensive solution description document with full traceability
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerateSolutionDescription}
                  disabled={isGeneratingSolution}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isGeneratingSolution ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      📄 Generate Solution Description
                    </>
                  )}
                </Button>
                {solutionDescriptionMarkdown && (
                  <Button 
                    onClick={handleDownloadSolutionDescription}
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Document
                  </Button>
                )}
                {solutionDescriptionData && (
                  <PDFDownloadLink
                    document={<SolutionPdf data={solutionDescriptionData} matches={matchedContent || undefined} />}
                    fileName={`solution-description-${new Date().toISOString().split('T')[0]}.pdf`}
                  >
                    {({ loading }) => (
                      <Button variant="outline" disabled={loading}>
                        <Download className="w-4 h-4 mr-2" />
                        {loading ? 'Preparing PDF...' : 'Download PDF'}
                      </Button>
                    )}
                  </PDFDownloadLink>
                )}
              </div>
            </div>

            {/* Solution Description Preview */}
            {showSolutionDescription && solutionDescriptionData && (
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    📋 Solution Description Preview
                    <Badge variant="outline" className="text-xs">
                      {solutionDescriptionData.statistics.totalRequirements} requirements
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {solutionDescriptionData.statistics.totalTMFunctions} TMF functions
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {solutionDescriptionData.statistics.totalBusinessProcesses + solutionDescriptionData.statistics.totalApplicationServices + solutionDescriptionData.statistics.totalApplicationInterfaces} components
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Statistics Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {solutionDescriptionData.statistics.totalRequirements}
                        </div>
                        <div className="text-sm text-blue-800">Requirements</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {solutionDescriptionData.statistics.totalTMFunctions}
                        </div>
                        <div className="text-sm text-green-800">TMF Functions</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {solutionDescriptionData.statistics.totalBusinessProcesses}
                        </div>
                        <div className="text-sm text-purple-800">Business Processes</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {solutionDescriptionData.statistics.totalApplicationServices}
                        </div>
                        <div className="text-sm text-orange-800">Application Services</div>
                      </div>
                    </div>

                    {/* TMF Functions Summary */}
                    <div>
                      <h5 className="font-medium mb-2">TMF Functions Mapped:</h5>
                      <div className="space-y-2">
                        {solutionDescriptionData.tmfFunctions.map((func, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{func.name}</span>
                              <span className="text-sm text-gray-600 ml-2">({func.domain})</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {func.requirements.length} requirements
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Traceability Summary */}
                    <div>
                      <h5 className="font-medium mb-2">Traceability Coverage:</h5>
                      <div className="text-sm text-gray-600">
                        <div>• Requirements with Business Processes: {solutionDescriptionData.traceabilityMap.filter(m => m.businessProcesses.length > 0).length}</div>
                        <div>• Requirements with Application Services: {solutionDescriptionData.traceabilityMap.filter(m => m.applicationServices.length > 0).length}</div>
                        <div>• Requirements with Application Interfaces: {solutionDescriptionData.traceabilityMap.filter(m => m.applicationInterfaces.length > 0).length}</div>
                      </div>
                    </div>

                    {/* Document Preview */}
                    <div>
                      <h5 className="font-medium mb-2">Document Preview:</h5>
                      <div className="bg-gray-50 p-3 rounded text-sm max-h-40 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-xs">
                          {solutionDescriptionMarkdown.substring(0, 500)}...
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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
    result.deliverables.topLevel.length + result.deliverables.childLevel.length + result.deliverables.grandchildLevel.length +
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

        {/* Deliverables */}
        <HierarchicalSection
          title="Deliverables"
          color="yellow"
          icon="📦"
          data={result.deliverables}
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
