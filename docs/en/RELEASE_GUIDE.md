![Yoltra logo](../../assets/yoltra-logo.png)

# Release Guide

> 👉 English &nbsp;|&nbsp; [🇲🇽 Español](../es/RELEASE_GUIDE.md)

This guide covers the complete release cycle: bumping versions, testing against the local
Verdaccio registry, and publishing to npm.

For the branching model that feeds into this process see [WORKFLOW.md](./WORKFLOW.md).

---

## Release flow overview

```
develop  (all PRs merged, change files present)
    │
    ├── git checkout -b release/v0.9.0
    │       rush version --bump          ← consume change files, bump versions
    │       review CHANGELOGs
    │       [local Verdaccio test]       ← optional but strongly recommended
    │
    ├── PR: release/v0.9.0 → develop    ← sync version bumps back
    │
    └── PR: develop → main
              │
              rush publish --publish      ← publish to npm
              git tag v0.9.0
              git push --tags
```

---

## Step 1 — Ensure develop is green

Before cutting a release branch, verify all gates pass:

```bash
git checkout develop
git pull

rush install
rush build
rush test
rush lint
rush typecheck
```

Also check that all publishable PRs included change files:

```bash
rush change -v
```

---

## Step 2 — Cut the release branch and bump versions

```bash
git checkout -b release/v0.9.0

# Consume all change files and bump package.json versions + write CHANGELOG.md
rush version --bump

# Review the generated CHANGELOG files in each package
# Review the updated version numbers in package.json files

git add .
git commit -s -m "chore(release): bump versions for v0.9.0"
```

`rush version --bump` reads every file in `common/changes/`, applies the appropriate
semver bump to each affected package, updates `CHANGELOG.md`, and deletes the change files.

**Important:** `@yoltra/core` and `@yoltra/react` share the `"lockstep"` version policy, so
they always move to the same version together.

---

## Step 3 — Test against the local Verdaccio registry

This step lets you verify the full consumer install experience before touching npm.

### 3a. Start Verdaccio

```bash
cd tools/registry
docker compose up -d

# Verify it is healthy
curl http://localhost:4873/-/ping
```

### 3b. Create a local user (first time only)

```bash
npm adduser --registry http://localhost:4873
# Enter a username, password, and email when prompted.
# These are local-only credentials — they do not touch npmjs.com.
```

### 3c. Publish to Verdaccio

```bash
# From the repo root — publishes all shouldPublish:true packages to Verdaccio
rush publish --publish --registry http://localhost:4873

# If the version already exists in Verdaccio from a previous test run,
# use --include-all to force-publish all packages regardless:
rush publish --publish --registry http://localhost:4873 --include-all
```

### 3d. Consume from Verdaccio in a test project

In a throwaway project outside this repo:

```bash
# Point pnpm at the local registry for the @yoltra scope
echo '@yoltra:registry=http://localhost:4873/' >> .npmrc

npm add @yoltra/core@0.9.0 @yoltra/react@0.9.0
# Use the exact version numbers from your package.json files
```

Verify the package works as expected.

### 3e. Tear down Verdaccio

```bash
# Stop but keep data (useful for repeat tests)
docker compose down

# Stop AND wipe all stored packages + users (clean slate)
docker compose down -v
```

---

## Step 4 — Sync release branch back to develop

Before merging to `main`, sync the version bumps back to `develop` so the two branches
do not diverge:

```bash
# Open a PR: release/v0.9.0 → develop
# Review, approve, and merge as normal.
```

---

## Step 5 — Merge to main and publish to npm

```bash
# Open a PR: develop → main
# Review, approve, and merge as normal.

git checkout main
git pull
```

Set your npm auth token (use an environment variable, not a hardcoded value):

```bash
export NPM_AUTH_TOKEN="your_npm_token_here"
```

Publish to npm:

```bash
# Dry run first — shows what would be published without actually publishing
rush publish --publish --dry-run

# Publish for real
rush publish --publish
```

Rush reads the registry and auth token from `common/config/rush/.npmrc-publish`.

---

## Step 6 — Tag the release

```bash
git tag v0.9.0
git push origin v0.9.0
```

Create a GitHub release from the tag and paste the relevant `CHANGELOG.md` section as the
release notes.

---

## Publishing only specific packages

To publish a single package without touching others:

```bash
rush publish --publish --include-all --version-policy lockstep
# or target a specific package:
rush publish --publish --include-all --to @yoltra/core
```

---

## Re-publishing after a failed publish

If the publish was interrupted and some packages made it through while others did not:

```bash
# --include-all forces Rush to attempt all packages, skipping those already on npm
rush publish --publish --include-all
```

npm rejects attempts to republish the same version with a 409 error, so `--include-all`
is safe to run multiple times.

---

## Hotfix releases

A hotfix follows the same steps but branches from `main` instead of `develop`:

```bash
git checkout main
git pull
git checkout -b hotfix/v0.8.1

# Apply the minimal fix
git commit -s -m "fix(core): resolve critical issue"

# Create a patch-level change file
rush change   # choose "patch" for all affected packages

# Bump versions
rush version --bump

git add .
git commit -s -m "chore(release): bump to v0.8.1"

# [Optional] test in Verdaccio (steps 3a–3e above)

# PR hotfix/v0.8.1 → main, merge, then publish
rush publish --publish

# Tag
git tag v0.8.1 && git push origin v0.8.1

# Back-merge: PR main → develop to stay in sync
```

---

## Pre-releases (alpha / beta / rc)

```bash
# Create a pre-release change file (choose "prerelease" bump type)
rush change

# Bump — produces versions like 0.9.0-alpha.0
rush version --bump

# Publish to npm with a dist-tag (consumers must opt in with @next)
rush publish --publish --tag next
```

Consumers install pre-releases explicitly:

```bash
npm add @yoltra/core@next
```

To test pre-releases locally, publish to Verdaccio using step 3 above.

---

## Quick reference

```bash
# --- prepare ---
rush change                             # create change files (during development)
rush change -v                          # validate change files exist
rush version --bump                     # apply bumps, write changelogs

# --- local test ---
docker compose -f tools/registry/docker-compose.yml up -d
rush publish --publish --registry http://localhost:4873

# --- npm ---
rush publish --publish                  # publish using .npmrc-publish
rush publish --publish --include-all    # force-publish all packages

# --- tag ---
git tag vX.Y.Z && git push origin vX.Y.Z
```
