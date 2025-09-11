### Blue Dolphin Visualization — Research Validation (React Force Graph 2D)

#### Purpose

- Validate feasibility of an interactive force-directed graph using `react-force-graph-2d` within Next.js 14 (App Router), TypeScript, Tailwind, and Shadcn UI.

#### Summary of findings

- **Rendering engine (Canvas 2D)**: `ForceGraph2D` supports high-perf drawing for 1k–5k nodes and several thousand links on modern hardware when tuned. Target of 1k nodes / 2k links at 60fps is achievable with pragmatic styling and physics settings.
- **SSR**: Library accesses `window`. Must dynamically import on the client: Next.js `next/dynamic` with `{ ssr: false }`.
- **Custom node rendering**: `nodeCanvasObject(node, ctx, scale)` enables drawing arbitrary shapes (circle, rectangle, diamond, hexagon), borders, and always-visible labels with background rectangles.
- **Custom link rendering**: `linkCanvasObject(link, ctx, scale)` enables dashed/dotted styles (`ctx.setLineDash`), backgrounded link labels, and specialized color/width per relationship type.
- **Arrows/directionality**: Built-in via `linkDirectionalArrowLength`, `linkDirectionalArrowRelPos`, `linkDirectionalArrowColor`. Double-headed arrows can be emulated by drawing twice or rendering symmetric links.
- **Interactivity**: Built-in zoom, pan, and node drag. Click handlers `onNodeClick`, `onLinkClick`. Programmatic focus/zoom available via ref.
- **Hit testing**: `nodePointerAreaPaint` allows precise pointer areas for non-circular shapes (rectangles/diamonds).
- **Data model**: Links accept string IDs; however, resolving `source`/`target` to node objects avoids ambiguity and is recommended for correctness.
- **Accessibility**: Canvas is not inherently accessible; provide parallel DOM controls (filters, list navigation, details panel), keyboard shortcuts, high-contrast theme, and ARIA live regions for announcements.
- **Performance**: Use `cooldownTicks=100`, memoize renderers, keep stroke effects minimal, batch color computations, and avoid heavy per-frame work.

#### Capabilities mapped to requirements

- **Nodes: shapes and workspace colors**: YES — draw via `nodeCanvasObject` with shape-specific canvas paths and color palette keyed by `workspace`.
- **Links: styles by type (solid/dashed/dotted), width, arrows, colors**: YES — combine `linkCanvasObject` for dash patterns and `linkWidth/linkColor` with arrow props.
- **Always-visible labels with backgrounds**: YES — measure text (`ctx.measureText`) and paint rounded rect behind text before `ctx.fillText`.
- **Interactive zoom/pan/drag**: YES — default behavior of `ForceGraph2D`.
- **Click to open details panel**: YES — `onNodeClick`, `onLinkClick` can drive a Shadcn drawer/sidebar.
- **Filtering by workspace**: YES — filter dataset upstream; update graph data via state. Use `useRef` to avoid loops.
- **Progressive disclosure**: YES — switch styles/labels based on zoom or view mode; but maintain always-visible labels per requirement by drawing backgrounds.
- **SSR caveat**: Must use dynamic import; the component is client-only.

#### Key API surfaces (React Force Graph 2D)

- Data props: `graphData={{ nodes, links }}`, `nodeId`, `linkSource`, `linkTarget`.
- Styling hooks: `nodeCanvasObject`, `nodePointerAreaPaint`, `linkCanvasObject`.
- Style props: `nodeRelSize`, `nodeColor`, `linkColor`, `linkWidth`, `cooldownTicks`, `d3AlphaDecay`, `d3VelocityDecay`.
- Directional arrows: `linkDirectionalArrowLength`, `linkDirectionalArrowRelPos`, `linkDirectionalArrowColor`.
- Events: `onNodeClick`, `onLinkClick`, `onEngineStop`, `onZoom`, `onBackgroundClick`.

#### Example: Next.js dynamic import (SSR off)

```typescript
// Pseudocode for client-only render in App Router
import dynamic from 'next/dynamic';
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });
```

#### Example: Always-visible node label with background (Canvas)

```typescript
// Pseudocode only — final implementation will live in `blue-dolphin-graph.tsx`
function paintNode(node, ctx, scale) {
  const size = Math.max(15, (node.val ?? 4) * 4);
  // draw shape (circle/rect/diamond/hexagon) filled with node.color
  // add thick white border for contrast

  // label
  const label = node.title ?? node.id;
  ctx.font = `${12 / scale}px Inter, system-ui`;
  const padding = 2 / scale;
  const textWidth = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillRect(
    node.x - textWidth / 2 - padding,
    node.y - 6 / scale - padding,
    textWidth + 2 * padding,
    12 / scale + 2 * padding,
  );
  ctx.fillStyle = '#0f172a'; // slate-900
  ctx.fillText(label, node.x - textWidth / 2, node.y + 4 / scale);
}
```

#### Example: Link styles (dashed/dotted) and arrows

```typescript
function paintLink(link, ctx, scale) {
  ctx.save();
  if (link.style === 'dashed') ctx.setLineDash([6 / scale, 6 / scale]);
  if (link.style === 'dotted') ctx.setLineDash([2 / scale, 4 / scale]);
  ctx.strokeStyle = link.color;
  ctx.lineWidth = link.width ?? 3;
  ctx.beginPath();
  ctx.moveTo(link.source.x, link.source.y);
  ctx.lineTo(link.target.x, link.target.y);
  ctx.stroke();
  ctx.restore();
  // use ForceGraph arrow props for heads; paint label with background similarly to nodes
}
```

#### Performance notes

- Prefer constant-time per-node paint: precompute `color`, `size`, `shape` in the data transform.
- Avoid per-frame string concatenations; cache fonts, colors, and label widths if needed.
- Consider reducing alpha decay and setting `cooldownTicks=100` for faster stabilization.
- Avoid `linkDirectionalParticles` for large graphs (expensive).

#### Accessibility plan summary

- Provide DOM-based controls (filters, search, focus cycle) and a details panel.
- Announce selection changes via `aria-live` in the sidebar.
- Offer high-contrast theme and large-text option.

#### References

- React Force Graph repo and docs: `https://github.com/vasturiano/react-force-graph`
- 2D Canvas customization examples: node/link canvas object, pointer area paint (see repo examples)
