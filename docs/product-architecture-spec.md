# E2E Delivery Management — Product & Architecture Specification

Version: 1.27.1  
Repository: GitHub (Next.js 14, TypeScript, Tailwind, shadcn/Radix)  
Date: 2025-09-13  
Audience: Business Executives, Product Leaders, Solution/Integration Architects, Engineering Leads

## 1. Executive Summary

E2E Delivery Management is a TMF-aligned scoping, architecture, and delivery orchestration platform that converts raw requirements into a fully mapped solution model, visualizes dependencies, and operationalizes delivery via Azure DevOps (ADO). It integrates:
- SpecSync ingestion/export for structured requirements
- TMF ODA domain/function mapping to create a normalized solution design
- Blue Dolphin architecture traversal to extract relationships across functions, services, processes, and interfaces
- Miro visual mapping for collaborative architecture and requirements visualization
- ADO export to generate Epics/Features/User Stories/Tasks for delivery
- Supabase-backed storage and configuration for persistence and operational analytics

Business value:
- Shortens scoping cycles and improves estimation fidelity
- Creates a single traceable thread from requirements to architecture to delivery
- Reduces rework via exact mapping to TMF and verified relationship traversal in Blue Dolphin
- Increases transparency with auto-generated delivery structures, visual maps, and standardized exports

Outcomes:
- Faster pre-sales solutioning; repeatable proposals and schedules
- Consistent architecture patterns and guardrails
- Automated backlog creation and export to customer delivery tools (ADO)
- Evidenced BOM, sizing inputs, and cost model primitives

---

## 2. Solution Overview

The solution turns requirement inputs into an executable delivery plan:

1) Requirements Ingestion (SpecSync)
- Inputs: Requirement items with fields: requirementId, rephrasedRequirementId, functionName, domain, capability, usecase1, priority, status, metadata.
- Processing: Validation and normalization; optional Supabase export for persistence.
- Output: Canonical SpecSync item list consumed downstream.

2) Solution Modeling (TMF Mapping)
- Maps each SpecSync item to TMF domains and functions using strict exact matching rules.
- Produces a curated set of selected domains/capabilities, plus counts of linked requirements.
- Identifies gaps (missing TMF functions) and supports assisted completion.

3) Architecture Traversal (Blue Dolphin)
- Given a mapped function, performs bounded-depth relationship traversal to discover Business Processes, Application Services, Application Interfaces, and related Application Functions.
- Extracts full payloads for enriched fields and organizes results into hierarchy levels.

4) Visualization (Miro)
- Generates boards, frames per domain, and cards/shapes for functions/use cases.
- Enables stakeholder-friendly, collaborative architecture and requirements views.

5) Estimation, Scheduling, BOM, Commercial Model
- Converts mappings to a delivery structure (Epics/Features/User Stories/Tasks).
- Applies simple, transparent estimation primitives and effort calculations.
- Produces inputs for resource projections, iteration planning, and cost modeling.

6) Delivery Orchestration (Azure DevOps)
- Authenticates with PAT, validates available work item types, and exports work items via ADO REST APIs.
- Ensures required fields, safe defaults for AreaPath/IterationPath, and graceful error handling.

---

## 3. End-to-End User Journey

1) Requirements to SpecSync
- Business Analysts/Pre-sales load requirements (SpecSync) into the app UI.
- App normalizes fields and presents a structured preview.

2) SpecSync to Solution Model (TMF)
- Users open the TMF Domain/Capability Manager.
- App loads static TMF reference data and strictly exact-matches SpecSync domain/function names.
- The system auto-selects matching domains/functions; requirement counts propagate into domains/capabilities.
- Gaps are identified; users can add missing domains/functions aligned to TMF reference.

3) Solution Model to Visualization (Miro)
- Users authenticate to Miro.
- The app creates a “TMF Architecture” or “SpecSync Requirements Mapping” board.
- For each domain, a frame is created; within frames, capability/use case cards and shapes are placed (positioning within Miro constraints).

4) Architecture Traversal (Blue Dolphin)
- Users provide Blue Dolphin configuration and workspace filter.
- For selected TMF functions, the system traverses BD relationships (bounded by depth and filters), assembling Business Processes, Application Services, Application Interfaces, and related functions.
- The app extracts full payloads for enriched data and prepares hierarchy levels for analysis and export.

