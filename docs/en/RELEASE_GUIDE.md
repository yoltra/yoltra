![Yoltra logo](../../assets/yoltra-logo.png)

# Release Guide

> 👉 English &nbsp;|&nbsp; [🇲🇽 Español](../es/RELEASE_GUIDE.md)

How to version, changelog, and publish the Yoltra packages. If you read one thing, read the
[Cheat sheet](#cheat-sheet).

---

## Mental model

Three **independent** mechanisms — don't conflate them:

1. **The changelog comes from _change files_, not commit messages.** Every PR that touches a
   publishable package includes a change file (`rush change`). At release time `rush version --bump`
   turns those into `CHANGELOG.md` entries and version bumps. Your commit messages do **not** drive
   the changelog.
2. **One version for the whole suite (lockstep).** `@yoltra/core`, `@yoltra/react`, and every
   `@yoltra/devtools-*` share a single version via the **`yoltra`** version policy
   ([version-policies.json](../../common/config/rush/version-policies.json)). They always bump
   together (e.g. all `0.1.0 → 0.2.0`). You never track a version per package. `@yoltra/eslint-config-*`
   and `@yoltra/devtools-ext` are intentionally on their own tracks.
3. **Commit format is enforced separately.** A `commit-msg` git hook runs **commitlint**
   (Conventional Commits); non-conforming messages are rejected. This is hygiene — unrelated to the
   changelog.

## Staying on 0.x

We stay `< 1.0.0` until the API is stable. In 0.x semver a **breaking change is a MINOR bump**, so
the policy's `nextBump` is `minor` (`0.1.0 → 0.2.0`). For a fix-only release, do a patch (see
below). **Do not bump to 1.0.0 yet** — change `nextBump` deliberately when the time comes.

---

## One-time setup

```bash
npm i -g @microsoft/rush          # Rush drives everything
rush install                      # installs deps AND copies the git hooks into .git/hooks
rush update-autoinstaller --name rush-commitlint   # installs commitlint for the commit hook
```

To publish you also need an npm token with publish rights to the `@yoltra` scope:

```bash
export NPM_AUTH_TOKEN="npm_xxx"   # only set this when you actually intend to publish
```

---

## During development: change files

Whenever a branch changes a **publishable** package, add a change file before it merges:

```bash
rush change
#  → select the packages you touched
#  → choose a type: patch | minor | none
#  → write a one-line description → this becomes the CHANGELOG entry
```

Notes:

- Under lockstep the **actual** version bump is decided by the policy at release time (`nextBump`),
  not by the per-package type here — but still run `rush change` so your description lands in the
  changelog. Use `none` for changes that shouldn't appear in a changelog (pure docs, examples).
- Verify a branch has its change files:

  ```bash
  rush change --verify     # alias: rush change -v
  ```
---

## Cutting a release

From an up-to-date `main`:

```bash
git checkout main && git pull
git checkout -b release/v0.2.0        # short-lived release branch

# 1. Consume change files → bump versions + write CHANGELOGs (deletes the change files)
rush version --bump
#    Every "yoltra" package moves together to the next version (minor by default: 0.1.0 → 0.2.0).

# 2. Review the new version in each package.json and each CHANGELOG.md, then commit
git add -A && git commit -m "chore(release): v0.2.0"
```

### Patch instead of minor

The policy defaults to `minor`. For a fix-only release, override at bump time:

```bash
rush version --bump --override-bump patch      # 0.1.0 → 0.1.1
```

(or edit `nextBump` in [version-policies.json](../../common/config/rush/version-policies.json)).

---

## Dry-run against local Verdaccio (recommended)

Test the real consumer-install experience before touching npm. `.npmrc-publish` targets **npm**, so
point at Verdaccio explicitly with `--registry`:

```bash
# start the local registry
docker compose -f tools/registry/docker-compose.yml up -d

# first time only: create a local user
npm adduser --registry http://localhost:4873

# publish the suite to the LOCAL registry
rush publish --publish --include-all --version-policy yoltra --registry http://localhost:4873

# in a throwaway project outside this repo:
echo '@yoltra:registry=http://localhost:4873/' >> .npmrc
npm add @yoltra/core@0.2.0 @yoltra/react@0.2.0

# tear down (‑v also wipes stored packages)
docker compose -f tools/registry/docker-compose.yml down -v
```

---

## Publishing to npm

```bash
export NPM_AUTH_TOKEN="npm_xxx"   # token with @yoltra publish rights

# publish ONLY the lockstep product suite (core, react, devtools-*) to npm
rush publish --publish --include-all --version-policy yoltra
```

Rush reads the registry + token from [.npmrc-publish](../../common/config/rush/.npmrc-publish).

**There is no accidental-publish path:** `rush publish` does nothing without `--publish`, and it
can't authenticate unless `NPM_AUTH_TOKEN` is set. npm rejects republishing an existing version
(409), so re-running after a partial publish is safe.

Then merge and tag:

```bash
# PR release/v0.2.0 → main, review, merge
git checkout main && git pull
git tag v0.2.0 && git push origin v0.2.0
```

Create a GitHub release from the tag and paste the relevant `CHANGELOG.md` section as the notes.

---

## Hotfix (patch on a shipped release)

```bash
git checkout main && git pull
git checkout -b hotfix/v0.2.1

# minimal fix + a patch change file
git commit -m "fix(core): resolve <critical issue>"
rush change                              # choose "patch"

rush version --bump --override-bump patch   # 0.2.0 → 0.2.1
git add -A && git commit -m "chore(release): v0.2.1"

# PR → main, merge, then publish + tag as above
rush publish --publish --include-all --version-policy yoltra
git tag v0.2.1 && git push origin v0.2.1
```

---

## Pre-releases (alpha / beta / rc)

```bash
rush version --bump --override-bump preminor   # e.g. 0.2.0-0
rush publish --publish --include-all --version-policy yoltra --tag next
```

Consumers opt in explicitly: `npm add @yoltra/core@next`. Test pre-releases in Verdaccio first.

---

## Cheat sheet

```bash
# --- during development ---
rush change                # add a changelog entry for your change
rush change -v             # verify change files exist

# --- cut a release ---
git checkout -b release/vX.Y.Z
rush version --bump                       # bump the whole suite + write CHANGELOGs (minor default)
#   fix-only release:  rush version --bump --override-bump patch

# --- dry-run in Verdaccio ---
docker compose -f tools/registry/docker-compose.yml up -d
rush publish --publish --include-all --version-policy yoltra --registry http://localhost:4873

# --- publish to npm ---
export NPM_AUTH_TOKEN=...
rush publish --publish --include-all --version-policy yoltra

# --- tag ---
git tag vX.Y.Z && git push origin vX.Y.Z
```
