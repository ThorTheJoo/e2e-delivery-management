### Blue Dolphin Visualization — Architecture & Component Specs

#### Goals
- Rebuild an interactive graph for Blue Dolphin objects/relations in Next.js 14 (App Router) using TypeScript, Tailwind, Shadcn UI, and `react-force-graph-2d`.

#### Core files (to be created)
- `src/components/blue-dolphin-visualization.tsx` — container: layout, controls, graph, sidebar; client-only shell.
- `src/components/blue-dolphin-graph.tsx` — ForceGraph2D renderer (dynamic import with `ssr: false`).
- `src/components/graph-controls.tsx` — workspace filters, view modes, search.
- `src/components/object-details-panel.tsx` — Shadcn panel/drawer with node/link details.
- `src/hooks/use-blue-dolphin-visualization.ts` — data load/transform/state; cache and filters.
- `src/lib/blue-dolphin-visualization-utils.ts` — transformer utilities and helpers.
- `src/types/blue-dolphin-visualization.ts` — interfaces for raw and visual models.

#### Data flow
1) Controls emit filter/view state → Hook triggers data load via existing OData route using `action: get-objects-enhanced`.
2) Hook transforms raw objects/relations into `VisualNode[]` and `VisualLink[]` and resolves link endpoints to node objects.
3) Graph consumes memoized datasets; user interactions update selection state in hook, surfaced to `object-details-panel`.

#### State model (high-level)
- `workspaces`: string[] (dynamic, with predefined list merged)
- `activeWorkspace`: string | ''
- `viewMode`: 'overview' | 'detailed' | 'deep-dive'
- `nodes`: BlueDolphinVisualNode[]
- `links`: BlueDolphinVisualLink[]
- `selectedNodeId`: string | null
- `selectedLinkId`: string | null
- `loading`: { objects: boolean; relations: boolean }
- `error`: string | null

#### Graph rendering responsibilities
- Dynamic import `ForceGraph2D` with `{ ssr: false }`.
- Configure physics: `cooldownTicks=100`, sensible `d3AlphaDecay`, `d3VelocityDecay`.
- Custom painters:
  - `nodeCanvasObject`: draw shape by `node.shape` (circle/rectangle/diamond/hexagon), white border, fill by `workspace` color, always-visible label with white background.
  - `nodePointerAreaPaint`: accurate hit area per shape.
  - `linkCanvasObject`: dashed/dotted/solid line, backgrounded label (relationship text), width/color by type.
- Arrows: `linkDirectionalArrowLength`, `linkDirectionalArrowRelPos`, color by type; emulate double heads if required.

#### Filtering & progressive disclosure
- Workspace filter limits objects and relations upstream at fetch time and downstream within transform.
- View modes:
  - Overview: reduced sizes, muted colors, labels still visible but smaller.
  - Detailed: increased label font, thicker edges.
  - Deep-dive: upon selection, emphasize neighborhood (de-emphasize non-neighbors via opacity).

#### Integration with existing Blue Dolphin API route
- Always POST to `/api/blue-dolphin` with body `{ action: 'get-objects-enhanced', data: { endpoint: '/Objects' | '/Relations', filter, top, orderby?, moreColumns: true } }`.
- Cache responses in hook for 5 minutes (keyed by endpoint+filter+top).
- Reuse auth/config from `BlueDolphinConfig`.

#### Error handling & logging
- Centralize try/catch in hook; surface `error` to container.
- Console logs for: request params; counts of objects/relations; transform summary; sample node/link.
- Non-PII telemetry hooks (future): timings, dataset sizes.

#### Extensibility
- Transformer maps (definition→shape, type→style, workspace→color) are configurable and extendable.
- Support multiple views (network, hierarchical) behind a view switch in `graph-controls`.

#### Acceptance checkpoints
- Client-only render works via dynamic import without SSR errors.
- Validated link endpoint resolution (no orphan links rendered).
- Smooth interaction on 1k nodes / 2k links dataset.


