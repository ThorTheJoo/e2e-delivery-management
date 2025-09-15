import { BlueDolphinConfig } from '@/types/blue-dolphin';
import { 
  BlueDolphinRelation, 
  HierarchicalObject, 
  TraversalResult, 
  TraversalResultWithPayloads,
  CacheEntry, 
  TraversalConfig,
  MappingResult 
} from '@/types/blue-dolphin-relationships';

export class BlueDolphinRelationshipService {
  private config: BlueDolphinConfig;
  private workspaceFilter: string;
  private cache: Map<string, CacheEntry> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 minutes

  constructor(config: BlueDolphinConfig, workspaceFilter: string) {
    this.config = config;
    this.workspaceFilter = workspaceFilter;
  }

  /**
   * Main traversal function - discovers all related objects for an Application Function
   */
  async traverseRelationships(
    mappingResult: MappingResult,
    config: TraversalConfig = this.getDefaultConfig()
  ): Promise<TraversalResult> {
    const startTime = Date.now();
    console.log(`🔍 Starting relationship traversal for: ${mappingResult.specSyncFunctionName}`);

    try {
      // Perform recursive traversal
      const allDiscoveredObjects = await this.recursiveTraversal(
        mappingResult.blueDolphinObject.ID,
        new Set([mappingResult.blueDolphinObject.ID]), // visited objects
        0, // current depth
        config.maxDepth
      );

      console.log(`📊 Recursive traversal found ${allDiscoveredObjects.length} total objects`);

      // Group objects by type
      const businessProcesses = allDiscoveredObjects.filter(obj => obj.Definition === 'Business Process');
      const applicationServices = allDiscoveredObjects.filter(obj => obj.Definition === 'Application Service');
      const applicationInterfaces = allDiscoveredObjects.filter(obj => obj.Definition === 'Application Interface');
      const deliverables = allDiscoveredObjects.filter(obj => obj.Definition === 'Deliverable');
      const relatedFunctions = allDiscoveredObjects.filter(obj => obj.Definition === 'Application Function' && obj.ID !== mappingResult.blueDolphinObject.ID);

      // Detect hierarchy for each type
      const hierarchicalBusinessProcesses = this.detectObjectHierarchy(businessProcesses, []);
      const hierarchicalApplicationServices = this.detectObjectHierarchy(applicationServices, []);
      const hierarchicalApplicationInterfaces = this.detectObjectHierarchy(applicationInterfaces, []);
      const hierarchicalDeliverables = this.detectObjectHierarchy(deliverables, []);
      const hierarchicalRelatedFunctions = this.detectObjectHierarchy(relatedFunctions, []);

      // Organize by hierarchy levels
      const result: TraversalResult = {
        applicationFunction: mappingResult.blueDolphinObject,
        businessProcesses: this.organizeByHierarchy(hierarchicalBusinessProcesses),
        applicationServices: this.organizeByHierarchy(hierarchicalApplicationServices),
        applicationInterfaces: this.organizeByHierarchy(hierarchicalApplicationInterfaces),
        deliverables: this.organizeByHierarchy(hierarchicalDeliverables),
        relatedApplicationFunctions: hierarchicalRelatedFunctions,
        specSyncFunctionName: mappingResult.specSyncFunctionName,
        traversalMetadata: {
          totalObjectsFound: allDiscoveredObjects.length,
          maxDepthReached: this.calculateMaxDepth(allDiscoveredObjects),
          processingTimeMs: Date.now() - startTime,
          cacheHitRate: this.calculateCacheHitRate()
        }
      };

      console.log(`✅ Traversal completed in ${result.traversalMetadata.processingTimeMs}ms`);
      console.log(`📈 Found ${result.traversalMetadata.totalObjectsFound} total objects`);
      console.log(`📊 Breakdown: ${businessProcesses.length} Business Processes, ${applicationServices.length} Application Services, ${applicationInterfaces.length} Application Interfaces, ${deliverables.length} Deliverables, ${relatedFunctions.length} Related Functions`);
      
      // Automatically save to local storage for later enrichment
      this.saveTraversalResultToStorage(result);
      
      return result;

    } catch (error) {
      console.error('❌ Traversal failed:', error);
      throw new Error(`Relationship traversal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract full payloads with extended properties for all discovered objects
   */
  async extractFullPayloads(traversalResult: TraversalResult): Promise<TraversalResultWithPayloads> {
    const startTime = Date.now();
    console.log(`🔍 Starting full payload extraction for ${traversalResult.traversalMetadata.totalObjectsFound} objects`);

    try {
      // Collect all object IDs
      const allObjectIds = new Set<string>();
      
      // Add Application Function
      allObjectIds.add(traversalResult.applicationFunction.ID);
      
      // Add all Business Processes
      Object.values(traversalResult.businessProcesses).forEach(level => {
        level.forEach(obj => allObjectIds.add(obj.ID));
      });
      
      // Add all Application Services
      Object.values(traversalResult.applicationServices).forEach(level => {
        level.forEach(obj => allObjectIds.add(obj.ID));
      });
      
      // Add all Application Interfaces
      Object.values(traversalResult.applicationInterfaces).forEach(level => {
        level.forEach(obj => allObjectIds.add(obj.ID));
      });
      
      // Add all Deliverables
      Object.values(traversalResult.deliverables).forEach(level => {
        level.forEach(obj => allObjectIds.add(obj.ID));
      });
      
      // Add all Related Functions
      traversalResult.relatedApplicationFunctions.forEach(obj => {
        allObjectIds.add(obj.ID);
      });

      console.log(`📊 Extracting full payloads for ${allObjectIds.size} unique objects`);

      // Extract full payloads for all objects
      const fullPayloads = await this.individualObjectLookups(Array.from(allObjectIds));
      console.log(`✅ Retrieved ${fullPayloads.length} full payloads`);

      // Create lookup map for full payloads
      const payloadMap = new Map<string, any>();
      fullPayloads.forEach(payload => {
        payloadMap.set(payload.ID, payload);
      });

      // Replace objects with full payloads
      const result: TraversalResultWithPayloads = {
        ...traversalResult,
        applicationFunction: payloadMap.get(traversalResult.applicationFunction.ID) || traversalResult.applicationFunction,
        businessProcesses: this.replaceWithFullPayloads(traversalResult.businessProcesses, payloadMap),
        applicationServices: this.replaceWithFullPayloads(traversalResult.applicationServices, payloadMap),
        applicationInterfaces: this.replaceWithFullPayloads(traversalResult.applicationInterfaces, payloadMap),
        deliverables: this.replaceWithFullPayloads(traversalResult.deliverables, payloadMap),
        relatedApplicationFunctions: traversalResult.relatedApplicationFunctions.map(obj => 
          payloadMap.get(obj.ID) || obj
        ),
        payloadMetadata: {
          totalObjectsExtracted: fullPayloads.length,
          enhancedFieldsAvailable: this.countEnhancedFields(fullPayloads[0] || {}),
          workspaceScoped: this.workspaceFilter,
          extractionTimestamp: new Date().toISOString(),
          extractionTimeMs: Date.now() - startTime
        }
      };

      console.log(`✅ Full payload extraction completed in ${result.payloadMetadata.extractionTimeMs}ms`);
      console.log(`📊 Enhanced fields available: ${result.payloadMetadata.enhancedFieldsAvailable}`);
      
      return result;

    } catch (error) {
      console.error('❌ Full payload extraction failed:', error);
      throw new Error(`Full payload extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Replace hierarchical objects with full payloads
   */
  private replaceWithFullPayloads(
    hierarchicalObjects: { topLevel: HierarchicalObject[]; childLevel: HierarchicalObject[]; grandchildLevel: HierarchicalObject[] },
    payloadMap: Map<string, any>
  ): { topLevel: HierarchicalObject[]; childLevel: HierarchicalObject[]; grandchildLevel: HierarchicalObject[] } {
    return {
      topLevel: hierarchicalObjects.topLevel.map(obj => payloadMap.get(obj.ID) || obj),
      childLevel: hierarchicalObjects.childLevel.map(obj => payloadMap.get(obj.ID) || obj),
      grandchildLevel: hierarchicalObjects.grandchildLevel.map(obj => payloadMap.get(obj.ID) || obj)
    };
  }

  /**
   * Count enhanced fields available in an object
   */
  private countEnhancedFields(obj: any): number {
    if (!obj) return 0;
    return Object.keys(obj).filter(key => 
      key.startsWith('Object_Properties_') || 
      key.startsWith('Deliverable_Object_Status_') || 
      key.startsWith('Ameff_properties_')
    ).length;
  }

  /**
   * Recursive traversal to discover all related objects
   */
  async recursiveTraversal(
    objectId: string,
    visited: Set<string>,
    currentDepth: number,
    maxDepth: number
  ): Promise<any[]> {
    if (currentDepth >= maxDepth) {
      console.log(`🛑 Max depth ${maxDepth} reached for object ${objectId}`);
      return [];
    }

    console.log(`🔍 Recursive traversal depth ${currentDepth} for object ${objectId}`);

    // Get relationships for current object
    const relationships = await this.getRelationshipsForObject(objectId);
    console.log(`📊 Found ${relationships.length} relationships at depth ${currentDepth}`);
    
    // Log relationship types found
    if (relationships.length > 0) {
      const relationshipTypes = Array.from(new Set(relationships.map(r => r.Type).filter(Boolean)));
      console.log(`🔗 Relationship types at depth ${currentDepth}: ${relationshipTypes.join(', ')}`);
    }

    if (relationships.length === 0) {
      return [];
    }

    // Get all related object IDs
    const relatedObjectIds = new Set<string>();
    relationships.forEach(rel => {
      if (rel.BlueDolphinObjectItemId !== objectId && !visited.has(rel.BlueDolphinObjectItemId)) {
        relatedObjectIds.add(rel.BlueDolphinObjectItemId);
      }
      if (rel.RelatedBlueDolphinObjectItemId !== objectId && !visited.has(rel.RelatedBlueDolphinObjectItemId)) {
        relatedObjectIds.add(rel.RelatedBlueDolphinObjectItemId);
      }
    });

    console.log(`🎯 Found ${relatedObjectIds.size} new related object IDs at depth ${currentDepth}`);

    if (relatedObjectIds.size === 0) {
      return [];
    }

    // Get object details for related objects (individual lookups to avoid OData 400 errors)
    const relatedObjects = await this.individualObjectLookups(Array.from(relatedObjectIds));
    console.log(`📊 Retrieved ${relatedObjects.length} related objects at depth ${currentDepth}`);
    
    // Log discovered objects by type
    if (relatedObjects.length > 0) {
      const objectsByType: Record<string, any[]> = {};
      relatedObjects.forEach(obj => {
        const type = obj.Definition || 'unknown';
        if (!objectsByType[type]) objectsByType[type] = [];
        objectsByType[type].push(obj);
      });
      
      Object.keys(objectsByType).forEach(type => {
        console.log(`  📋 ${type}: ${objectsByType[type].length} objects`);
        objectsByType[type].forEach((obj: any) => {
          console.log(`    - ${obj.Title}`);
        });
      });
    }

    // Add to visited set
    relatedObjects.forEach(obj => visited.add(obj.ID));

    // Continue recursive traversal for each related object
    const allDiscoveredObjects = [...relatedObjects];
    
    for (const obj of relatedObjects) {
      const deeperObjects = await this.recursiveTraversal(
        obj.ID,
        visited,
        currentDepth + 1,
        maxDepth
      );
      allDiscoveredObjects.push(...deeperObjects);
    }

    return allDiscoveredObjects;
  }

  /**
   * Get all relationships for a specific object with optimized filtering
   */
  async getRelationshipsForObject(objectId: string): Promise<BlueDolphinRelation[]> {
    const cacheKey = this.getCacheKey('relationships', objectId);
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      console.log(`📋 Using cached relationships for object: ${objectId}`);
      return cached;
    }

    console.log(`🔍 Fetching relationships for object: ${objectId}`);
    console.log(`🏢 Workspace filter: ${this.workspaceFilter}`);

    // Use the validated optimized filter approach with Deliverable inclusion
    const optimizedFilter = `(BlueDolphinObjectItemId eq '${objectId}' or RelatedBlueDolphinObjectItemId eq '${objectId}') and BlueDolphinObjectWorkspaceName eq '${this.workspaceFilter}' and RelatedBlueDolphinObjectWorkspaceName eq '${this.workspaceFilter}' and (RelatedBlueDolphinObjectDefinitionName eq 'Application Function' or RelatedBlueDolphinObjectDefinitionName eq 'Application Service' or RelatedBlueDolphinObjectDefinitionName eq 'Application Interface' or RelatedBlueDolphinObjectDefinitionName eq 'Business Process' or RelatedBlueDolphinObjectDefinitionName eq 'Deliverable')`;

    console.log(`🎯 Using optimized filter: ${optimizedFilter}`);

    try {
      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-objects-enhanced',
          config: this.config,
          data: {
            endpoint: '/Relations',
            filter: optimizedFilter,
            moreColumns: true,
            top: 1000
          }
        })
      });

