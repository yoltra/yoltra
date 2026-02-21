![Yoltra logo](../../assets/yoltra-logo.png)

# Development Workflow

> 👉 English &nbsp;|&nbsp; [🇲🇽 Español](../es/WORKFLOW.md)

This document covers the branching strategy, PR process, and change-file discipline that keep
the monorepo healthy. For actually cutting a release see [RELEASE_GUIDE.md](./RELEASE_GUIDE.md).

---

## Branch model

```
main          ←── stable, published to npm, always releasable
  ↑
develop       ←── integration branch, always green
  ↑
release/vX.Y  ←── short-lived; version bump + release prep only
  ↑
feature/*     ←── one feature / fix per branch
fix/*
chore/*
```

**Rules:**

- `main` is protected. Only PRs from `develop` are merged here (after a release cycle).
- `develop` is protected. Only PRs are merged here — never force-push.
- `release/*` branches are cut from `develop`, bumped, tested, then PR'd back into
  `develop` first and then into `main`.
- `feature/*` / `fix/*` / `chore/*` branches are cut from `develop`.

---

## Day-to-day: feature or fix

```
develop
  └─ feature/123-my-feature
         │  commits with conventional commits + DCO
         │  rush change (at least once)
         └─► PR → develop
```

**Step by step:**

```bash
# 1. Branch from develop
git checkout develop
git pull
git checkout -b feature/123-my-feature

# 2. Create a change file before opening the PR
rush change
#  → select the packages you touched
#  → choose bump type (patch / minor)
#  → enter a short description (ends up in CHANGELOG.md)


# 3. Do your work — commits must follow Conventional Commits + DCO sign-off
git commit -S -s -m "feat(core): add wildcard event matcher"

# 4. Push and open PR against develop
git push -u origin feature/123-my-feature
```

**PR checklist:**

- [ ] Conventional commit messages with DCO sign-off on every commit
- [ ] `rush build` passes locally
- [ ] `rush test` passes (coverage ≥ 95%)
- [ ] `rush lint` and `rush typecheck` pass
- [ ] Change file committed in `common/changes/` (`rush change -v` is green)
- [ ] PR description links the relevant issue(s)

---

## Preparing a release (maintainers)

```
develop
  └─ release/v0.9.0
         │  rush version --bump
         │  manual review of changelogs
         └─► PR → develop  (sync version bumps back)
               └─► PR → main (trigger NPM publish)
```

See **[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)** for the full step-by-step.

---

## Breaking changes while `< 1.0.0`

Until the library reaches `1.0.0`, bump `minor` (not `major`) for breaking changes.

When `@yoltra/core` has a breaking change:

1. Pick **minor** in the `rush change` prompt for core.
2. Update `@yoltra/react`'s `peerDependencies` range to match:
   ```json
   "@yoltra/core": "^0.9.0"
   ```
3. Add a change file for `@yoltra/react` as well (minor or patch, depending on impact).

---

## Hotfixes

A hotfix is a critical fix that must ship without waiting for the next planned release.

```
main
  └─ hotfix/v0.8.1-critical-bug
         │  minimal fix + rush change (patch)
         └─► PR → main  (reviewed and merged directly)
               └─► back-merge PR → develop
```

After the hotfix PR lands on `main`:

1. Publish from `main` (see RELEASE_GUIDE.md).
2. Immediately open a back-merge PR from `main` → `develop` to keep them in sync.

---

## Pre-releases

For experimental features that are not ready for a stable release:

```bash
# Tag the version as a pre-release in the change file (select "prerelease" bump)
rush change

# Publish with a dist-tag so consumers must opt in explicitly
rush publish --publish --tag next
```

Consumers install pre-releases with:
```bash
npm add @yoltra/core@next @yoltra/react@next
```

Pre-releases can also be published to the local Verdaccio registry for testing without
touching npm at all (see RELEASE_GUIDE.md).

---

## TypeDoc documentation

Update API docs whenever you add or change a public API:

```bash
# In the relevant package
cd packages/core
rushx docs          # Generates both Markdown and JSON formats

cd packages/react
rushx docs
```

Commit the generated files under `.typedoc/` alongside the code change using a `docs` commit
type:

```
docs(core): update API docs for wildcard matcher
```
