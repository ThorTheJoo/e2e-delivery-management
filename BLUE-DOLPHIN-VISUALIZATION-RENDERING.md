### Blue Dolphin Visualization — ForceGraph2D Rendering Guide

#### Component: `src/components/blue-dolphin-graph.tsx`
- Client-only with dynamic import: `next/dynamic` `{ ssr: false }`.
- Receives memoized `nodes: BlueDolphinVisualNode[]` and `links: BlueDolphinVisualLink[]`.
- Emits selection events to parent.

#### ForceGraph2D configuration (baseline)
- `nodeId="id"`
- `cooldownTicks={100}` for faster stabilization
- `width/height` responsive to container
- Physics tuning: conservative `d3AlphaDecay`, `d3VelocityDecay` to keep layout stable

#### Node painting (`nodeCanvasObject`)
- Size: `Math.max(15, (node.val ?? 4) * 4)`
- Border: 2–3px white stroke for contrast
- Shapes:
  - circle: `ctx.arc`
  - rectangle: `ctx.rect` centered on node
  - diamond: path rotated 45°
  - hexagon: 6-sided polygon path
- Fill: `node.color` (workspace keyed)
- Label: always visible, backgrounded rectangle for readability
  - Font size scales with zoom (`12 / scale` to `14 / scale`)
  - Background `rgba(255,255,255,0.95)`; text `#0f172a`

#### Pointer hit area (`nodePointerAreaPaint`)
- Mirror the shape path using solid opaque fill so clicks match visual shape.

#### Link painting (`linkCanvasObject`)
- Use built-in `linkColor`/`linkWidth` for strokes; custom painter only draws labels and custom dashed/dotted when endpoints are resolved (guards x/y access).
- Label: draw mid-point label with background; prefer `relationshipName` (fallback `type`).

#### Arrows (directionality)
- Use props: `linkDirectionalArrowLength={8}`, `linkDirectionalArrowRelPos={0.5..0.9}`
- Color: `linkDirectionalArrowColor={() => link.color}`
- Double arrows: set small arrow at both relPos values or represent as two directed links

#### Emphasis & selection
- Selected node/link: increase width/border and brighten color
- De-emphasize others by reducing `opacity`
- Focus/zoom: use component ref to `zoomToFit` or `centerAt(x,y,ms)` on selection

#### Progressive disclosure modes
- Overview: smaller fonts, thinner links, keep labels visible
- Detailed: larger fonts, thicker links
- Deep-dive: fade non-neighborhood elements (opacity 0.15–0.3)

#### Performance checklist
- Precompute paint attributes in transform (color, size, shape, style)
- Avoid heavy per-frame computations in painters
- Keep line dashes moderate; avoid `linkDirectionalParticles` on large graphs
- Batch state updates; memoize callbacks with stable deps

#### Debugging hooks
- Log node/link counts on mount/update
- Sample-render logs from painters (guarded to once per N frames)