      if (!response.ok) {
        console.error('❌ Optimized filter HTTP error:', response.status);
        return [];
      }
      const result = await response.json();
      
      if (!result.success) {
        console.log(`❌ Optimized filter failed: ${result.error}`);
        return [];
      }

      const relationships = result.data || [];
      console.log(`📊 Optimized filter found ${relationships.length} relationships`);
      
      if (relationships.length > 0) {
        console.log(`✅ Using optimized filter - found relationships!`);
        console.log(`🔍 Sample relationship:`, relationships[0]);
        this.setCache(cacheKey, relationships);
        return relationships;
      }
    } catch (error) {
      console.error(`❌ Optimized filter error:`, error);
    }

    console.log(`⚠️ No relationships found with optimized filter for object: ${objectId}`);
    return [];
  }

  /**
   * Find related objects by type and detect hierarchy
   */
  async findRelatedObjectsWithHierarchy(
    relationships: BlueDolphinRelation[], 
    objectType: string
  ): Promise<HierarchicalObject[]> {
    console.log(`🔍 Finding ${objectType} objects with hierarchy detection`);

    // Filter relationships for the target object type
    const relevantRelations = relationships.filter(rel => 
      rel.RelatedBlueDolphinObjectDefinitionName === objectType ||
      rel.BlueDolphinObjectDefinitionName === objectType
    );

    if (relevantRelations.length === 0) {
      console.log(`📭 No ${objectType} relationships found`);
      return [];
    }

    // Get unique object IDs
    const relatedIds = new Set<string>();
    relevantRelations.forEach(rel => {
      if (rel.RelatedBlueDolphinObjectDefinitionName === objectType) {
        relatedIds.add(rel.RelatedBlueDolphinObjectItemId);
      }
      if (rel.BlueDolphinObjectDefinitionName === objectType) {
        relatedIds.add(rel.BlueDolphinObjectItemId);
      }
    });

    if (relatedIds.size === 0) {
      console.log(`📭 No ${objectType} object IDs found`);
      return [];
    }

    // Fetch object details
    const objects = await this.batchObjectLookups(Array.from(relatedIds), objectType);
    console.log(`📊 Retrieved ${objects.length} ${objectType} objects`);

    // Detect hierarchy
    const hierarchicalObjects = this.detectObjectHierarchy(objects, relevantRelations);
    console.log(`🏗️ Detected hierarchy for ${objectType}:`, {
      topLevel: hierarchicalObjects.filter(obj => obj.hierarchyLevel === 'top').length,
      childLevel: hierarchicalObjects.filter(obj => obj.hierarchyLevel === 'child').length,
      grandchildLevel: hierarchicalObjects.filter(obj => obj.hierarchyLevel === 'grandchild').length
    });

    return hierarchicalObjects;
  }

  /**
   * Individual object lookups to avoid OData 400 errors with workspace filtering
   */
  async individualObjectLookups(objectIds: string[]): Promise<any[]> {
    console.log(`🔍 Fetching ${objectIds.length} objects individually`);
    
    const allObjects: any[] = [];
    
    for (const objectId of objectIds) {
      try {
        const response = await fetch('/api/blue-dolphin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get-objects-enhanced',
            config: this.config,
            data: {
              endpoint: '/Objects',
              filter: `ID eq '${objectId}' and Workspace eq '${this.workspaceFilter}'`,
              moreColumns: true,
              top: 1
            }
          })
        });

        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          allObjects.push(result.data[0]);
          console.log(`✅ Found: ${result.data[0].Title} (${result.data[0].Definition})`);
        } else {
          console.log(`❌ Object ${objectId} not found: ${result.error || 'No data'}`);
        }
      } catch (error) {
        console.log(`❌ Error getting object ${objectId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return allObjects;
  }

  /**
   * Batch object lookups for efficiency with optimized filtering
   */
  async batchObjectLookups(objectIds: string[], objectType: string): Promise<any[]> {
    const cacheKey = this.getCacheKey('objects', `${objectType}-${objectIds.sort().join(',')}`);
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      console.log(`📋 Using cached objects for type: ${objectType}`);
      return cached;
    }

    console.log(`🔍 Fetching ${objectIds.length} ${objectType} objects`);

    // Use optimized filter with workspace and type filtering
    const optimizedFilter = objectType === 'Any' ? 
      `ID in (${objectIds.map(id => `'${id}'`).join(',')}) and Workspace eq '${this.workspaceFilter}'` :
      `ID in (${objectIds.map(id => `'${id}'`).join(',')}) and Definition eq '${objectType}' and Workspace eq '${this.workspaceFilter}'`;

    console.log(`🎯 Using optimized object filter: ${optimizedFilter}`);

    try {
      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-objects-enhanced',
          config: this.config,
          data: {
            endpoint: '/Objects',
            filter: optimizedFilter,
            moreColumns: true,
            top: 1000
          }
        })
      });

      if (!response.ok) {
        console.error('❌ Optimized object filter HTTP error:', response.status);
        return [];
      }
      const result = await response.json();
      
      if (!result.success) {
        console.log(`❌ Optimized object filter failed: ${result.error}`);
        return [];
      }

      const objects = result.data || [];
      console.log(`📊 Optimized object filter found ${objects.length} ${objectType} objects`);
      
      if (objects.length > 0) {
        console.log(`✅ Using optimized object filter - found objects!`);
        console.log(`🔍 Sample object:`, objects[0]);
        this.setCache(cacheKey, objects);
        return objects;
      }
    } catch (error) {
      console.error(`❌ Optimized object filter error:`, error);
    }

    console.log(`⚠️ No ${objectType} objects found with optimized filter`);
    return [];
  }

  /**
   * Detect object hierarchy based on relationships
   */
  detectObjectHierarchy(
    objects: any[], 
    relationships: BlueDolphinRelation[]
  ): HierarchicalObject[] {
    console.log(`🏗️ Detecting hierarchy for ${objects.length} objects`);

    // Build relationship maps
    const parentChildMap = new Map<string, string[]>();
    const childParentMap = new Map<string, string>();
    const relationshipMap = new Map<string, BlueDolphinRelation[]>();

    // Process relationships to build maps
    relationships.forEach(rel => {
      const sourceId = rel.BlueDolphinObjectItemId;
      const targetId = rel.RelatedBlueDolphinObjectItemId;
      
      // Build parent-child relationships (composition, realization patterns)
      if (rel.Type === 'composition' || rel.Type === 'realization') {
        if (!parentChildMap.has(sourceId)) {
          parentChildMap.set(sourceId, []);
        }
        parentChildMap.get(sourceId)!.push(targetId);
        childParentMap.set(targetId, sourceId);
      }

      // Store relationship details
      if (!relationshipMap.has(sourceId)) {
        relationshipMap.set(sourceId, []);
      }
      relationshipMap.get(sourceId)!.push(rel);
    });

    // Determine hierarchy levels
    const hierarchicalObjects: HierarchicalObject[] = objects.map(obj => {
      const parentId = childParentMap.get(obj.ID);
      const children = parentChildMap.get(obj.ID) || [];
      const parentParentId = parentId ? childParentMap.get(parentId) : undefined;

      let hierarchyLevel: 'top' | 'child' | 'grandchild' = 'top';
      
      if (parentId && parentParentId) {
        hierarchyLevel = 'grandchild';
      } else if (parentId) {
        hierarchyLevel = 'child';
      }

      // Build relationship path
      const relationshipPath = this.buildRelationshipPath(obj.ID, relationships) || [];

      return {
        ...obj,
        hierarchyLevel,
        parentObjectId: parentId,
        children,
        relationshipPath,
        relationshipType: relationships.find(r => 
          r.BlueDolphinObjectItemId === obj.ID || r.RelatedBlueDolphinObjectItemId === obj.ID
        )?.Type,
        relationshipName: relationships.find(r => 
          r.BlueDolphinObjectItemId === obj.ID || r.RelatedBlueDolphinObjectItemId === obj.ID
        )?.Name
      };
    });

    return hierarchicalObjects;
  }

  /**
   * Build relationship path for an object
   */
  buildRelationshipPath(objectId: string, relationships: BlueDolphinRelation[]): string[] {
    const path: string[] = [];
    const visited = new Set<string>();
    
    const buildPath = (id: string): void => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const rel = relationships.find(r => 
        r.RelatedBlueDolphinObjectItemId === id || r.BlueDolphinObjectItemId === id
      );
      
      if (rel) {
        path.push(`${rel.BlueDolphinObjectItemId} → ${rel.RelatedBlueDolphinObjectItemId}`);
      }
    };

    buildPath(objectId);
    return path || []; // Ensure we always return an array
  }

  /**
   * Organize objects by hierarchy levels
   */
  organizeByHierarchy(objects: HierarchicalObject[]): {
    topLevel: HierarchicalObject[];
    childLevel: HierarchicalObject[];
    grandchildLevel: HierarchicalObject[];
  } {
    return {
      topLevel: objects.filter(obj => obj.hierarchyLevel === 'top'),
      childLevel: objects.filter(obj => obj.hierarchyLevel === 'child'),
      grandchildLevel: objects.filter(obj => obj.hierarchyLevel === 'grandchild')
    };
  }

  /**
   * Calculate maximum depth reached
   */
  calculateMaxDepth(objects: HierarchicalObject[]): number {
    return Math.max(...objects.map(obj => obj.relationshipPath?.length || 0), 0);
  }

  /**
   * Calculate cache hit rate
   */
  calculateCacheHitRate(): number {
    // This is a simplified calculation - in a real implementation,
    // you'd track cache hits and misses
    return 0.8; // Placeholder
  }

  /**
   * Cache management methods
   */
  private getCacheKey(prefix: string, identifier: string): string {
    return `${prefix}:${identifier}`;
  }

  private setCache(key: string, value: any): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: this.ttl
    });
  }

  private getCache(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): TraversalConfig {
    return {
      maxDepth: 5, // Increased from 3 to 5 for deeper traversal
      maxObjectsPerLevel: 100, // Increased from 50 to 100
      includeCircular: false,
      cacheEnabled: true,
      parallelProcessing: true
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Save traversal result to local storage for later enrichment
   */
  saveTraversalResultToStorage(
    result: TraversalResult | TraversalResultWithPayloads,
    keyPrefix: string = 'blueDolphinTraversal'
  ): void {
    try {
      const storageKey = `${keyPrefix}_${result.specSyncFunctionName}_${Date.now()}`;
      const storageData = {
        ...result,
        savedAt: new Date().toISOString(),
        workspaceFilter: this.workspaceFilter,
        storageKey: storageKey
      };
      
      localStorage.setItem(storageKey, JSON.stringify(storageData));
      console.log(`💾 Traversal result saved to localStorage with key: ${storageKey}`);
      
      // Also save a reference in the main index
      this.updateTraversalIndex(storageKey, result.specSyncFunctionName);
      
    } catch (error) {
      console.error('❌ Failed to save traversal result to localStorage:', error);
    }
  }

  /**
   * Load traversal result from local storage
   */
  loadTraversalResultFromStorage(storageKey: string): TraversalResult | TraversalResultWithPayloads | null {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        console.log(`❌ No data found for key: ${storageKey}`);
        return null;
      }
      
      const result = JSON.parse(stored);
      console.log(`📂 Traversal result loaded from localStorage: ${storageKey}`);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to load traversal result from localStorage:', error);
      return null;
    }
  }

  /**
   * Get all saved traversal results
   */
  getAllSavedTraversalResults(): Array<{
    key: string;
    functionName: string;
    savedAt: string;
    workspaceFilter: string;
    totalObjectsFound: number;
  }> {
    try {
      const results: Array<{
        key: string;
        functionName: string;
        savedAt: string;
        workspaceFilter: string;
        totalObjectsFound: number;
      }> = [];
      
      // Get the traversal index
      const index = this.getTraversalIndex();
      
      for (const key of index) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const data = JSON.parse(stored);
            results.push({
              key: data.storageKey || key,
              functionName: data.specSyncFunctionName,
              savedAt: data.savedAt,
              workspaceFilter: data.workspaceFilter,
              totalObjectsFound: data.traversalMetadata?.totalObjectsFound || 0
            });
          } catch (parseError) {
            console.warn(`⚠️ Failed to parse stored data for key: ${key}`);
          }
        }
      }
      
      // Sort by savedAt (newest first)
      results.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      
      console.log(`📋 Found ${results.length} saved traversal results`);
      return results;
      
    } catch (error) {
      console.error('❌ Failed to get saved traversal results:', error);
      return [];
    }
  }

  /**
   * Update the traversal index in localStorage
   */
  private updateTraversalIndex(storageKey: string, _functionName: string): void {
    try {
      const indexKey = 'blueDolphinTraversalIndex';
      const existingIndex = this.getTraversalIndex();
      
      // Add new key if not already present
      if (!existingIndex.includes(storageKey)) {
        existingIndex.push(storageKey);
        localStorage.setItem(indexKey, JSON.stringify(existingIndex));
        console.log(`📝 Updated traversal index with key: ${storageKey}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to update traversal index:', error);
    }
  }

  /**
   * Get the traversal index from localStorage
   */
  private getTraversalIndex(): string[] {
    try {
      const indexKey = 'blueDolphinTraversalIndex';
      const stored = localStorage.getItem(indexKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to get traversal index:', error);
      return [];
    }
  }

  /**
   * Clear all saved traversal results
   */
  clearAllSavedTraversalResults(): void {
    try {
      const index = this.getTraversalIndex();
      
      // Remove all stored results
      index.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear the index
      localStorage.removeItem('blueDolphinTraversalIndex');
      
      console.log(`🧹 Cleared ${index.length} saved traversal results`);
      
    } catch (error) {
      console.error('❌ Failed to clear saved traversal results:', error);
    }
  }

  /**
   * Remove a specific saved traversal result
   */
  removeSavedTraversalResult(storageKey: string): boolean {
    try {
      localStorage.removeItem(storageKey);
      
      // Remove from index
      const index = this.getTraversalIndex();
      const updatedIndex = index.filter(key => key !== storageKey);
      localStorage.setItem('blueDolphinTraversalIndex', JSON.stringify(updatedIndex));
      
      console.log(`🗑️ Removed saved traversal result: ${storageKey}`);
      return true;
      
    } catch (error) {
      console.error('❌ Failed to remove saved traversal result:', error);
      return false;
    }
  }
}
