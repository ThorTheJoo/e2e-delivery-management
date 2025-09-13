## Confluence Integration (Research + Test Harness)

This doc captures the integration flow for Confluence Cloud/Data Center REST APIs and preserves change history per our markdown-first workflow.

### Summary (What we proved)
- Authentication with a Personal Access Token (PAT) works against `https://confluence.csgicorp.com` using Bearer auth.
- API base path that responded: `/rest/api` (Data Center style). The HTML shell response confirms platform reachability and logged-in user context.
- Fetching page content by ID works. Page `1388483969` returns `body.storage` content with title `"1.3.6 - Customer Information Management"`.
- A non-existent page (ID `0`) returns a JSON 404 with proper structure, so error handling paths are predictable.

### Auth Options
- Basic (Cloud API token): `Authorization: Basic base64(email:api_token)`
- Bearer (Personal Access Token): `Authorization: Bearer <token>`

We will try Bearer first (since a PAT was provided), and fall back to Basic if needed.

### Endpoints
- Get page content (v1): `/<context>/rest/api/content/{id}?expand=body.storage|body.view`
  - On this tenant, context resolved as `/rest/api` (no `/wiki` prefix)
- Health/version (v1): `/<context>/rest/api` (on this tenant: `/rest/api`)

References:
- Confluence REST v1 content endpoints: `https://developer.atlassian.com/cloud/confluence/rest/v1/api-group-content/#api-group-content`
- Confluence REST v2 overview: `https://developer.atlassian.com/cloud/confluence/rest/v2/intro/#about`
- KB (content/children): `https://support.atlassian.com/confluence/kb/how-to-get-page-content-or-child-list-via-rest-api/`

### Env Vars
- `CONFLUENCE_BASE_URL` (e.g., `https://confluence.csgicorp.com`)
- `CONFLUENCE_PAT` (if using Bearer PAT)
- `ATLASSIAN_EMAIL` and `ATLASSIAN_API_TOKEN` (for Basic alternative)

### Test Plan
1. Probe API root to validate auth.
2. If success, request a specific page by ID and return `body.storage.value`.

### Notes
- For Cloud, v1 content body endpoints remain the simplest for storage/view retrieval.
- Handle 401/403/404 and 429 (rate limit) with backoff.

---

## Detailed Findings

### 1) Tenant context and platform
- Base URL: `https://confluence.csgicorp.com`
- Confluence reported version (from HTML shell): `9.2.5` (Data Center/Server style)
- Effective REST context used by working requests: `/rest/api`
  - Many Cloud examples use `/wiki/rest/api`, but this DC instance responds under `/rest/api`.

### 2) Authentication behavior
- Provided PAT (set as `Authorization: Bearer <token>`) was accepted.
- Probing `/rest/api` returned the Confluence HTML shell populated with user context (e.g., `ajs-remote-user: thagra01`). This confirms:
  - Network reachability
  - Auth token recognized
  - Session context available

### 3) Fetching page content by ID
- Endpoint used: `GET https://confluence.csgicorp.com/rest/api/content/{id}?expand=body.storage`
- With page ID `1388483969`:
  - Result: 200, JSON with `title` and `body.storage.value` (Confluence Storage XHTML)
  - Sample title: `1.3.6 - Customer Information Management`
  - Storage content contained macros (e.g., `ac:structured-macro`, `ri:page`), as expected for Storage format.

### 4) Negative test (non-existent page)
- Endpoint: `GET https://confluence.csgicorp.com/rest/api/content/0?expand=body.storage`
- Result: 404 with structured JSON:
  - `{"statusCode":404, "message":"No content found with id: ContentId{id=0}", ...}`
- Confirms predictable error handling paths.

### 5) body.storage vs body.view
- `body.storage` returns Confluence Storage (XHTML). Good for structured processing/migrations.
- `body.view` returns sanitized HTML as rendered. Good for direct display.

### 6) Rate limits and errors
- If 429 is encountered, respect `Retry-After` header.
- 401/403 indicate invalid/insufficient auth; verify token and page permissions.
- 404 indicates page not found or no access.

---

## Proven Integration Flow (Reproducible)

Prereqs (PowerShell session):
```
$env:CONFLUENCE_BASE_URL = "https://confluence.csgicorp.com"
$env:CONFLUENCE_PAT      = "<your PAT>"
```

Auth Probe (prints resolved context and confirms auth):
```
node scripts/confluence-integration.js --probe
```

Expected result (abbrev):
```
{
  ok: true,
  resolved: {
    apiBase: "/rest/api",
    auth: "bearer",
    info: "<!DOCTYPE html>..."
  }
}
```

Fetch Page Storage by ID:
```
node scripts/confluence-integration.js --get 1388483969 --format storage
```

Expected result (abbrev):
```
{
  ok: true,
  page: {
    id: "1388483969",
    title: "1.3.6 - Customer Information Management",
    format: "storage",
    snippet: "<ac:layout>..."
  }
}
```

Negative test (ID `0`):
```
node scripts/confluence-integration.js --get 0 --format storage
```
Expected result (abbrev):
```
{
  ok: false,
  error: "Failed to get page 0. Status 404. Body: {\"statusCode\":404,...}"
}
```

---

## Integration Design Notes (for future build)

- Use server-side calls to keep secrets safe (Next.js Route Handler or server action).
- Config via env: `CONFLUENCE_BASE_URL`, `CONFLUENCE_PAT` (or Basic with email+token).
- Support both `body.storage` and `body.view` based on use case.
- Add robust error handling and logging; return meaningful messages upstream.
- Optional endpoints:
  - Children listing: `GET /rest/api/content/{id}/child/page?limit=50`
  - Pagination handling if enumerating content trees.

Security considerations:
- Do not expose PAT to the client; store in server-side env.
- Validate page ID input; limit scope to allowed spaces if needed.

References:
- v1 Content: `https://developer.atlassian.com/cloud/confluence/rest/v1/api-group-content/#api-group-content`
- v2 Intro/Pagination: `https://developer.atlassian.com/cloud/confluence/rest/v2/intro/#about`
- KB: `https://support.atlassian.com/confluence/kb/how-to-get-page-content-or-child-list-via-rest-api/`


