import { BlueDolphinObjectEnhanced } from './blue-dolphin';

export interface BlueDolphinRelation {
  RelationshipId: string;
  BlueDolphinObjectItemId: string;
  RelatedBlueDolphinObjectItemId: string;
  BlueDolphinObjectDefinitionName?: string;
  RelatedBlueDolphinObjectDefinitionName?: string;
  Type?: string;
  Name?: string;
  IsRelationshipDirectionAlternative?: boolean;
  BlueDolphinObjectWorkspaceName?: string;
  RelatedBlueDolphinObjectWorkspaceName?: string;
}

export interface HierarchicalObject extends BlueDolphinObjectEnhanced {
  hierarchyLevel: 'top' | 'child' | 'grandchild';
  parentObjectId?: string;
  children: string[];
  relationshipPath?: string[];
  relationshipType?: string;
  relationshipName?: string;
}

export interface TraversalResult {
  applicationFunction: BlueDolphinObjectEnhanced;
  businessProcesses: {
    topLevel: HierarchicalObject[];
    childLevel: HierarchicalObject[];
    grandchildLevel: HierarchicalObject[];
  };
  applicationServices: {
    topLevel: HierarchicalObject[];
    childLevel: HierarchicalObject[];
    grandchildLevel: HierarchicalObject[];
  };
  applicationInterfaces: {
    topLevel: HierarchicalObject[];
    childLevel: HierarchicalObject[];
    grandchildLevel: HierarchicalObject[];
  };
  relatedApplicationFunctions: HierarchicalObject[];
  specSyncFunctionName: string;
  traversalMetadata: {
    totalObjectsFound: number;
    maxDepthReached: number;
    processingTimeMs: number;
    cacheHitRate: number;
  };
}

export interface TraversalResultWithPayloads extends TraversalResult {
  payloadMetadata: {
    totalObjectsExtracted: number;
    enhancedFieldsAvailable: number;
    workspaceScoped: string;
    extractionTimestamp: string;
    extractionTimeMs: number;
  };
}

export interface CacheEntry {
  value: any;
  timestamp: number;
  ttl: number;
}

export interface TraversalConfig {
  maxDepth: number;
  maxObjectsPerLevel: number;
  includeCircular: boolean;
  cacheEnabled: boolean;
  parallelProcessing: boolean;
}

export interface MappingResult {
  specSyncFunctionName: string;
  specSyncRequirementId: string;
  blueDolphinObject: BlueDolphinObjectEnhanced;
  matchType: 'exact' | 'contains' | 'fuzzy';
  confidence: number;
}