5) Estimation, BOM, Scheduling, Export
- The app assembles Epics/Features/User Stories/Tasks from project/domain/capability/requirement structures.
- Estimation primitives and effort/story points are applied.
- Users export to ADO; the app validates work item types, creates JSON-patch operations, and handles errors.
- Optional SpecSync export to Supabase persists the catalog for analytics.

---

## 4. Architecture

- Frontend: Next.js 14 (App Router), React 18, TypeScript
- UI: TailwindCSS 3, shadcn UI, Radix primitives, lucide-react icons, Framer Motion
- Data & Persistence: Supabase (client-side config + server role export), localStorage for secure test credentials (dev/prototyping only)
- Integrations:
  - SpecSync: Local processing + Supabase upsert API
  - TMF: Static reference loading and mapping utilities
  - Blue Dolphin: API route proxy and traversal/lookup services
  - Miro: OAuth and board/shape/card creation
  - ADO: PAT-based API calls for project validation and work item creation
- Observability: Console logs in dev; structured notifications in UI; defensive error handling

Key architectural patterns:
- Prefer Server Components for data endpoints; isolate client components for interactive flows
- Functional composition, early-returns, clear error and boundary handling
- Strict domain/function exact-matching to eliminate drift
- Caching and bounded traversal for Blue Dolphin to maintain performance
- UX-first interactive mapping with reliable fallback defaults

---

## 5. Technology Stack, Libraries, Guardrails

Core:
- next@^14.2, react@^18.2, typescript@^5.3
- tailwindcss@^3.3, tailwind-merge, tailwindcss-animate
- shadcn components + @radix-ui/react-* primitives
- @supabase/supabase-js@^2.56
- @mirohq/miro-api@^2.2.4
- CSV/XLSX processing: csv-parser, exceljs, xlsx
- Data viz: recharts, react-force-graph

Validation and contracts:
- zod@^3.22 for runtime validation (types declared in repo; validation selectively applied)
- Exact-matching strategy for TMF and SpecSync mapping to minimize ambiguity

Standards/Guardrails:
- TypeScript strictness; meaningful names; functional components
- Error-first, early-return control flow
- Accessibility: semantic HTML, keyboard operability in interactive elements
- Security: Never ship service role keys to client; use server-side secrets or user-supplied UI config in dev only
- Performance: bounded loops, batched fetches, optimized filters for Blue Dolphin, minimal client state

---

## 6. Data Model and Persistence

Supabase tables (representative):
- tmf_reference_domains, tmf_reference_capabilities
- user_domains, user_capabilities
- specsync_items (composite unique key: project_id + requirement_id)
- blue_dolphin_objects (optional analytics/exports)
- filter_categories, filter_options
- projects

Supabase usage patterns:
- Browser client for anon operations (env or UI-configured)
- Server role client for privileged upserts (API route POST /api/specsync/export)
- LocalStorage-based dev hints for URL/keys (non-production convenience)

Data lifecycle:
- SpecSync items ingested in UI → exported via API as idempotent upserts
- TMF reference loaded statically for consistent mapping
- Blue Dolphin results transiently cached in-memory (service cache with TTL) for performance

---

## 7. Integrations — Functional Descriptions and Logic

### 7.1 SpecSync
- Input: Array of requirement items from UI.
- Processing:
  - Minimal validation; safe coercion (IDs, strings).
  - Transform into relational row shape for Supabase.
- Output:
  - Supabase `specsync_items` upsert with conflict on `(project_id, requirement_id)`.
  - Idempotent; returns success summary and count.

### 7.2 TMF ODA Mapping
- Loads static TMF Domains/Functions on initialization.
- For each SpecSync item: exact match on `domain` and `functionName` to TMF names:
  - Domain is selected if any capability (function) matches.
  - Capability is selected if its name exactly equals `functionName` (case/trim normalized).
- Requirement counts per capability and per domain computed by exact domain+function equality.
- Gap handling:
  - Reports missing TMF functions and allows adding domains/functions (kept explicit, not fuzzy).
- Performance tactics:
  - Defer heavy UI updates via `setTimeout` and `flushSync` when needed.
  - Memoized callbacks to limit re-renders.

### 7.3 Blue Dolphin Traversal
- Config: `BlueDolphinConfig` and `workspaceFilter`.
- Traversal:
  - Depth-bounded recursive traversal (default maxDepth=5).
  - Optimized OData filter targets relationships for the given object ID and workspace.
  - Collect related object IDs and fetch object details (batch or individual).
  - Categorize by Definition: Business Process, Application Service, Application Interface, Related Application Function.
  - Detect hierarchy using composition/realization relations into top/child/grandchild levels.
