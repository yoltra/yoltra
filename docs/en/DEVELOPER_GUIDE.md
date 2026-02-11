![Quo.js logo](../../assets/logo.svg)

# Developer Guide (Quo.js Monorepo)

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/DEVELOPER_GUIDE.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/DEVELOPER_GUIDE.md)&nbsp; |
> &nbsp; 👉 [ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/docs/en/DEVELOPER_GUIDE.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/DEVELOPER_GUIDE.md)

Single source of truth for SDLC, local setup, branching, testing/coverage, and releases using
**Rush + PNPM**.

## SDLC (how we ship)

1. Plan → open/triage an Issue (bug/feat).
2. Branch → `feature/<issue>-<slug>` or `fix/<issue>-<slug>`.
3. Code → tests + docs; **Conventional Commits** with **DCO** sign-off.
4. Local gates → `rush build` and `rush test` pass; coverage ≥ thresholds.
5. PR → fill PR template; link issues; CI must be green (**change files** verified).
6. Review → approvals; squash or rebase per maintainer call.
7. Release → maintainers run `rush version` then `rush publish` (see “Releases” below).

## Local setup

Install Rush (one-time):

```bash
npm i -g @microsoft/rush
```

Install deps (deterministic via PNPM + Rush):

```bash
rush install
```

Build everything (graph-aware, incremental; uses Rush build cache):

```bash
rush build
```

Run tests for all packages (defined via command-line.json):

```bash
rush test
```

Lint all packages that define a "lint" script:

```bash
rush lint
```

Focus builds:

```bash
rush build --to @quojs/core
rush build --from @quojs/react
```

Package-level work:

```bash
cd packages/core

rushx build
rushx test
rushx lint
```

## Branching strategy

- Default branch: `main`.
- Work happens on `feature/*` or `fix/*` branches.
- Open PRs against `main`.
- Every PR that changes a publishable package must include a **change file** (see “Changes &
  Versioning”).

## Conventional commits + DCO (enforced)

Every commit must:

- follow **Conventional Commits** (linted locally via Husky and in CI), and
- include a **DCO sign-off** line, for example:

```
Signed-off-by: Your Name <you@example.com>
```

> Tip: use `git commit -s` to append the DCO line automatically.

Allowed types:

- `feat`
- `fix`
- `perf`
- `refactor`
- `docs`
- `test`
- `build`
- `chore`
- `revert`

## Testing & coverage

- Test runner: **Vitest**.
- UI tests: **@testing-library/react** (for `quojs-react`).
- Coverage thresholds are enforced in Vitest config:
  - Lines / Branches / Functions / Statements: **≥ 95%** (on touched code).
- Snapshots only for stable, deterministic outputs.

Run:

```bash
rush test
```

## Linting & formatting

- ESLint (TypeScript), Prettier.
- Per-package scripts run via `rushx`.

Examples:

```bash
rush lint
cd packages/react && rushx lint
rushx format
```

## Build cache (Rush)

The repo enables the Rush **local** build cache. Cache config lives at:

- Repo-level: `common/config/rush/build-cache.json`
- Per package outputs: `packages/<name>/config/rush-project.json`

Outputs are cached from `dist/` for both core packages. For `@quojs/core`, the cache key also
includes `BUILD_TARGET`.

Notes:

- `rush build` will read/write cache.
- `rush rebuild` **bypasses** cache and recompiles from scratch (by design).

## Changes & versioning (Rush)

### Change files

Create change entries in `common/changes/`:

```bash
rush change
```

CI verifies change files on PRs:

```bash
rush change -v
```

### Version policies

- `quojs-lockstep` (lockStepVersion): keeps **@quojs/core** and **@quojs/react** in sync.
- `lib-individual` (individualVersion): reserved for future adapters not tied to core cadence.

Projects are assigned in `rush.json` via `versionPolicyName`.

## Releases

### Official release (maintainers)

1. Bump versions/changelogs from accumulated change files:

```bash
rush version
```

2. Publish to the real registry (example flags; add OTP/access as required):

```bash
rush publish --apply --publish --target-branch main
```

> Tip: run `rush publish` with no flags to dry-run the plan.

### Local release rehearsal (Verdaccio)

We support two safe rehearsal styles:

#### A) Tarball-only dry run (no registry)

Produces `.tgz` files for every public package under `./dist-tarballs/`.

```bash
rush change
rush publish --include-all --pack --release-folder ./dist-tarballs
```

Consume in apps:

```bash
pnpm add ./dist-tarballs/quojs-core-<ver>.tgz
pnpm add ./dist-tarballs/quojs-quojs-react-<ver>.tgz
```

#### B) Full local registry publish (Verdaccio)

We use **Verdaccio** to mimic a registry and test the install flow exactly as real consumers
would.

1. Start Verdaccio:

```bash
docker compose -f ops/verdaccio/docker-compose.yml up -d
```

2. Authenticate once:

```bash
pnpm set registry http://localhost:4873/
pnpm adduser --registry http://localhost:4873/
pnpm profile set password --registry http://localhost:4873/
```

3. Run the publish script:

```bash
common/scripts/publish-verdaccio.sh
```

What it does:

- Publishes all `@quojs/*` packages (except internal ones like `@quojs/repo-tools`)
- Uses the **exact versions** from `package.json` (no `-local` suffix, no dist-tags)
- Disables scripts and provenance to avoid husky/prepack failures
- Leaves Git untouched — this is a **local rehearsal only**

4. Consume the packages in your apps:

```bash
echo '@quojs/:registry=http://localhost:4873/' >> .npmrc
pnpm add @quojs/core@<version> @quojs/react@<version>
```

> Use the real version numbers (e.g. `0.1.0`) as they are in `package.json`.

5. Reset registry:

```bash
docker compose -f ops/verdaccio/docker-compose.yml down -v
unset npm_config_registry
```

### Notes

- Registries don’t allow republishing the same version; bump patch for repeat rehearsals or wipe
  Verdaccio storage.
- Install-time registry defaults to npmjs via `common/config/rush/.npmrc`.
- Publish-time registry is Verdaccio via `common/config/rush/.npmrc-publish` using
  `${NPM_AUTH_TOKEN}`.

## Filing bugs and PRs (GitHub)

- Use the **Bug Report** and **Feature Request** issue templates.
- PRs must follow the **Pull Request template**.

Minimum PR checklist:

- Conventional commit + DCO sign-off
- `rush build` and `rush test` pass locally
- Change file added (if publishable package changed)
- Coverage meets thresholds (CI will fail otherwise)

## Security

See [SECURITY](../SECURITY.md). Do **not** open public issues for vulnerabilities.

## Troubleshooting (fast answers)

- Missing change file → run `rush change`; CI also checks `rush change -v`.
- Commit rejected locally → fix commit message to meet Conventional Commits and add DCO line; or
  use `git commit -s`.
- Cache seems stale → remember `rush rebuild` ignores cache; use `rush build` to benefit from
  cache.
- Verdaccio “version already exists” → bump version (via `rush change` + `rush version`) or wipe
  Verdaccio storage.
- Installs unexpectedly hitting Verdaccio → ensure you didn’t export `npm_config_registry`;
  remove any per-project `.npmrc` overrides.

## Editor & DX tips

- Recommended VS Code extensions are in `.vscode/extensions.json`.
- Formatting is standardized via `.prettierrc.json` and `.editorconfig`.
- TypeScript project references are configured to improve IDE nav and builds.
