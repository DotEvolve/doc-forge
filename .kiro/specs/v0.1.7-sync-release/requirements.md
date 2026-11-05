# Requirements Specification: DocForge v0.1.7 Sync & Release

## 1. Overview & Business Goals
During live production usage in `floorix-app`, several document rendering and table layout edge cases were resolved locally (specifically duplicate attribute cell deduplication across grouped rows, dynamic row borders, and slider adjustments in the studio). This specification defines the requirements for upstreaming these fixes into the standalone `@dotevolve/doc-forge` library and releasing **v0.1.7** so that downstream applications (`floorix-app` and `floorix-admin`) can migrate with zero behavioral or visual regressions.

---

## 2. Functional Requirements (FR)

### FR-1: Table Section Duplicate Attribute Cell Deduplication
- **FR-1.1**: When rendering grouped tabular rows for multi-size articles, duplicate attribute cells (e.g. Color, Material) in consecutive rows belonging to the same article group must be suppressed/blanked out to prevent visual clutter, matching the behavior in `floorix-app`.
- **FR-1.2**: Border styling between grouped items must visually separate distinct articles while keeping grouped rows tightly cohesive.

### FR-2: Footer & Summary Section Alignment
- **FR-2.1**: Total quantity summary rows and notes in `FooterSection.tsx` must align with the column budgets defined in `TableSection.tsx`.
- **FR-2.2**: The layout must render cleanly in both 1-up (standard reports) and 2-up (manufacturing job slips) tiling configurations.

### FR-3: Package Build & Style Distribution
- **FR-3.1**: The package must export both CJS and ESM entry points via `tsup`.
- **FR-3.2**: CSS styles must be compiled to `./dist/styles.css` and be consumable via `import '@dotevolve/doc-forge/styles'`.

---

## 3. Non-Functional Requirements (NFR)
- **NFR-1**: 100% test pass rate across all Vitest suites in `doc-forge`.
- **NFR-2**: Zero breaking changes to the exported public API (`DocumentRenderer`, `DocumentPreview`, `DocForgeStudio`, `useDocumentPrinter`, `TemplateDescriptor`, `DataDoc`).
- **NFR-3**: Strict TypeScript compliance without errors (`tsc --noEmit`).