- Payload extraction:
  - After initial traversal, fetch enriched payloads (e.g., Object_Properties_*, Deliverable_Object_Status_*, Ameff_properties_*) for all discovered IDs.
- Caching:
  - In-memory cache with TTL to reduce repeated queries.
- Optimization:
  - Minimize OData 400s by using individual lookups when batch filters fail.
  - Workspace scoping enforced in all queries.

### 7.4 Miro Visual Mapping
- Auth: OAuth flow; access token stored and checked in a small auth service.
- Board management:
  - Creates/reuses test boards; persists board IDs in localStorage for reuse.
  - Validates name constraints (<= 60 chars, truncation applied).
- Domain frames:
  - Creates a frame per TMF domain with increased spacing and size.
- Capability cards and use case shapes:
  - Cards positioned within frame bounds; sizes respect Miro minimums.
  - Use case shapes added (round_rectangle); actor shapes (circles) for functions.
  - Items without `usecase1` are skipped with trace logs.
- Error handling:
  - Specific error messages for token/401/403/500 conditions; continues best-effort.

### 7.5 Azure DevOps Export
- Authentication:
  - PAT via Basic auth header; validates project access by listing projects.
- Work item type validation:
  - Checks availability of types (`epic`, `feature`, `User Story`, `task`); suggests alternatives if missing.
- Mapping generation:
  - Epic from Project; Feature from Domain; User Story from Capability; Task from SpecSync item.
  - Adds safe defaults for AreaPath and IterationPath.
  - Uses JSON-Patch array for fields; limits to standard fields to avoid custom field errors.
- Error handling:
  - Aggregates export status; continues on failures; reports per-item results.
- Estimation fields:
  - Applies story points and remaining work using straightforward mappings; extendable with complexity attributes from UI selections.

---

## 8. Performance & Optimization

- TMF mapping uses exact matches and avoids fuzzy scans to keep computations linear.
- Blue Dolphin queries:
  - Depth limit and type filters bound result sets.
  - Cache of relation/object results with TTL to avoid redundant API calls.
  - Batch filters where reliable; fall back to individual lookups otherwise.
- Miro object placement:
  - Calculated coordinates ensure no overflow beyond frame bounds; skip logic prevents layout errors.
- Supabase:
  - Upsert with composite onConflict prevents duplicates; export code-path is idempotent.
- UI:
  - Controlled re-renders, memoized callbacks; minimal client state beyond necessary interactivity.

---

## 9. Security & Compliance

- Supabase service role key is only used server-side (API route); never exposed client-side in production.
- Development convenience allows UI-provided URL/keys stored in localStorage; clearly marked non-production.
- ADO PAT handled only in memory/localStorage for prototype flows; enterprise deployments should use a server proxy or secret manager.
- Miro OAuth token preserved in localStorage for prototype flows; rotate and revoke as needed.
- Input validation with zod where applicable; exact matching strategy reduces injection risks.
- Error messages avoid leaking secrets; logs focus on status and safe metadata.

---

## 10. Error Handling, Logging, Observability

- API routes and services wrap calls with try/catch; return structured JSON with `success`, `message`, `details`.
- Explicit logs for:
  - Supabase export counts and errors
  - Miro token detection and HTTP error semantics
  - Blue Dolphin filter strings, result sizes, and object type breakdowns
  - ADO type validation and per-item export statuses
- UI surfaces notifications for configuration/auth errors and missing prerequisites.

---

## 11. Estimation, Resource Projections, Scheduling, Commercial Model

Estimation primitives (implemented and extendable):
- Capability effort baseline (e.g., 5 days per capability, adjustable)
- Task effort by priority mapping (High/Medium/Low)
- Story points derived from counts (simple scaling function)

Resource projections:
- Total effort = sum(capability effort) + adjustments from task complexity
- Team sizing = total effort / (team velocity × timebox)
- Schedule creation:
  - Map Features and User Stories to Iterations
  - Use story points for iteration capacity planning

Commercial model (guidance):
- T-shirt sizing by capability counts and complexity selection
- Rate cards multiplied against role-mix and iteration plan
- Risk buffer % based on configuration completeness and integration complexity

Bill of Materials (BoM) (conceptual):
- Features mapped to TMF domains/functions
- Integration endpoints and volumes (Miro, Supabase, Blue Dolphin, ADO)
- Data artifacts: SpecSync payloads, TMF reference, BD traversals (object counts)
- Delivery package: Epics/Features/Stories/Tasks with estimates

