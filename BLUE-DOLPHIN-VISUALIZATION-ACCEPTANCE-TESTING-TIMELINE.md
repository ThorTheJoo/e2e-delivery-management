### Blue Dolphin Visualization — Acceptance Criteria, Testing Plan, Timeline

#### Acceptance criteria

- Data integration
  - Uses `/api/blue-dolphin` with `action: get-objects-enhanced` for both `/Objects` and `/Relations`.
  - Relations request includes `moreColumns: true` and supports workspace scope (both/either).
  - Cache responses for 5 minutes; identical queries served from cache.
- Data transform
  - All links have resolved `source`/`target` node objects.
  - Orphan links are filtered; counts logged.
  - Visual attributes populated for all nodes/links (size, color, shape, style).
- Rendering & interactions
  - ForceGraph2D renders without SSR errors via dynamic import.
  - Nodes have thick white borders; labels always visible with background.
  - Links reflect style by type; display directional arrows; labels are readable.
  - Zoom/pan/drag work smoothly; selection opens details panel.
- Filtering & modes
  - Workspace filter reduces graph dataset accordingly.
  - Modes (overview, detailed, deep-dive) adjust emphasis while keeping labels.
- Performance & accessibility
  - 1k nodes / 2k links at ~60fps after stabilization on a typical laptop.
  - Keyboard navigation for controls; selection announcements via aria-live.

#### Testing plan

- Unit (TypeScript)
  - Transformer: object→node mapping; relation→link mapping; endpoint resolution; style maps.
  - Utils: workspace color hashing; shape selection; label text calculation sizes.
- Integration (client)
  - Hook: fetch mock, cache hits, error propagation, filter changes.
  - Graph component: selection handlers, painters invoked with expected inputs.
- Manual QA scripts
  - Scenario A: Simulated Case Study workspace; flow/composition links; validate visuals.
  - Scenario B: CSG International; mixed types; deep-dive on a central node.
  - Stress: 1k/2k dataset; observe FPS and stabilization behavior.
- Accessibility checks
  - Keyboard-only navigation; focus management; contrast; screen reader announcements.

#### Timeline (phased)

- Phase 1 — Foundation (2–3 days)
  - Create types, utils, hook skeleton; fetch and cache datasets; basic transform; render minimal graph with labels.
- Phase 2 — Interactions & filters (2–3 days)
  - Add workspace filter, view modes, selection and sidebar; emphasize neighborhood.
- Phase 3 — Polish & extensibility (2–3 days)
  - Link labels and arrows polishing; performance tuning; accessibility; logging/telemetry; prepare for hierarchical view plugin.
