# Agent Development & Operations Guide

## 1. Architectural Precedence

For public repositories, internal `.kiro/` specifications and steering files are excluded from version control to maintain confidentiality. Any local untracked `.kiro/` files (if present in local dev environments) or the instructions in this document serve as authoritative reference.

---

## 2. Pre-Commit Quality & Local Verification Gates

Before staging or committing any changes, the agent must run and pass the following checks locally:

1. **Type Checking**: `npx tsc --noEmit` (or `tsc -b`) with zero TypeScript errors.
2. **Automated Test Suite**: `npm test` with 100% passing tests.
3. **Linting & Code Style**: `npm run lint` and `npx prettier --check .` with zero errors.

Commits must follow the **Conventional Commits** standard:
`feat(<scope>): ...`, `fix(<scope>): ...`, `chore(<scope>): ...`, `docs(<scope>): ...`, `test(<scope>): ...`.

---

## 3. Branching Strategy & Release Lifecycle (CalVer)

Strict branch flow:
`feature/*` ──(PR)──> `dev` ──(cut branch)──> `release/<calver>` ──(PR)──> `master`

- **`feature/*`**: Active working branches branched from `dev` (`feat/*`, `fix/*`, `chore/*`, `docs/*`).
- **`dev`**: Continuous integration branch deployed to development/preview environments.
- **`release/<calver>`**: Staged release candidate branch cut from `dev`.
- **`master`**: Production branch deployed to production environments.

> **Absolute Rule**: Never commit directly to `dev` or `master`. All updates to `dev` and `master` require a Pull Request. Creating and pushing a `release/<calver>` branch directly from `dev` is the authorized method for staging release candidates; any subsequent fixes to that release branch must be merged via PR.

### 3.1 Focused Feature PR Rule (Individual & Discrete PRs)

> **Rule**: Features, enhancements, bug fixes, and chores should be developed on dedicated branches and opened as individual, focused PRs targeting `dev`. Opening separate PRs per feature or fix is encouraged to ensure isolated risk, granular automated testing, and concise code reviews.
>
> **Batching Disallowed**: Monolithic PRs bundling multiple unrelated features, fixes, or chores together are discouraged. Each distinct change should be delivered through its own discrete PR.

### The Promotion Lifecycle:

1. **Feature Phase (`feature/*` -> `dev`)**:
   - Branch off `dev`: `git checkout dev && git pull origin dev && git checkout -b feat/<name>`.
   - Implement, verify locally, commit, and push: `git push -u origin feat/<name>`.
   - Open PR targeting `dev`: `gh pr create --base dev --head feat/<name> ...` (merge using **Squash Merge**).
2. **Release Candidate Phase (`dev` -> `release/<calver>`)**:
   - Pull updated `dev`: `git checkout dev && git pull origin dev`.
   - Branch using CalVer format `YYYY.0M.0D`: `git checkout -b release/YYYY.0M.0D` (append `.1`, `.2` for multiple daily releases).
   - Verify full test suite passes on the release branch.
   - Push release branch to origin: `git push -u origin release/YYYY.0M.0D`.
   - Open PR targeting `master`: `gh pr create --base master --head release/YYYY.0M.0D --title "release: YYYY.0M.0D [dev -> master]" ...` (merge using **Merge Commit**).

---

## 4. PR Quality Gates & Seer Remediation Loop

When any Pull Request is opened:

1. **Do Not Merge Immediately**: Allow automated checks and AI reviewers to complete.
2. **Continuous Polling**:
   - Poll checks: `gh pr checks <pr-number>`
   - Poll review threads: `gh pr view <pr-number> --json reviews,comments`
3. **Automated Review & Seer Remediation**:
   - **Zero Open Comments**: All comments from human reviewers, bots (e.g. Socket Security), and Seer must be addressed.
   - For every flagged issue: apply the fix, add automated tests, push updates, and reply on the review thread.
   - **Thread Resolution**: Use the GitHub GraphQL API to mark the thread resolved:
     ```bash
     gh api graphql -f query='mutation($threadId: ID!) {
       resolveReviewThread(input: { threadId: $threadId }) {
         thread { isResolved }
       }
     }' -F threadId="<thread_id>"
     ```
   - Verify Seer Code Review check is green (`SUCCESS`).

---

## 5. HARD GATE: Explicit Merge Authorization

Even when all CI checks and Seer reviews pass with zero open comments:

- **Agents MUST NEVER merge a PR autonomously.**
- The agent must halt and ask the user for explicit approval:
  > _"PR #<id> has passed all CI checks and Seer code review with zero open comments. Do you approve merging this PR into `<target-branch>`?"_
- Only when the user responds with explicit confirmation may the agent run the merge command.

### Merge Strategy by Phase:

- **[Phase 1: Feature -> dev]** Use **SQUASH MERGE** (`--squash`):

  ```bash
  gh pr merge <pr-number> --squash --delete-branch
  ```
  - Keeps `dev` clean, 1 commit per consolidated feature/fix.

