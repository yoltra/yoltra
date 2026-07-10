# Releasing Yoltra

Yoltra publishes as a **lock-step suite**: `@yoltra/core`, `@yoltra/react`, and
the `@yoltra/devtools-*` libraries always share one version and are published
together (see the `yoltra` policy in
[`common/config/rush/version-policies.json`](./common/config/rush/version-policies.json)).
`@yoltra/devtools-ext` (the browser-extension app) and the `eslint-config-*`
tools are versioned independently.

This file is the **operational quick reference** (how publishing is wired + the
one-time OIDC setup). For the full versioning walkthrough — change files,
changelogs, the release-branch PR, hotfixes, pre-releases, and Verdaccio dry
runs — see **[docs/en/RELEASE_GUIDE.md](./docs/en/RELEASE_GUIDE.md)**.

Publishing is a two-step split:

- **You** (locally) bump versions, generate CHANGELOGs, commit, and push a tag.
- **CI** ([`.github/workflows/release.yml`](./.github/workflows/release.yml))
  builds and publishes to npm when the tag lands. It never bumps versions, so
  npm can't receive a half-versioned or unbuilt release.

## One-time setup

Publishing uses **npm [Trusted Publishers](https://docs.npmjs.com/trusted-publishers)
(OIDC)** — no long-lived `NPM_TOKEN` secret. The release job authenticates with
a short-lived OIDC token minted by GitHub, so the only setup is on npm's side:

1. An npm account with publish rights to the **`@yoltra`** organization.
2. For **each** publishable `@yoltra/*` package, add a **Trusted Publisher** on
   npmjs.com (package → *Settings → Trusted Publisher*, or the org settings)
   with:
   - **Repository:** `yoltra/yoltra`
   - **Workflow filename:** `release.yml`
   - **Environment:** `production` — matched by `environment: production` on the
     `publish` job in [`release.yml`](./.github/workflows/release.yml).

   If the GitHub `production` environment has protection rules (required
   reviewers, wait timer, or restricted deployment branches/tags), they apply to
   the release job: an approval gate will pause the publish until approved, and a
   branch/tag restriction must allow the `v*.*.*` tags (or "All branches") or the
   job won't run.

   npm lets you pre-register a Trusted Publisher for a name that has never been
   published, so the devtools packages can be configured before their first
   release.

The workflow already grants `permissions: id-token: write` and upgrades npm to
a version that supports OIDC + provenance — nothing to configure in the repo.

## Every release

Change files travel with the feature work and the `release/next → main` PR; the
**version bump happens on `main` after the merge**, then is pushed with the tag.
You never bump on a branch that CI runs `rush change --verify` against — the bump
consumes the change files that check requires, so it would fail the PR.

1. **Merge the `release/next → main` PR** (features + change files, no bump). CI is
   green because every changed publishable package still has its change file.

2. **On `main`, bump versions + write CHANGELOGs.** This applies the change files,
   moves the lock-step version per the policy's `nextBump` (currently `minor`,
   e.g. `0.1.0 → 0.2.0`), bumps `@yoltra/ds` per its own policy, updates each
   `CHANGELOG.md`, and deletes the consumed change files (no git operations —
   files only):

   ```sh
   git checkout main && git pull
   rush version --bump
   ```

   To hold the suite on a patch release instead, use
   `rush version --bump --override-bump patch`.

3. **Review** the version changes and generated CHANGELOGs, then **commit and tag
   on `main`** — the tag (matching `v*.*.*`) triggers the workflow:

   ```sh
   git commit -am "chore(release): v0.2.0"
   git tag v0.2.0
   git push origin main --follow-tags
   ```

   > `main` is unprotected, so the bump lands directly. If it ever becomes
   > protected, either push the bump via an admin-merge that skips the verify
   > check, or exempt the release commit from `rush change --verify`.

4. **Watch the Release workflow.** On success, every `shouldPublish` package is
   live on npm at the new version. Re-run the workflow (`workflow_dispatch`) if
   a transient publish step fails.

## Verifying a release

```sh
npm view @yoltra/core version
npm view @yoltra/devtools-storeview version
```

Both should report the version you just tagged.

## Notes

- `rush publish --include-all` publishes **all** publishable projects at their
  current `package.json` versions — so build (`rush build`) must succeed first;
  CI does this before publishing.
- Republishing an already-published version fails (npm is immutable). Bump and
  tag a new version instead.
- The extension (`@yoltra/devtools-ext`, `shouldPublish: false`) is not part of
  the npm release; it ships to the browser stores separately.
