# Branch protection (apply in GitHub repo settings)

Set these under **Settings → Branches → Add rule** for `main`:

- [x] Require a pull request before merging
  - [x] Require at least **1 approval**
  - [x] Require review from **Code Owners** (uses `.github/CODEOWNERS`)
  - [x] Dismiss stale approvals on new commits
- [x] Require status checks to pass before merging
  - Required checks: `Typecheck + Test`, `Analyze (javascript-typescript)` (CodeQL), `Gitleaks`
  - [x] Require branches to be up to date before merging
- [x] Require conversation resolution before merging
- [x] Restrict force pushes and deletions on `main`

## Repo-wide security settings (Settings → Code security and analysis)

- [x] Dependency graph
- [x] Dependabot alerts + security updates (config in `.github/dependabot.yml`)
- [x] Secret scanning + push protection
- [x] CodeQL advanced setup (workflow in `.github/workflows/codeql.yml`)

> Note: `npm run lint` is currently non-blocking in CI pending an ESLint flat-config
> migration (the existing eslintrc setup crashes under ESLint 9). Re-enable it as a
> required check once fixed.