---

## 12. Pre-Sales, Delivery, and Managed Services

Pre-Sales:
- Rapid ingest of requirements (SpecSync)
- Automated TMF mapping and gap analysis
- Visual boards generated in Miro for workshops
- Draft delivery plan and BoM created
- Export preliminary backlog to ADO sandbox

Delivery:
- Harden configurations (Supabase env keys, Miro OAuth app, ADO PAT policies)
- Confirm work item type availability and iteration plan
- Execute ADO export into the customer project
- Track progress via ADO; revise mapping upon scope change

Managed Services:
- Regular refresh of TMF references
- Credential rotation for ADO/Miro/Supabase
- Monitoring export errors; reconciliation for failed items
- Blue Dolphin traversal cache tuning and API quota management
- Periodic knowledge capture into Supabase for analytics

---

## 13. Configuration

Supabase:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server only)
- Dev UI supports localStorage config for quick tests

Miro:
- OAuth client credentials (server); tokens stored client-side for prototype flows
- Board IDs cached in localStorage for reuse

ADO:
- Organization, Project, AreaPath, IterationPath
- PAT stored in localStorage for prototype; enterprise deployments should use vault/secret manager + server proxy

Blue Dolphin:
- API base, auth, and `workspaceFilter` configured in UI
- Optimize OData filters and depth thresholds per workspace

---

## 14. Coding Design Principles & Standards

- Functional programming; descriptive names; `handle*` event handlers
- Tailwind utility-first styling; shadcn & Radix for primitives
- Early returns; error-first control flow
- Strong typing via interfaces; avoid enums in favor of maps
- Minimal client state; prefer RSC where feasible
- Accessibility for interactive elements

---

## 15. Repository, Branching, and Workflow

Repository:
- Structure under `src/` with `app/`, `components/`, `lib/`, `hooks/`, `types/`.
- Scripts: build-info, lint, type-check, format with Prettier (Tailwind plugin).

Branching (recommended):
- `main`: protected; release-ready
- `feature/*`: scoped to integrations or UI modules
- `fix/*`: hotfixes
- PR policy: lint/type-check required; small focused edits; Conventional Commit style

Release:
- Semantic versioning; CHANGELOG maintained; tag integration milestones

---

## 16. API Endpoints (Representative)

- POST `/api/specsync/export`: Upserts SpecSync items to Supabase (`specsync_items`) using service role client or UI-provided dev credentials. Idempotent via `(project_id, requirement_id)` conflict.
- POST `/api/miro/boards`: Action-based API for board operations (createBoard, getBoard, createFrame, createCard, createShape). Auth via Bearer token.
- POST `/api/blue-dolphin`: Proxy to Blue Dolphin API; `get-objects-enhanced` with OData filters and `moreColumns: true`.
- GET `/api/debug/env`: Diagnostics for environment visibility in dev.

---

## 17. Assumptions & Constraints

- TMF mapping requires aligned names (domain/function); strict equals used.
- Dev tokens/keys in localStorage are for prototyping only.
- ADO work item types must exist; alternatives are suggested but not auto-created.
- Blue Dolphin OData filters may need tuning by workspace/security.

---

## 18. Future Enhancements

- Formalize zod validation across endpoints and inputs
- Server-only token brokers; remove client-side secrets in prod
- Background jobs for large traversals and caching analytics
- SSO/OIDC and RBAC for configuration scopes
- Metrics/tracing (OpenTelemetry), error reporting (Sentry)

---

## 19. Glossary

- TMF ODA: Telecom Management Forum Open Digital Architecture
- SpecSync: Structured requirement ingestion/export mechanism
- Blue Dolphin: Architecture repository for relationship queries
- Miro: Collaborative whiteboard for visualization
- ADO: Azure DevOps for backlog/work item management

---

## 20. Appendix — Key Implementation Details

- SpecSync export: composite conflict keys, idempotent upsert; server client fallback with clear error messaging.
- TMF Manager: requirement counts by exact domain+function; gap-addition flows.
- Blue Dolphin: depth=5; composition/realization-based hierarchy; full payload enrichment.
- Miro: board name <= 60 chars; frames 1100x700; safe placement and skip strategies.
- ADO: JSON-patch; required fields only; defaults for AreaPath/IterationPath; type validation pre-export.


