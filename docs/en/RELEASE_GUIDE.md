![Yoltra logo](../../assets/yoltra-logo.png)

# Release Guide

> 👉 English &nbsp;|&nbsp; [🇲🇽 Español](../es/RELEASE_GUIDE.md)

How to version, changelog, and publish the Yoltra packages. If you read one thing, read the
[Cheat sheet](#cheat-sheet).

---

## Mental model

Four **independent** mechanisms — don't conflate them:

1. **The changelog comes from _change files_, not commit messages.** Every PR that touches a
   publishable package includes a change file (`rush change`). At release time `rush version --bump`
   turns those into `CHANGELOG.md` entries and version bumps. Your commit messages do **not** drive
   the changelog.
2. **One version for the whole suite (lockstep).** `@yoltra/core`, `@yoltra/react`, and every
   `@yoltra/devtools-*` share a single version via the **`yoltra`** version policy
   ([version-policies.json](../../common/config/rush/version-policies.json)). They always bump
   together (e.g. all `0.1.0 → 0.2.0`). You never track a version per package. `@yoltra/eslint-config-*`
   and `@yoltra/devtools-ext` are intentionally on their own tracks.
3. **Publishing is automated on a version tag.** You never run `npm publish` by hand. Pushing a
   `v*.*.*` tag triggers [`.github/workflows/release.yml`](../../.github/workflows/release.yml),
   which builds and publishes via **npm [Trusted Publishing](https://docs.npmjs.com/trusted-publishers)
   (OIDC)** — no long-lived token. Merging to `main` does **not** publish.
4. **Commit format is enforced separately.** A `commit-msg` git hook runs **commitlint**
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

Publishing uses **npm Trusted Publishing (OIDC)** — there is **no `NPM_TOKEN` secret**. The only
setup is on npm's side: for each publishable `@yoltra/*` package, add a **Trusted Publisher**
(npmjs.com → package → _Settings → Trusted Publisher_) pointing at repo `yoltra/yoltra`, workflow
`release.yml`, environment `production`. See [RELEASING.md](../../RELEASING.md) for the exact
values. npm lets you pre-register a name that has never been published, so the devtools packages
can be configured before their first release.

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
  rush change --verify     # alias: rush change -v   (CI runs this on every PR)
  ```

---

## Cutting a release

The version bump rides **inside the `release/next → main` PR** — it's the last commit on
`release/next` before you promote it. Feature work carries only change files; the release bump turns
them into versions + changelogs. Publishing then happens in CI when you tag `main` after the merge.

```bash
# On release/next, once all the work for this release (and its change files) has landed:
git checkout release/next && git pull

# 1. Consume change files → bump versions + write CHANGELOGs (deletes the change files)
rush version --bump
#    yoltra lockstep (core / react / devtools-*):  minor by default, e.g. 0.1.0 → 0.2.0
#    @yoltra/ds (its own policy):                   bumps per its own change files

# 2. Review the new version in each package.json and each CHANGELOG.md, then commit onto release/next
git add -A && git commit -m "chore(release): v0.2.0"
git push origin release/next
```

Then:

1. **Open (or update) the `release/next → main` PR.** It now carries the feature work **and** the
   version bump + changelogs — review and **merge** it. The bump is part of this PR; you never bump
   directly on `main`.
2. **Pull `main` and tag the merge commit** — this is what publishes:

   ```bash
   git checkout main && git pull
   git tag v0.2.0 && git push origin v0.2.0
   ```

   > The tag is only the trigger. `rush publish` publishes whatever version is in `package.json`, so
   > the bump must already be on `main` (it rode in with the PR) and the tag name must match it.

3. The **Release** workflow builds and publishes to npm via OIDC. If the `production` environment
   has an approval gate, approve the run.
4. **Create a GitHub release** from the tag and paste the relevant `CHANGELOG.md` section as the
   notes.

### Patch instead of minor

The policy defaults to `minor`. For a fix-only release, override at bump time:

```bash
rush version --bump --override-bump patch      # 0.1.0 → 0.1.1
```

(or edit `nextBump` in [version-policies.json](../../common/config/rush/version-policies.json)).

---

## Dry-run against local Verdaccio (recommended)

Test the real consumer-install experience before touching npm — entirely local, no npm auth, no
OIDC. `.npmrc-publish` targets **npm**, so point at Verdaccio explicitly with `--registry`:

```bash
# start the local registry
docker compose -f tools/registry/docker-compose.yml up -d

# first time only: create a local user
npm adduser --registry http://localhost:4873

# publish the suite to the LOCAL registry (this is the one time you run rush publish by hand —
# and only ever against localhost)
rush publish --publish --include-all --version-policy yoltra --registry http://localhost:4873

# in a throwaway project outside this repo:
echo '@yoltra:registry=http://localhost:4873/' >> .npmrc
npm add @yoltra/core@0.2.0 @yoltra/react@0.2.0

# tear down (‑v also wipes stored packages)
docker compose -f tools/registry/docker-compose.yml down -v
```

---

## Publishing to npm

**You don't — CI does.** Pushing the `v*.*.*` tag (above) runs
[`release.yml`](../../.github/workflows/release.yml), which runs
`rush publish --publish --include-all --set-access-level public` authenticated by OIDC. There is no
token to set and nothing to run locally.

**Safety:** merging to `main` never publishes (only a tag does); the `production` environment can
gate the run with an approval; and npm rejects republishing an existing version (409), so re-running
the workflow after a partial publish is safe. To retry a publish for an existing tag, re-run the
workflow from the Actions tab (it also has a manual `workflow_dispatch` trigger).

---

## Hotfix (patch on a shipped release)

```bash
git checkout main && git pull
git checkout -b hotfix/v0.2.1

# minimal fix + a patch change file
git commit -m "fix(core): resolve <critical issue>"
rush change                                 # choose "patch"

rush version --bump --override-bump patch   # 0.2.0 → 0.2.1
git add -A && git commit -m "chore(release): v0.2.1"
git push -u origin hotfix/v0.2.1

# PR → main, review, merge, then tag the merge commit to publish:
git checkout main && git pull
git tag v0.2.1 && git push origin v0.2.1
```

---

## Pre-releases (alpha / beta / rc)

The tag-triggered workflow always publishes to the `latest` dist-tag, so pre-releases are **not**
wired into it yet. To ship one:

```bash
rush version --bump --override-bump preminor   # e.g. 0.2.0-0
```

then either **test it in Verdaccio** (above), or publish that single pre-release to npm with a
dist-tag — which currently means extending [`release.yml`](../../.github/workflows/release.yml) to
pass `--tag next` for pre-release tags. Consumers opt in explicitly: `npm add @yoltra/core@next`.

---

## Cheat sheet

```bash
# --- during development (feature branch) ---
rush change                # add a changelog entry for your change
rush change -v             # verify change files exist (CI enforces this)

# --- cut a release (bump on release/next → PR → main) ---
git checkout release/next && git pull
rush version --bump                       # bump the suite + write CHANGELOGs (minor default)
#   fix-only release:  rush version --bump --override-bump patch
git commit -am "chore(release): vX.Y.Z" && git push origin release/next
#   → open/update PR release/next → main, review, merge  (the bump rides this PR)

# --- publish (after the PR merges, tag main; CI does the rest via OIDC) ---
git checkout main && git pull
git tag vX.Y.Z && git push origin vX.Y.Z

# --- optional: dry-run in Verdaccio (local only) ---
docker compose -f tools/registry/docker-compose.yml up -d
rush publish --publish --include-all --version-policy yoltra --registry http://localhost:4873
```
