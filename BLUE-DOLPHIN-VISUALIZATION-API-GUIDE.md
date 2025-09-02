### Blue Dolphin Visualization — API Integration & Caching

#### Contract
- Use existing route: `/api/blue-dolphin` (server action/route already used by `blue-dolphin-integration.tsx`).
- Always send `action: 'get-objects-enhanced'`.
- Objects (v4 semantics) and Relations (v2 semantics) both support `MoreColumns=true`.

#### Request body template
```json
{
  "action": "get-objects-enhanced",
  "config": { /* BlueDolphinConfig: protocol, odataUrl, auth */ },
  "data": {
    "endpoint": "/Objects" | "/Relations",
    "filter": "",
    "top": 500,
    "orderby": "Title asc",
    "moreColumns": true
  }
}
```

#### Filters
- Workspace (objects): `Workspace eq '<WS>'`.
- Workspace (relations):
  - both: `(BlueDolphinObjectWorkspaceName eq '<WS>' and RelatedBlueDolphinObjectWorkspaceName eq '<WS>')`
  - either: `(BlueDolphinObjectWorkspaceName eq '<WS>' or RelatedBlueDolphinObjectWorkspaceName eq '<WS>')`
- Relation qualifiers: `Type`, `Name`, `RelationshipDefinitionName`; source/target definitions.

#### Caching strategy (client-side hook)
- Key: `endpoint|filter|top`.
- Store JSON payloads in a `Map` with 5-minute TTL.
- Preload: on first render, fetch small samples of `/Objects` and `/Relations` to populate dropdown options before user clicks Load.
- Invalidate on workspace or view mode change when filter differs.

#### Pagination
- Prefer `top` bounds (e.g., 500–1,000) for preview.
- For exports or very large graphs, support multiple calls with `$skip` (if supported) otherwise chunked fetching where viable.

#### Error handling
- Surface readable message and include constructed query parts for debugging (redact auth).
- Distinguish upstream OData error vs network.
- Fallback for relations: if long OR-chain of object IDs triggers 400, retry with base relations filter without ID clause.

#### Example composed queries (debug-only, redacted)
```text
/Objects?$filter=Workspace eq 'CSG International'&MoreColumns=true&$top=500&$orderby=Title asc
/Relations?$filter=(BlueDolphinObjectWorkspaceName eq 'CSG International' or RelatedBlueDolphinObjectWorkspaceName eq 'CSG International') and Type eq 'flow'&MoreColumns=true&$top=500
```

#### Security notes
- Do not log secrets; keep auth in `config` only.
- Validate/escape user-entered filter fragments to avoid OData injection.

#### Integration checklist
- Reuse `BlueDolphinConfig` from types.
- Single fetch helper for both datasets, parameterized by `endpoint` and `filter`.
- Telemetry: counts, durations, filter summary, success/failure.


