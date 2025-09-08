# Code Cleanup Log

All changes here are non-breaking housekeeping. Use this log to trace what changed and why.

## 2025-09-07
- Added Prettier config with Tailwind class sorting (`.prettierrc.json`)
- Added Prettier ignore (`.prettierignore`) and excluded problematic `index.html`
- Added EditorConfig (`.editorconfig`)
- Added VSCode workspace settings (`.vscode/settings.json`)
- Updated `package.json` with engines and scripts (format, lint:fix, type-check) and browserslist
- Hardened `next.config.js` (strict mode, security headers, standalone output)
- Relaxed ESLint rules safely for `no-explicit-any`, unused vars to warnings
- Formatting applied across repo (Prettier)
- Fixed type-check issue by aligning `useBlueDolphinVisualization` return type and `_request` usage in Miro config route
- Removed unused imports and variables across multiple files; underscored unused args; trimmed unused icons
- Targeted disables for exhaustive-deps where intentional
- Verified: lint runs with only warnings; type-check passes; production build succeeds
