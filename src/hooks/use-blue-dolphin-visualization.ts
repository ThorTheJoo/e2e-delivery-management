import { useCallback, useMemo, useRef, useState } from 'react';
import type { BlueDolphinConfig, BlueDolphinObjectEnhanced } from '@/types/blue-dolphin';
import type { BlueDolphinVisualLink, BlueDolphinVisualNode, VisualizationFilters, VisualizationViewMode } from '@/types/blue-dolphin-visualization';
import { transformObjectsToNodes, transformRelationsToLinks, resolveLinkEndpoints, uniqueSorted, type BlueDolphinRelation } from '@/lib/blue-dolphin-visualization-utils';

interface BlueDolphinApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  total?: number;
  enhancedFields?: string[];
}

interface UseBlueDolphinVisualizationResult {
  nodes: BlueDolphinVisualNode[];
  links: BlueDolphinVisualLink[];
  loading: boolean;
  error: string | null;
  filters: VisualizationFilters;
  setFilters: (f: Partial<VisualizationFilters>) => void;
  loadData: () => Promise<void>;
  available: {
    workspaces: string[];
    relationTypes: string[];
    relationNames: string[];
    sourceDefinitions: string[];
    targetDefinitions: string[];
  };
}

const DEFAULT_FILTERS: VisualizationFilters = {
  workspace: '',
  relationType: '',
  relationName: '',
  sourceDefinition: '',
  targetDefinition: '',
  resultsTop: 250,
  viewMode: 'overview'
};

