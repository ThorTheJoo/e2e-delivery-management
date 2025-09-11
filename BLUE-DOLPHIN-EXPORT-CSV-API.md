### Blue Dolphin Export CSV API Specification

#### Endpoint

- Route: `/api/blue-dolphin/export/csv`
- Method: POST
- Response: `text/csv; charset=utf-8` (streamed)

#### Purpose

Produce a single CSV by joining Relations_table rows with the full Object records (including MoreColumns=true enhanced fields) for both endpoints, scoped by Workspace and optional filters.

#### Auth and Protocols

- Objects requests: OData v4 headers; support `MoreColumns=true` (no `$select` when enabled).
- Relations requests: OData v2 headers; support `MoreColumns=true` and `$filter`.
- Auth: API key (Bearer) or Basic, per environment settings.

#### Request body (JSON)

```json
{
  "workspace": "CSG International",
  "objectFilters": {
    "definitions": ["Business Process"],
    "status": ["Active"],
    "titleContains": "checkout",
    "onlyPopulatedEnhanced": false
  },
  "relationFilters": {
    "type": ["composition", "flow"],
    "relationshipDefinitionNames": ["Composition"],
    "names": ["composed of", "flow to"],
    "sourceDefinitions": ["Application Component"],
    "targetDefinitions": ["Capability"]
  },
  "workspaceScope": "both",
  "seedObjectIds": ["602a773bad3fc03ba4564bc0"],
  "traversalDepth": 1,
  "pageSize": 500
}
```

Field notes:

- `workspace` (required): applied to both datasets.
- `workspaceScope`: `both` (strict) or `either` (inclusive) for Relations.
- `seedObjectIds`/`traversalDepth`: constrain to a subgraph around seeds.
- `pageSize`: used for `$top/$skip` paging for both datasets.

#### Processing model

1. Validate input; require `workspace`.
2. Fetch Objects:
   - Build query: `/Objects?$filter=Workspace eq '<WS>'&MoreColumns=true&$top=<N>&$skip=<K>`
   - Headers: OData 4.0; do not add `$select` when MoreColumns=true.
   - Accumulate into map: `objectById[ID] = object`.
3. Fetch Relations:
   - Build workspace filter:
     - both: `BlueDolphinObjectWorkspaceName eq '<WS>' and RelatedBlueDolphinObjectWorkspaceName eq '<WS>'`
     - either: `BlueDolphinObjectWorkspaceName eq '<WS>' or RelatedBlueDolphinObjectWorkspaceName eq '<WS>'`
   - Append optional filters (`Type`, `Name`, `RelationshipDefinitionName`, source/target definitions).
   - Query: `/Relations?$filter=<expr>&MoreColumns=true&$top=<N>&$skip=<K>` with OData 2.0 headers.
4. Deduplicate directional pairs by `RelationshipId` when `deduplicate=true` (default on).
5. Ensure all endpoint objects are present in `objectById`; if missing and policy allows, fetch individually with MoreColumns.
6. If seeds provided, filter relations to those touching seeds; BFS expand up to `traversalDepth`.
7. Stream CSV rows: for each relation, emit `rel_*`, `source_*` (object A), `target_*` (object B). See Data Dictionary for columns.

#### CSV format

- Delimiter: comma
- Newlines: `\r\n`
- Encoding: UTF-8 with BOM
- Quoting: RFC 4180; always quote fields containing commas, quotes, or CR/LF
- Header row: included; order defined in Data Dictionary

#### Error handling

- 400: missing `workspace` or invalid params
- 502: upstream OData error (include `code`/`message` snippet)
- 504: export exceeded time/size thresholds (return partial? no — fail with guidance)
- Response body (JSON on error): `{ error: { code, message, context } }`

#### Telemetry (non-PII)

- Log: workspace, counts, filters summary, durations, success/failure

#### Security

- Do not log credentials
- Redact auth in any surfaced query examples
- Validate filter strings to prevent injection into OData queries

#### Example OData queries (constructed)

```text
Objects (v4):
/Objects?$filter=Workspace eq 'CSG International'&MoreColumns=true&$top=500

Relations (v2, both endpoints in workspace, composition only):
/Relations?$filter=(BlueDolphinObjectWorkspaceName eq 'CSG International' and RelatedBlueDolphinObjectWorkspaceName eq 'CSG International') and Type eq 'composition'&MoreColumns=true&$top=500
```

#### References

- UI flow and controls: `BLUE-DOLPHIN-EXPORT-CSV-UI.md`
- Column schema: `BLUE-DOLPHIN-EXPORT-CSV-DATA-DICTIONARY.md`
- OData and MoreColumns behavior: `BLUE-DOLPHIN-ODATA-GUIDE.md`, `BLUE-DOLPHIN-CLI-TESTING-SUMMARY.md`
