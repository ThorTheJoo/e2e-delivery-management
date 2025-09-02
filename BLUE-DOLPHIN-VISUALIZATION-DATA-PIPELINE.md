### Blue Dolphin Visualization — Data Pipeline & Types

#### Objectives
- Define how we load, transform, and validate Blue Dolphin Objects and Relations into a graph-ready dataset.

#### Raw types (reference)
```typescript
interface BlueDolphinObject { 
  ID: string; 
  Title: string; 
  Definition: string; 
  Description?: string; 
  ArchimateType?: string; 
  Status?: string; 
  Workspace?: string; 
  Category?: string; 
  Completeness?: number; 
  [key: string]: unknown; 
}

interface BlueDolphinRelation {
  RelationshipId: string;
  BlueDolphinObjectItemId: string; // source
  RelatedBlueDolphinObjectItemId: string; // target
  RelationshipDefinitionName?: string;
  Type?: string; // e.g., 'composition', 'flow', ...
  Name?: string;
  IsRelationshipDirectionAlternative?: boolean;
  [key: string]: unknown;
}
```

#### Visual types (graph)
```typescript
type VisualShape = 'circle' | 'rectangle' | 'diamond' | 'hexagon';
type VisualLineStyle = 'solid' | 'dashed' | 'dotted';
type VisualArrowStyle = 'none' | 'single' | 'double' | 'filled';

interface BlueDolphinVisualNode {
  id: string;
  title: string;
  definition: string;
  workspace: string;
  size: number; // pixel radius/basis
  color: string;
  shape: VisualShape;
  opacity: number;
  val?: number; // ForceGraph sizing hint
  metadata: Record<string, unknown>;
}

interface BlueDolphinVisualLink {
  id: string;
  source: string | BlueDolphinVisualNode;
  target: string | BlueDolphinVisualNode;
  relationshipName: string;
  type: string;
  color: string;
  width: number;
  style: VisualLineStyle;
  arrowStyle: VisualArrowStyle;
  opacity: number;
  metadata: Record<string, unknown>;
}
```

#### Transformation pipeline
1) Load raw datasets
   - Objects: POST `/api/blue-dolphin` `{ action: 'get-objects-enhanced', data: { endpoint: '/Objects', filter, top, orderby: 'Title asc', moreColumns: true } }`.
   - Relations: POST `/api/blue-dolphin` `{ action: 'get-objects-enhanced', data: { endpoint: '/Relations', filter, top, moreColumns: true } }`.
   - Cache for 5 minutes keyed by (endpoint, filter, top).

2) Normalize and index
   - Build `id → object` map for objects.
   - Build workspace, definition, relation-type frequency maps for later sizing/coloring.

3) Transform objects → nodes
   - Size: `size = Math.max(15, (baseVal(definition) + completenessWeight) * 4)`; set `val` similarly for ForceGraph.
   - Color: palette by workspace (deterministic hashing); guarantee high-contrast against background.
   - Shape: map by `definition`/`ArchimateType` (circle, rectangle, diamond, hexagon).
   - Opacity: 1.0 by default; reduced when de-emphasized by view mode.
   - Metadata: include commonly used fields and enhanced property counts.

4) Transform relations → links
   - Style: map `Type`/`Name` → `{ style, width, color, arrowStyle }`.
   - Width: start at 3; increase slightly for key relationship families.
   - Opacity: 0.9 default; reduce for de-emphasis.
   - `id`: prefer `RelationshipId`; fallback to `${source}-${type}-${target}-${name}`.

5) Resolve endpoints (critical)
```typescript
const resolvedLinks = links
  .map(link => {
    const sourceNode = nodes.find(n => n.id === (link as any).source);
    const targetNode = nodes.find(n => n.id === (link as any).target);
    return sourceNode && targetNode ? { ...link, source: sourceNode, target: targetNode } : null;
  })
  .filter(Boolean) as BlueDolphinVisualLink[];
```

6) Validate and filter
   - Drop any link with missing endpoints.
   - Optionally deduplicate bidirectional duplicates by `RelationshipId`.
   - Enforce workspace scoping: both or either endpoint contained.

7) Compute metadata
   - Cluster detection (optional, for summary UI).
   - Degree/centrality proxies: count of incident links.
   - Sample paths for deep-dive view.

#### Mapping rules (initial defaults)
- Definition→Shape: Application/Technology components: rectangle; Business Process/Function: circle; Decision/Event: diamond; Capability/Outcome: hexagon.
- Workspace→Color: stable hash-to-palette mapping; ensure sufficient contrast.
- Relationship type→Style:
  - composition/aggregation: solid, width 4, arrow single/filled, dark neutral.
  - flow: dashed, width 3, arrow single, accent color.
  - association: dotted, width 3, arrow none, medium neutral.
  - realization/serving/usedby/access: solid, width 3, arrow single, type color.

#### Debug instrumentation
- Log counts: objects, relations, nodes, resolvedLinks; and first sample of each.
- Time each stage (load, transform, resolve) with `console.time`.
- Emit warnings for dropped links or unknown types.

#### Failure modes & mitigations
- Missing endpoint objects: surface count and example IDs; consider on-demand fetch if policy allows.
- Oversized datasets: paginate and sample for preview; prompt before rendering >5k elements.
- Infinite React loops: use `useRef` to hold current datasets; memoize transforms.


