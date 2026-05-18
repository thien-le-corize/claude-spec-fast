# Git Workflow Rules

> Mandatory branching strategy, commit conventions, and PR rules.

---

## Branch Strategy

```
main            ← Production-ready code (protected)
  └── develop   ← Integration branch
       ├── feature/*   ← New features
       ├── fix/*       ← Bug fixes
       ├── hotfix/*    ← Urgent production fixes
       └── release/*   ← Release preparation
```

### Branch Naming

```
feature/user-authentication
feature/order-checkout-flow
fix/login-redirect-loop
fix/cart-total-calculation
hotfix/critical-xss-vulnerability
release/v1.2.0
```

### Rules

| Rule | Severity |
|------|----------|
| 🔴 Never commit directly to `main` | Critical |
| 🔴 Never commit directly to `develop` | Critical |
| 🔴 All changes via Pull Request | Critical |
| 🔴 PR must pass CI before merge | Critical |
| 🔴 PR must have >= 1 reviewer approval | Critical |
| 🟡 Delete branch after merge | Important |
| 🟡 Keep branches short-lived (< 3 days) | Important |

---

## Commit Message Format (Conventional Commits)

```
<type>(<scope>): <short description>

[optional body — explain WHY, not WHAT]

[optional footer — breaking changes, issue refs]
```

### Types

| Type | When | Example |
|------|------|---------|
| `feat` | New feature | `feat(auth): add JWT refresh token` |
| `fix` | Bug fix | `fix(cart): correct total when discount applied` |
| `docs` | Documentation only | `docs(api): add Swagger annotations` |
| `style` | Formatting, no logic change | `style: fix indentation in user-service` |
| `refactor` | Code restructure, no feature/fix | `refactor(orders): extract validation logic` |
| `test` | Adding or fixing tests | `test(users): add unit tests for create` |
| `chore` | Build, deps, tooling | `chore: upgrade vitest to v2.0` |
| `perf` | Performance improvement | `perf(queries): add index on orders.user_id` |
| `ci` | CI/CD changes | `ci: add e2e tests to pipeline` |

### Rules

| Rule | Severity |
|------|----------|
| 🔴 Type is required | Critical |
| 🔴 Description is lowercase, no period | Critical |
| 🔴 Max 72 characters for subject line | Critical |
| 🟡 Scope is recommended | Important |
| 🟡 Body explains WHY (not what) | Important |
| 🟡 Footer references issue | Important |

### Examples

```
feat(auth): add Google OAuth login

Implement OAuth2 flow with Google provider.
Users can now sign in with their Google account.

Closes #45

---

fix(orders): prevent double-charge on retry

The payment was being processed again when user refreshed
the confirmation page. Added idempotency key check.

Closes #123

---

refactor(users): extract email validation to shared util

Email validation was duplicated in 3 services.
Extracted to shared/helpers/email.helper.ts.

No behavior change — all existing tests pass.
```

---

## Pull Request Rules

### PR Title (follows commit format)

```
feat(auth): add password reset flow
fix(dashboard): correct chart data aggregation
```

### PR Description Template

```markdown
## What
[Brief description of changes]

## Why
[Business reason or issue reference]

## How
[Technical approach — key decisions]

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing done on [environment]

## Screenshots (if UI change)
[Before/After]

## Checklist
- [ ] Code follows project style guide
- [ ] Tests pass locally
- [ ] No console.log or debug code
- [ ] Documentation updated (if needed)
- [ ] No secrets in code

Closes #[issue-number]
```

### PR Size Rules

| Size | Lines Changed | Action |
|------|--------------|--------|
| ✅ Small | < 200 lines | Ideal — review quickly |
| 🟡 Medium | 200-500 lines | Acceptable — review carefully |
| 🔴 Large | > 500 lines | Split into smaller PRs |

---

## Merge Strategy

| Branch | Merge Into | Strategy |
|--------|-----------|----------|
| `feature/*` | `develop` | Squash merge (clean history) |
| `fix/*` | `develop` | Squash merge |
| `develop` | `main` | Merge commit (preserve history) |
| `hotfix/*` | `main` + `develop` | Merge commit |
| `release/*` | `main` + `develop` | Merge commit |

---

## Git Hooks (Recommended)

```json
// package.json — using husky + lint-staged
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### Pre-commit
- Lint staged files
- Format staged files
- Type check

### Pre-push
- Run unit tests
- Check for console.log / debug statements

---

## Tags & Releases

```bash
# Semantic versioning: MAJOR.MINOR.PATCH
# MAJOR: breaking changes
# MINOR: new features (backward compatible)
# PATCH: bug fixes

git tag -a v1.2.0 -m "Release v1.2.0: add payment integration"
git push origin v1.2.0
```

---

## Never Commit

| File/Pattern | Why |
|-------------|-----|
| `.env` | Contains secrets |
| `.env.local` | Local overrides |
| `node_modules/` | Dependencies (use lockfile) |
| `.DS_Store` | OS files |
| `*.log` | Runtime logs |
| `dist/`, `build/` | Build artifacts |
| `coverage/` | Test coverage reports |
| `*.pem`, `*.key` | Certificates/keys |

### .gitignore (minimum)

```
node_modules/
dist/
build/
coverage/
.env
.env.*
!.env.example
*.log
.DS_Store
*.pem
*.key
```
