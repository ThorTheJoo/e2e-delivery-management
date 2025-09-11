### Blue Dolphin Visualization — Accessibility, Performance, and Debugging

#### Accessibility (WCAG AA targets)

- Keyboard navigation:
  - Tab-order through controls in `graph-controls` and focusable graph overlay buttons.
  - Provide keyboard shortcuts for zoom in/out/reset and focus selected node.
- Screen reader support:
  - Announce selection changes in `object-details-panel` via `aria-live="polite"`.
  - Provide textual summaries (counts, current filters) in DOM, not just canvas.
- High contrast & readability:
  - Tailwind themes with high-contrast palette.
  - Always-visible labels on nodes/links with opaque white backgrounds and dark text.
- Focus management:
  - On node/link selection, move focus to the sidebar heading; Esc returns focus to graph controls.

#### Performance

- Dataset targets: 1k nodes / 2k links at 60fps.
- Rendering:
  - Precompute node/link visual attributes (size, color, shape, style) during transform.
  - Keep `nodeCanvasObject`/`linkCanvasObject` pure and fast; avoid allocations per frame.
  - Avoid `linkDirectionalParticles` for large graphs.
- Physics:
  - `cooldownTicks=100`; reduce alpha/velocity decay for stability.
  - Provide "stabilize" button to freeze simulation sooner if needed.
- Updates:
  - Batch updates; memoize painters and handlers with stable deps.
  - Use `useRef` to hold immutable snapshots for current render to avoid effect loops.

#### Debugging

- Transform logs:
  - Counts and first sample of nodes/links.
  - Number of dropped/invalid links; unresolved endpoints.
- Render logs:
  - Log first N node/link paint calls (guarded flag), then silence.
- Telemetry (non-PII):
  - Load durations, transform durations, render stabilization time.
- Error handling:
  - Catch and surface upstream OData errors distinctly from network issues.
  - Provide user-facing retry with copied filter snippets.
