![Yoltra logo](../../assets/yoltra-logo.png)

# Developer Guide

> 👉 English &nbsp;|&nbsp; [🇲🇽 Español](../es/DEVELOPER_GUIDE.md)

Single source of truth for setting up the monorepo, understanding its structure, and doing
day-to-day development work.

For the branching strategy and PR process see [WORKFLOW.md](./WORKFLOW.md). For performing
releases (local + NPM) see [RELEASE_GUIDE.md](./RELEASE_GUIDE.md).

---

## Prerequisites

| Tool    | Version    | Notes                                    |
| ------- | ---------- | ---------------------------------------- |
| Node.js | ≥ 18.18    | [nodejs.org](https://nodejs.org)         |
| Rush    | latest     | `npm install -g @microsoft/rush`         |
| Docker  | any recent | Required only for local registry testing |

> **Do not install pnpm globally.** Rush downloads and manages pnpm internally at the exact
> version pinned in `rush.json`. Running `pnpm install` directly will produce incorrect results
> and break the lockfile.

---

## First-time setup

```bash
# 1. Clone
git clone https://github.com/yoltra/yoltra.git
cd yoltra

# 2. Install all workspace dependencies (Rush manages pnpm)
rush install

# 3. Build the entire monorepo (graph-aware, incremental)
rush build
```

Rush reads the project graph from `rush.json`, installs all packages into the shared
`common/temp/` store, and links them using pnpm workspaces.

---

## Repository structure

```
yoltra/
├── packages/
│   ├── core/                 @yoltra/core      — state container library
│   └── react/                @yoltra/react     — React bindings
│
├── tools/
│   ├── eslint-config-base/   @yoltra/eslint-config-base  — shared ESLint (Node + browser TS)
│   ├── eslint-config-react/  @yoltra/eslint-config-react — shared ESLint (React + TS)
│   └── registry/             Verdaccio local registry (Docker)
│
├── examples/
│   └── v0/
│       ├── yoltra-in-react/        Yoltra vs Redux Toolkit comparison app
│       ├── yoltra-in-nextjs/       Next.js integration example
│       └── yoltra-kinetic-logo/    SVG animation — fine-grained subscription demo
│
├── common/
│   ├── config/rush/          Rush config files (committed — never edit lockfile by hand)
│   └── scripts/              Shared helpers (copy-license.cjs, etc.)
│
└── docs/
    ├── en/                   English documentation (this folder)
    └── es/                   Spanish translations
```

---

## Everyday commands

### Monorepo-wide

```bash
rush install            # Install / sync all dependencies (after cloning or pulling)
rush update             # Regenerate lockfile (run after editing any package.json)
rush build              # Incremental build — uses cache, skips unchanged packages
rush rebuild            # Force full rebuild — bypasses cache, rebuilds everything
rush test               # Run Vitest across all packages
rush lint               # Run ESLint across all packages
rush typecheck          # Run tsc --noEmit across all packages
```

### Focused builds

Use `--to` and `--from` to narrow the build to a subset of the dependency graph:

```bash
rush build --to @yoltra/core           # Build core and its transitive deps
rush build --to @yoltra/react          # Build react (and core first)
rush build --from @yoltra/core         # Build core and every downstream dependent
rush build --to @yoltra/react --verbose  # Same, with detailed output
```

### Per-package commands (rushx)

`rushx` runs an npm script in the **current** package. Change to the package directory first:

```bash
cd packages/core
rushx build         # Build just this package
rushx test          # Run tests with coverage
rushx lint          # Check for lint errors
rushx lint:fix      # Auto-fix lint issues
rushx typecheck     # TypeScript type checking

cd packages/react
rushx build
rushx test
rushx docs          # Generate TypeDoc API docs
```

---

## Build cache

Rush's local build cache is enabled via `common/config/rush/build-cache.json`.

Each library package declares its cacheable output in `rush-project.json`:

```json
{
  "operationSettings": [{ "operationName": "build", "outputFolderNames": ["dist"] }]
}
```

**Key rules:**

- `rush build` — reads and writes the cache; unchanged packages finish instantly.
- `rush rebuild` — **always skips the cache**; use this when you suspect a stale output.
- Cache lives in `common/temp/build-cache/` (gitignored, local only).

---

## ESLint architecture

Lint configuration is extracted into two shareable packages under `tools/`:

| Package                       | Target packages | Includes                                                                  |
| ----------------------------- | --------------- | ------------------------------------------------------------------------- |
| `@yoltra/eslint-config-base`  | `@yoltra/core`  | ESLint recommended, typescript-eslint recommended, browser + Node globals |
| `@yoltra/eslint-config-react` | `@yoltra/react` | Extends base + react-hooks + react-refresh                                |

Each library package has a thin `eslint.config.mjs` that just re-exports the shared config:

```js
// packages/core/eslint.config.mjs
import baseConfig from "@yoltra/eslint-config-base";
export default baseConfig;
```

```js
// packages/react/eslint.config.mjs
import reactConfig from "@yoltra/eslint-config-react";
export default reactConfig;
```

**To add a rule globally** — edit the config package in `tools/`. No need to touch each
library's `eslint.config.mjs`. **To override a rule for one package** — extend the array in that
package's `eslint.config.mjs`.

---

## Conventional commits + DCO

Every commit must:

1. Follow **Conventional Commits**:

   ```
   <type>(<scope>): <short description>

   [optional body]

   Signed-off-by: Your Name <you@example.com>
   ```

2. Carry a **DCO sign-off** (`git commit -s` appends it automatically).

Allowed `<type>` values: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `chore`,
`revert`.

---

## Testing & coverage

- Runner: **Vitest**
- UI helpers: `@testing-library/react` (for `@yoltra/react`)
- Minimum coverage thresholds (lines / branches / functions / statements): **95%**

```bash
# All packages
rush test

# Single package
cd packages/core && rushx test
```

Snapshot tests are only allowed for stable, deterministic output.

---

## Change files (required for every publishable PR)

Any PR that modifies `@yoltra/core`, `@yoltra/react`, or a published `tools/` package **must**
include a Rush change file. CI will reject PRs that are missing one.

```bash
# Interactive prompt — select the packages you changed and the bump type
rush change

# Verify a change file exists (CI runs this on every PR)
rush change -v
```

Change files are committed to `common/changes/` alongside the code change. When a release is
prepared they are consumed by `rush version --bump` to update `package.json` versions and
generate `CHANGELOG.md` entries.

> While the project is `< 1.0.0`: use `minor` for breaking changes and `patch` for fixes.

---

## Adding a new publishable package

1. Create the folder under `packages/` or `tools/`.
2. Add a `package.json` with `"publishConfig": { "access": "public" }`.
3. Add a minimal `rush-project.json` (declare `outputFolderNames` if the package builds).
4. Register the package in `rush.json` under `"projects"`.
5. Run `rush update` to regenerate the lockfile.
6. Assign it to the `"lockstep"` version policy (if it ships in sync with core/react) or leave
   `versionPolicyName` unset for independent versioning.

---

## Updating dependencies

1. Edit the relevant `package.json`.
2. Run `rush update` to recalculate and rewrite the lockfile.
3. Commit both the `package.json` change and the updated `common/config/rush/pnpm-lock.yaml`.

Never touch `common/config/rush/pnpm-lock.yaml` by hand.

---

## Troubleshooting

| Symptom                              | Fix                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| CI rejects PR: "missing change file" | `rush change`, commit the file in `common/changes/`.                                        |
| `rush install` peer dep errors       | `strictPeerDependencies: false` is already set; try `rush install --purge`.                 |
| Commit rejected                      | Ensure Conventional Commits format + DCO sign-off (`git commit -s`).                        |
| Stale build output                   | `rush rebuild` bypasses cache and forces a full recompile.                                  |
| Verdaccio: "version already exists"  | Bump version (`rush change` + `rush version --bump`) or wipe with `docker compose down -v`. |
| `rushx` not found                    | `npm install -g @microsoft/rush`                                                            |
| Wrong pnpm version in lockfile       | Never run `pnpm install` directly; always use `rush install` / `rush update`.               |
