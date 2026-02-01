# Project Cleanup/Refactor Plan

## Goal
Perform an aggressive, full-project cleanup and refactor to reduce duplication, remove unused code, resolve overlaps, and improve clarity across frontend and backend while preserving functionality.

## Scope
Entire repository, with focus on:
- Next.js app code: `src/app`, `src/components`, `src/lib`
- Backend logic and data access: `src/lib`, `prisma`, `prisma.config.ts`
- Supporting scripts: `scraper-python`
- Shared assets/config: `public`, `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`

## Assumptions
- No design system changes unless already established by existing styles.
- No restrictions on refactor aggressiveness.
- Functionality must remain intact; prioritize clarity and maintainability.

---

## Phase 0 — Discovery & Baseline
Objective: Build a map of the codebase and identify hotspots.

Tasks:
- Inventory pages/routes in `src/app` and their data dependencies.
- Map shared UI components and their usage patterns in `src/components`.
- Identify utilities/services in `src/lib` and where they are called.
- Review Prisma schema usage and any database access wrappers.
- Scan `scraper-python` for overlap or duplicated logic with TS/Node.

Deliverables:
- Architecture map (modules -> consumers).
- List of duplicated utilities/components.
- Dead/unused file candidates.

---

## Phase 1 — Structural Cleanup
Objective: Reduce duplication, normalize structure, and clarify ownership of logic.

Tasks:
- Consolidate duplicated utilities into single sources in `src/lib`.
- Normalize component structure in `src/components` (naming, folder layout).
- Remove unused files, exports, and dead branches.
- Reduce over-abstracted wrappers if they add no value.
- Align file responsibilities (UI vs data vs formatting).

Deliverables:
- Clean module boundaries.
- Reduced duplicate code.
- Updated imports after consolidation.

---

## Phase 2 — Frontend Review (frontend-specialist)
Objective: Ensure UI consistency and remove overlapping or unused UI logic.

Tasks:
- Identify repeated UI patterns and extract shared components.
- Remove unused styles, classnames, and variant handling.
- Audit client/server component usage for correctness.
- Ensure data fetching boundaries are consistent per route.

Deliverables:
- Simplified component API surface.
- Reduced UI duplication.
- Stable page rendering behavior.

---

## Phase 3 — Backend/Data Review (backend-specialist)
Objective: Improve data access and backend logic consistency.

Tasks:
- Consolidate data access helpers (Prisma queries, transforms).
- Remove duplicate schema-related logic or unused models.
- Ensure error handling is consistent and minimal.
- Validate data flow between API routes/server actions and DB.

Deliverables:
- Single source of truth for data access.
- Leaner backend logic.
- Reduced query duplication.

---

## Phase 4 — Cross-Cutting Refinements
Objective: Global cleanup after consolidation.

Tasks:
- Remove unused dependencies from `package.json`.
- Ensure consistent naming conventions across modules.
- Refine TypeScript types to reduce redundancy.
- Remove unused exports and index barrels with no value.

Deliverables:
- Cleaner dependency graph.
- Improved type clarity.
- Reduced build surface.

---

## Phase 5 — Validation & Final Audit
Objective: Confirm no regressions and ensure consistency.

Tasks:
- Run type checks and linting.
- Run automated tests if present.
- Manual smoke-test key flows/pages.
- Final unused code sweep.

Deliverables:
- Verified build.
- Final report of removed/changed items.

---

## Risk Management
Key risks and mitigations:
- Hidden dependencies: Use grep-based usage checks before deletion.
- Regression in data flow: Validate critical routes with manual checks.
- Frontend behavior drift: Compare UI behavior before/after refactors.
- Over-consolidation: Avoid merging utilities with subtly different semantics.

---

## Testing & Verification
Recommended checks:
1. `npm run lint`
2. `npm run typecheck` (or `tsc --noEmit` if available)
3. `npm run test` (if configured)
4. `npm run build`
5. Manual checks of core routes and flows

---

## Orchestration Notes
Use `orchestrator.md` to coordinate:
- `code-archaeologist.md`: baseline mapping + dead code scan
- `frontend-specialist.md`: UI cleanup + component normalization
- `backend-specialist.md`: data/backend consolidation + correctness

Outputs should be merged back into a unified refactor sequence to avoid conflicting changes.

---

## Exit Criteria
- Duplicate logic removed or consolidated.
- No unused files/exports remaining.
- Lint/typecheck/build pass.
- Functionality preserved in core flows.
