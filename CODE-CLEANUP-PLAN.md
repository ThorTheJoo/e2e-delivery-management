# Code Cleanup Plan

> Non-breaking housekeeping to improve formatting consistency, lint hygiene, performance, DX, and security posture.

## Objectives

- Standardize formatting (Prettier + EditorConfig)
- Enforce consistent editor behavior (VSCode settings)
- Improve npm scripts for DX (format/lint)
- Harden Next.js config with safe options
- Keep functionality unchanged

## Scope (Phase 1 - Safe)

- Add Prettier config and ignore
- Add EditorConfig
- Add VSCode workspace settings
- Update package.json scripts and engines
- Minor hardening in next.config.js (strict mode, headers, standalone)

## Scope (Phase 2 - Optional, post-approval)

- ESLint + Prettier full integration config
- Dependency audit and selective updates
- Bundle analysis and modularized imports
- CI checks for lint/format/typecheck

## Guardrails

- No functional changes to components/pages
- No API or route changes
- No dependency upgrades without approval

## Tasks

- [x] Add Prettier + Tailwind sorting config
- [x] Add .prettierignore
- [x] Add .editorconfig
- [x] Add .vscode/settings.json
- [ ] Update package.json scripts (format, format:check, lint:fix) and engines
- [ ] Harden next.config.js with safe defaults
- [ ] Document changes in cleanup log
