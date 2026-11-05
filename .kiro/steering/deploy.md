# Deployment & Operations Playbook: doc-forge

## Tier: D (Shared Library)

### Package & Registries
- **Package Name**: `@dotevolve/doc-forge`
- **Registries**: GitHub Packages (`npm.pkg.github.com`) and npm registry (`registry.npmjs.org`)
- **Trigger**: Automatic publication on push/merge to `master` via `.github/workflows/publish.yml`

### Pre-Publish Verification
```bash
npm run lint
npm test
npm run build
```

### Post-Merge Validation
1. Monitor GitHub Actions `publish.yml` run: `gh run list --workflow=publish.yml --limit 1`
2. Verify package versions: `npm view @dotevolve/doc-forge version`

### Rollback Procedure
1. Never unpublish packages.
2. Publish corrective patch version: revert offending code, increment patch version, and promote to `master`.
