# PDF Ingestion & Generation Pipeline

This document captures the architecture and logic for generating a Solution Description PDF directly from existing PDFs, SpecSync data, and Blue Dolphin traversal results.

## Overview

- API: `GET /api/pdf-ingest` uses `pdf-parse` to extract text from:
  - `SV Solution Description Generator.pdf`
  - `Encompass 12 Product Description Jan 2025 (1).pdf`
  - `E2E Use Case.pdf`
  - `Freedom Modernization Solution Description v1.0 - Final.pdf`
  - `GB1033_Functional_Framework_v24.5.pdf`

- Matcher: `src/lib/pdf-matcher.ts` performs lightweight fuzzy matching between:
  - SpecSync requirements (`functionName`, `description`, `domain`, `capability`)
  - Blue Dolphin functions/services from mapping/traversal
  - Extracted PDF paragraphs

- PDF Builder: `src/lib/solution-pdf.tsx` uses `@react-pdf/renderer` to produce a PDF including:
  - Standard sections from `EnhancedSolutionDescriptionService`
  - Appendix with top matched PDF snippets for requirements and functions

- UI: `src/components/solution-description-generator.tsx`
  - Adds “Generate PDF (from PDFs)” button
  - Calls `/api/pdf-ingest`, runs matcher, and exposes a `Download PDF` link

## Design Notes

- Non-destructive: Existing markdown generation remains unchanged.
- Fuzzy Matching: Uses `string-similarity` and paragraphization by blank lines. Tunable thresholds later.
- Performance: Basic and synchronous for now; can offload ingestion/matching to API routes if needed.
- Security: Reads PDFs from local workspace only. No external upload.

## Future Enhancements

- Weighting model that prioritizes TMF-aligned keywords (GB1033) and Blue Dolphin object titles.
- Section-aware extraction (headings, tables) using a layout parser.
- Persisted caches for PDF text and match results.


