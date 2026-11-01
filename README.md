# dot-template

Universal project scaffolding and baseline configurations for DotEvolve repositories.

## Overview

This repository contains standard baseline configurations and archetypes for all DotEvolve services, applications, and libraries.

### Directory Structure

```
dot-template/
├── common/                  # Universal baseline configs copied to EVERY repo
│   ├── .npmrc               # GitHub Packages registry (@dotevolve)
│   ├── .nvmrc               # Node 24
│   ├── .node-version        # Node 24
│   ├── .prettierrc          # Prettier config
│   ├── .prettierignore      # Prettier ignore patterns
│   ├── .gitignore           # Standard gitignore (secrets, build outputs, node_modules)
│   ├── .husky/              # Husky v9 pre-commit (npx lint-staged)
│   └── .github/
│       ├── dependabot.yml   # Weekly updates with @dotevolve/* grouped
│       └── workflows/
│           └── ci.yml       # Node 24, npm ci, npm test, npm run build
└── archetypes/
    ├── frontend-app/        # Vite + React + Vitest (jsdom) + Tailwind
    ├── backend-api/         # Express + Jest (node) + Dockerfile + .dockerignore
    └── library/             # tsup + Vitest + tsconfig.build.json
```

## How to Initialize a New DotEvolve Project

1. Copy universal baseline files from `common/` into the new repository root:
   ```bash
   cp -r common/.* common/* /path/to/new-repo/
   ```

2. Copy the relevant archetype into your project:
   * **Frontend Web App / Admin**: `cp -r archetypes/frontend-app/* /path/to/new-repo/`
   * **Backend Express Service**: `cp -r archetypes/backend-api/* /path/to/new-repo/`
   * **Shared Package / Library**: `cp -r archetypes/library/* /path/to/new-repo/`

3. Rename `package.json.template` to `package.json` and customize `name`, `description`, etc.

4. Install dependencies:
   ```bash
   npm install
   ```

5. Initialize Husky:
   ```bash
   npm run prepare
   chmod +x .husky/pre-commit
   ```
