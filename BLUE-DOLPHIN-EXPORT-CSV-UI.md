### Blue Dolphin Export Model UI Specification (CSV)

#### Purpose

- **Goal**: Enable users to export a single CSV that joins Objects (with MoreColumns=true enhanced fields) and Relations_table, scoped by Workspace, with optional object/relationship filters, seed objects, and traversal depth.
- **Scope**: New, isolated section in the Blue Dolphin integration. No impact on existing flows.

#### Navigation

- **Section name**: Export Model
- **Placement**: Under Blue Dolphin integration menu alongside Objects and Relations tools.
- **Routing**: `app/blue-dolphin/export` (markdown-driven; actual route to be added during implementation).

#### UX flow

1. Select Workspace → 2) Configure Object filters → 3) Configure Relation filters → 4) (Optional) Seed objects + traversal depth → 5) Preview counts → 6) Export CSV.

#### Controls

- **Workspace selector (required)**
  - Autocomplete; sources distinct workspaces from Objects/Relations.
  - Applies to both Objects and Relations queries.
  - Validation: must be selected to enable Preview/Export.

- **Object filters (optional)**
  - Definitions (multi-select)
  - Status (multi-select)
  - Title contains (text)
  - Only objects with populated enhanced fields (toggle)

- **Relation filters (optional)**
  - Workspace scope (radio):
    - Both endpoints in workspace (strict)
    - Either endpoint in workspace (inclusive)
  - Type (multi-select): composition, flow, association, realization, access, usedby
  - RelationshipDefinitionName (multi-select): Composition, Flow, Association, Realization, Serving, Access
  - Name (multi-select): composed of/in, flow to/from, serves/served by, associated with, accesses, realized by
  - Source Definition (multi-select) and Target Definition (multi-select)
  - Deduplicate directional pairs (toggle, default: on) — keeps one row per RelationshipId

- **Seed subgraph (optional)**
  - Seed objects (multi-select by Title/ID)
  - Traversal depth (select: 1, 2, 3) — BFS over relations limited to selected workspace scope

- **Preview panel**
  - Objects: matched count (post-filters)
  - Relations: matched count (post-filters, pre-dedup and post-dedup)
  - Export rows: final joined rows estimate (equals post-dedup relations count)
  - Sample headers (first 10 columns) and note on full schema link (Data Dictionary)

- **Export controls**
  - Export CSV button (streams file)
  - Filename suggestion: `blue-dolphin-export-<workspace>-<yyyy-mm-dd>.csv`
  - Progress indicator and cancel

#### States

- Loading states for: workspaces, objects preview, relations preview, export job
- Empty states: no matches for objects/relations; actionable hints (relax filters)
- Error states: authentication, OData errors, network, size/time caps; retry and copy debug info

#### Accessibility

- Keyboard navigation for all form fields
- ARIA labels on inputs and action buttons
- Live region for progress and result messages

#### Data lineage and transparency

- Show composed OData query snippets per dataset (redacted auth):
  - Objects (v4): `/Objects?$filter=Workspace eq '<WS>'&MoreColumns=true&$top=…`
  - Relations (v2): `/Relations?$filter=…&MoreColumns=true&$top=…`
- Display deduplication policy: one row per `RelationshipId` when enabled

#### Validation rules

- Workspace is required
- If seed objects provided, only relations touching the seed set are included; traversal depth >= 1
- If both source/target definition filters are set, apply conjunctively to each endpoint

#### Performance safeguards

- Page size selector (default 500)
- Warning thresholds (e.g., >50k rows) with confirmation before export
- Streaming export; no full in-memory serialization

#### Telemetry (non-PII)

- Workspace name, counts, filter selections, duration, success/failure

#### Cross-links

- API contract: `BLUE-DOLPHIN-EXPORT-CSV-API.md`
- Data dictionary: `BLUE-DOLPHIN-EXPORT-CSV-DATA-DICTIONARY.md`
- OData behavior and MoreColumns caveats: `BLUE-DOLPHIN-ODATA-GUIDE.md`, `BLUE-DOLPHIN-CLI-TESTING-SUMMARY.md`

#### Acceptance criteria

- Must export a single CSV joining Relations rows (deduped, if chosen) with full Object (source/target) data
- Workspace scoping applies consistently to both datasets
- MoreColumns=true used for Objects (no $select)
- Relations fetched with OData v2 headers, supports MoreColumns=true