export function useBlueDolphinVisualization(config: BlueDolphinConfig): UseBlueDolphinVisualizationResult {
  const [nodes, setNodes] = useState<BlueDolphinVisualNode[]>([]);
  const [links, setLinks] = useState<BlueDolphinVisualLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<VisualizationFilters>(DEFAULT_FILTERS);
  const cacheRef = useRef<Map<string, { timestamp: number; data: unknown }>>(new Map());
  const dataSnapshotRef = useRef<{ objects: BlueDolphinObjectEnhanced[]; relations: Record<string, unknown>[] } | null>(null);

  const setFilters = useCallback((f: Partial<VisualizationFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...f }));
  }, []);

  const buildObjectsFilter = useCallback(() => {
    const parts: string[] = [];
    if (filters.workspace) parts.push(`Workspace eq '${filters.workspace}'`);
    return parts.join(' and ');
  }, [filters.workspace]);

  const buildRelationsFilter = useCallback(() => {
    const parts: string[] = [];
    if (filters.workspace) parts.push(`(BlueDolphinObjectWorkspaceName eq '${filters.workspace}' or RelatedBlueDolphinObjectWorkspaceName eq '${filters.workspace}')`);
    if (filters.relationType) parts.push(`Type eq '${filters.relationType}'`);
    if (filters.relationName) parts.push(`Name eq '${filters.relationName}'`);
    if (filters.sourceDefinition) parts.push(`BlueDolphinObjectDefinitionName eq '${filters.sourceDefinition}'`);
    if (filters.targetDefinition) parts.push(`RelatedBlueDolphinObjectDefinitionName eq '${filters.targetDefinition}'`);
    return parts.join(' and ');
  }, [filters.workspace, filters.relationType, filters.relationName, filters.sourceDefinition, filters.targetDefinition]);

  const fetchWithCache = useCallback(async (key: string, body: Record<string, unknown>): Promise<BlueDolphinApiResponse> => {
    const now = Date.now();
    const cached = cacheRef.current.get(key);
    if (cached && now - cached.timestamp < 5 * 60 * 1000) return cached.data as BlueDolphinApiResponse;
    const res = await fetch('/api/blue-dolphin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json: BlueDolphinApiResponse = await res.json();
    cacheRef.current.set(key, { timestamp: now, data: json });
    return json;
  }, []);

  const loadData = useCallback(async () => {
    if (!config.odataUrl) { setError('OData URL not configured'); return; }
    setLoading(true);
    setError(null);
    try {
      // 1) Fetch objects first to anchor relations (ensures overlapping endpoints)
      const objectsBody = {
        action: 'get-objects-enhanced',
        config,
        data: { endpoint: '/Objects', filter: buildObjectsFilter(), top: filters.resultsTop, orderby: 'Title asc', moreColumns: true }
      };
      const objectsJson = await fetchWithCache(`obj|${objectsBody.data.filter}|${filters.resultsTop}`, objectsBody);
      if (!objectsJson.success) throw new Error(objectsJson.error || 'Failed objects load');
      const objects = (objectsJson.data as BlueDolphinObjectEnhanced[] | undefined) || [];

      // 2) Build relations filter constrained to fetched object IDs to guarantee edges
      const objectIds = objects.map(o => String(o.ID)).filter(Boolean);
      const maxIds = Math.min(objectIds.length, 20); // keep OData filter short to avoid 400
      const limitedIds = objectIds.slice(0, maxIds);
      const idClauses = limitedIds.map(id => `(BlueDolphinObjectItemId eq '${id}' or RelatedBlueDolphinObjectItemId eq '${id}')`);
      const idFilter = idClauses.length > 0 ? `(${idClauses.join(' or ')})` : '';

      const baseRelFilter = buildRelationsFilter();
      const combinedRelFilter = [baseRelFilter, idFilter].filter(Boolean).join(' and ');

      const relationsBody = {
        action: 'get-objects-enhanced',
        config,
        data: { endpoint: '/Relations', filter: combinedRelFilter, top: filters.resultsTop, moreColumns: true }
      };

      let relationsJson = await fetchWithCache(`rel|${relationsBody.data.filter}|${filters.resultsTop}`, relationsBody);
      if (!objectsJson.success) throw new Error(objectsJson.error || 'Failed objects load');
      if (!relationsJson.success) {
        // Fallback: try base relations filter without ID clause (some servers reject long OR chains)
        const fallbackRelBody = {
          action: 'get-objects-enhanced',
          config,
          data: { endpoint: '/Relations', filter: baseRelFilter, top: filters.resultsTop, moreColumns: true }
        };
        relationsJson = await fetchWithCache(`rel|${fallbackRelBody.data.filter}|${filters.resultsTop}`, fallbackRelBody);
        if (!relationsJson.success) throw new Error(relationsJson.error || 'Failed relations load');
      }
      const relations = (relationsJson.data as BlueDolphinRelation[] | undefined) || [];
      dataSnapshotRef.current = { objects, relations };

      const nodeList = transformObjectsToNodes(objects);
      const linkList = transformRelationsToLinks(relations);
      // Resolve endpoints; if resolution yields zero (IDs mismatch), fall back to string IDs (library resolves lazily)
      const resolved = resolveLinkEndpoints(nodeList, linkList);
      const linksForGraph = resolved.length > 0 ? resolved : linkList;
      setNodes(nodeList);
      setLinks(linksForGraph);
      // Debug logs
      console.log(`[BD Viz] objects=${objects.length}, relations=${relations.length}, nodes=${nodeList.length}, links=${linksForGraph.length}`);
      if (nodeList[0]) console.log('[BD Viz] sample node', nodeList[0]);
      if (linksForGraph[0]) console.log('[BD Viz] sample link', linksForGraph[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      console.error('[BD Viz] load error', e);
    } finally {
      setLoading(false);
    }
  }, [config, filters.resultsTop, buildObjectsFilter, buildRelationsFilter, fetchWithCache]);

  const available = useMemo(() => {
    const snap = dataSnapshotRef.current;
    if (!snap) return { workspaces: [], relationTypes: [], relationNames: [], sourceDefinitions: [], targetDefinitions: [] };
    const baseWorkspaces = uniqueSorted([
      ...snap.objects.map(o => o.Workspace),
      ...snap.relations.map((r) => String(r.BlueDolphinObjectWorkspaceName || '')),
      ...snap.relations.map((r) => String(r.RelatedBlueDolphinObjectWorkspaceName || ''))
    ]);
    const additionalWorkspaces = ['CSG International','Product Architecture','Customer Q','Simulated Case Study','RR'];
    const workspaces = uniqueSorted([ ...baseWorkspaces, ...additionalWorkspaces ]);
    const relationTypes = uniqueSorted(snap.relations.map((r) => String(r.Type || '')));
    const relationNames = uniqueSorted(snap.relations.map((r) => String(r.Name || '')));
    const sourceDefinitions = uniqueSorted(snap.relations.map((r) => String(r.BlueDolphinObjectDefinitionName || '')));
    const targetDefinitions = uniqueSorted(snap.relations.map((r) => String(r.RelatedBlueDolphinObjectDefinitionName || '')));
    return { workspaces, relationTypes, relationNames, sourceDefinitions, targetDefinitions };
  }, [nodes, links]);

  // Preload options on first hook usage (persist filter lists before user clicks Load)
  // Use a light call to fetch a small objects sample and relations to populate dropdowns.
  // Does not alter the graph until the user clicks Load.
  const [preloaded, setPreloaded] = useState(false);
  useMemo(() => {
    if (preloaded) return;
    setPreloaded(true);
    (async () => {
      try {
        const preloadObjectsBody = {
          action: 'get-objects-enhanced',
          config,
          data: { endpoint: '/Objects', filter: '', top: 25, orderby: 'Title asc', moreColumns: true }
        };
        const preloadRelationsBody = {
          action: 'get-objects-enhanced',
          config,
          data: { endpoint: '/Relations', filter: '', top: 25, moreColumns: true }
        };
        const [po, pr] = await Promise.all([
          fetchWithCache('pre-obj|', preloadObjectsBody),
          fetchWithCache('pre-rel|', preloadRelationsBody)
        ]);
        if (po?.success || pr?.success) {
          const objs = (po?.data || []) as BlueDolphinObjectEnhanced[];
          const rels = (pr?.data || []) as BlueDolphinRelation[];
          const existing = dataSnapshotRef.current;
          dataSnapshotRef.current = { objects: existing ? (existing.objects.length ? existing.objects : objs) : objs, relations: existing ? (existing.relations.length ? existing.relations : rels) : rels };
        }
      } catch {}
    })();
  }, [preloaded, config, fetchWithCache]);

  return { nodes, links, loading, error, filters, setFilters, loadData, available };
}


