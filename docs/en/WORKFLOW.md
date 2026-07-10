![Yoltra logo](../../assets/yoltra-logo.png)

# Development Workflow

> 👉 English &nbsp;|&nbsp; [🇲🇽 Español](../es/WORKFLOW.md)

This document covers the branching strategy, PR process, and change-file discipline that keep
the monorepo healthy. For actually cutting a release see [RELEASE_GUIDE.md](./RELEASE_GUIDE.md).

---

## Branch model

```
main          ←── stable, always releasable; published to npm by pushing a tag
  ↑
release/next  ←── integration branch for the next release; carries the version bump into main
  ↑
feature/*     ←── one feature / fix per branch
fix/*
chore/*
hotfix/*
```

**Rules:**

- Feature work lands via PR (never force-push a shared branch). Merging to `main` does **not**
  publish; pushing a `v*.*.*` tag does.
- `feature/*` / `fix/*` / `chore/*` branches are cut from `release/next` and PR'd back into it, each
  carrying a change file (`rush change`).
- `release/next` is the standing integration branch. Features + their change files flow through it
  into `main` via PR (which passes `rush change --verify`). The **version bump is applied on `main`
  after the merge** — not in the PR — then pushed with the `v*.*.*` tag. (Bumping _consumes_ change
  files, which would fail the PR's verify; `main` is unprotected, so the bump lands there directly.)
- `hotfix/*` branches are cut from `main` for a critical fix, PR'd straight back into `main`, then
  tagged; merge `main` back into `release/next` afterward.

---

## Day-to-day: feature or fix

```
main
  └─ feature/123-my-feature
         │  commits with conventional commits + DCO
         │  rush change (at least once)
         └─► PR → main
```

**Step by step:**

```bash
# 1. Branch from main
git checkout main
git pull
git checkout -b feature/123-my-feature

# 2. Create a change file before opening the PR
rush change
#  → select the packages you touched
#  → choose bump type (patch / minor)
#  → enter a short description (ends up in CHANGELOG.md)


# 3. Do your work — commits must follow Conventional Commits + DCO sign-off
git commit -S -s -m "feat(core): add wildcard event matcher"

# 4. Push and open PR against main
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
release/next ──► PR (features + change files, no bump) ──► merge to main
                                                              │
main:  rush version --bump  →  commit "chore(release): vX.Y.Z"  →  push main --follow-tags
       (bump + CHANGELOGs land on main; the tag, not the merge, publishes via CI)
```

Publishing is triggered by pushing a `v*.*.*` tag to `main`, **not** by merging — the tag runs
`release.yml`, which publishes via npm Trusted Publishing (OIDC). Because the bump is part of the
`release/next → main` PR, `main` already carries the new versions when you tag. See
**[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)** for the full step-by-step.

---

## Breaking changes while `< 1.0.0`

Until the suite reaches `1.0.0`, a **breaking change is a `minor` bump** (not `major`). The whole
product suite — `@yoltra/core`, `@yoltra/react`, and every `@yoltra/devtools-*` — versions in
**lockstep** via the `yoltra` policy, so they always move together to the same version. You do
**not** choose a per-package bump.

1. Add a change file so the change is captured in the changelog:

   ```bash
   rush change    # write a short description; the type is informational under lockstep
   ```

2. At release time `rush version --bump` moves the entire suite to the next minor (the policy's
   `nextBump`). See the **[Release Guide](./RELEASE_GUIDE.md)** for the full flow.

---

## Hotfixes

A hotfix is a critical fix that must ship without waiting for the next planned release.

```
main
  └─ hotfix/v0.8.1-critical-bug
         │  minimal fix + rush change (patch)
         │  rush version --bump --override-bump patch
         └─► PR → main  (reviewed and merged directly)
               └─► push tag v0.8.1 → CI publishes
```

After the hotfix PR lands on `main`, tag the merge commit
(`git tag v0.8.1 && git push origin v0.8.1`) — the tag triggers CI, which publishes via OIDC (see
RELEASE_GUIDE.md).

---

## Pre-releases

For experimental features that are not ready for a stable release, bump to a pre-release version:

```bash
rush version --bump --override-bump preminor   # e.g. 0.2.0-0
```

Pre-releases are **not** wired into the tag-triggered CI (it publishes the `latest` dist-tag). Test
them in the local Verdaccio registry, or see **[RELEASE_GUIDE.md](./RELEASE_GUIDE.md) → Pre-releases**
to ship one to npm under a `next` dist-tag. Consumers install with:

```bash
npm add @yoltra/core@next @yoltra/react@next
```

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