- **[Phase 2: release -> master]** Use **MERGE COMMIT** (`--merge` / `--no-ff`):
  ```bash
  gh pr merge <pr-number> --merge --delete-branch
  ```
  - Keeps exact `dev` commit SHAs in `master`'s git tree.
  - Ensures `dev` and `master` never diverge.
  - Releases are cleanly tagged at the merge commit.

> **Rule**: Rebase merges (`--rebase`) are strictly prohibited.

---

## 6. Post-Merge Deployment Monitoring & Playbook

After merging into `dev` or `master`:

1. The agent must monitor the post-merge GitHub Actions deployment workflow (`publish.yml`).

### Package & Registries

- **Package Name**: `@dotevolve/doc-forge`
- **Registries**: GitHub Packages (`npm.pkg.github.com`) and public npm registry (`registry.npmjs.org`) via Trusted Publishers (OIDC)
- **Triggers**: Automatic publication on push/merge to `master` (dist-tag: `latest`) and push to `release/**` (dist-tag: `beta`) via `.github/workflows/publish.yml`

### Pre-Publish Verification

```bash
npx prettier --check .
npm run lint
npm test
npm run build
```

### Version Bump Requirement

The `package.json` version must be bumped prior to opening the release PR. If the version already exists in the target registry, `publish.yml` will skip publication.

### Post-Merge Validation

1. Monitor GitHub Actions `publish.yml` run: `gh run list --workflow=publish.yml --limit 1`
2. Verify package versions:
   - `npm view @dotevolve/doc-forge version --registry=https://npm.pkg.github.com`
   - `npm view @dotevolve/doc-forge version --registry=https://registry.npmjs.org`

### Rollback Procedure

1. Never unpublish packages from registries.
2. Publish corrective patch version: revert offending code, increment patch version, and promote to `master`.

---

## 7. Agent Decision & Confirmation Protocol

### 7.1 Confirm Before Acting

When the next action is unclear, the agent **must stop and ask** before proceeding. Never guess.

Situations requiring explicit confirmation:

- Which branch to target when ambiguous.
- Whether to proceed with a breaking API change or version bump type.
- Whether a found issue is in scope for the current task.
- Modifying, creating, or deleting any GitHub Actions workflow files (`.github/workflows/*`).
- Connecting to remote servers (dev or prod) via SSH, remote Docker, or direct shell.
- Modifying standardized configuration files (e.g., `tsconfig*.json`, `package.json` scripts/engines, `.eslintrc*`, `eslint.config.*`, `.prettierrc*`, `vite.config.*`).

> **Rule**: A short clarifying question is always preferable to an incorrect autonomous action.

### 7.2 No Guessing Root Causes

When investigating a bug or failure, **do not assume a cause without evidence**.

- Read the actual error output or failing test first.
- If evidence is not accessible, ask: _"Can you share the output of `<command>` so I can confirm the root cause?"_
- Only propose a fix after the cause is confirmed by observable output.

### 7.3 Standardized Configuration Protection Rule

All configuration files for this library have been standardized (including `"types": ["node"]` and `"lib": ["ES2024"]` in `tsconfig*.json`, `package.json` engines/scripts, prettier, and eslint configs).

- Agents **must not** modify, override, or revert standardized configuration files without explicit user permission.
- If a dependency update, build failure, or new tooling requirement appears to necessitate altering compiler options, `types`, `lib`, scripts, or build targets, the agent **must halt and request explicit approval** before modifying any configuration file.

### 7.4 GitHub Actions Workflow Protection Rule

Agents **must not** modify, create, rename, or delete any GitHub Actions workflow files (`.github/workflows/*`) or CI/CD configuration files under any circumstances without prior explicit user authorization.

### 7.5 Remote Server Access Restriction Rule

Agents **must never** connect to remote development or production servers (via SSH, remote Docker socket/daemon, or direct host shell) without explicit user authorization. All infrastructure inspection, remote log viewing, container management, or host-level troubleshooting requires prior explicit permission from the user.

---

## 8. Artifact & Documentation Persistence

All plans, analysis reports, architecture designs, and specifications generated by agents must be saved into documentation within this repository (in `docs/` or root-level markdown files).

---

## 9. Multi-Repository Platform Deployment Order

When a task spans multiple repositories, execution and deployment must strictly follow this dependency chain:

1. **`libs`**: `dot-core`, `dot-error-utils`, `dot-ui-kit`, `doc-forge`, `dot-documentation-tool`
2. **`infra`**: `dot-infra`
3. **`backend`**: `dot-portal-api`, `floorix-api`, `govnix-api`, `perfxcel-api`, `govnix-workflow-service`, `civix-api`
4. **`front-end`**: `dot-portal`, `floorix-admin`, `floorix-app`, `govnix-admin`, `govnix-app`, `govnix-mca-extension`, `perfxcel-admin`, `perfxcel-app`, `civix-admin`, `civix-app`
5. **`marketing-websites`**: `dotevolve.net`, `floorix.net`, `govnix.net`, `dot-docs`
