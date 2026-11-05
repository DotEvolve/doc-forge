# Implementation Tasks: DocForge v0.1.7 Sync & Release

- [ ] **Task 1: Diff and Reconcile Renderers**
  - Compare `floorix-app/src/docForge/sections/TableSection.tsx` with `doc-forge/src/sections/TableSection.tsx`.
  - Apply attribute cell deduplication logic across grouped rows using DataDoc `groupKey` priority chain.
  - Reconcile `FooterSection.tsx` and `reportStyleBridge.ts`.
  - Export `DocumentStudio` and alias `export { DocumentStudio as DocForgeStudio }` in `src/index.ts`.
  - Verify `contrib/jobSlipAdapter.ts` output against reconciled table renderer.
- [ ] **Task 2: Build & Type Validation**
  - Run `npm run lint` (`tsc --noEmit`).
  - Run `npm run build` (`tsup && tsc -p tsconfig.build.json`).
  - Verify `dist/index.js`, `dist/index.mjs`, and `dist/styles.css` are correctly generated.
- [ ] **Task 3: Unit Tests**
  - Run `npm test` (`vitest run`).
  - Add test case verifying attribute cell deduplication in table rendering.
- [ ] **Task 4: Release & Publish**
  - Bump `version` to `0.1.7` in `package.json`.
  - Create release tag and publish `@dotevolve/doc-forge@0.1.7`.
