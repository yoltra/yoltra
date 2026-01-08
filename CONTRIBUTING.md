![Quo.js logo](./assets/logo.svg)

# Contributing to Quo.js

> [ 🇲🇽 Versión en Español](./docs/es/CONTRIBUTING.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](./docs/pt/CONTRIBUTING.md)&nbsp; |
> &nbsp; 👉 [ 🇺🇸 English Version](./CONTRIBUTING.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](./docs/fr/CONTRIBUTING.md)

Thanks for your interest in contributing! 🎉 This project is open-source under **MIT** with a welcoming, lightweight governance model.

- **Code License:** MIT  
- **Docs License:** CC BY 4.0 (unless noted)  
- **Code of Conduct:** Contributor Covenant v2.1  
- **DCO:** Developer Certificate of Origin 1.1 (sign-off required on every commit)

> For the full engineering workflow and release process, see the **Developer Guide**: [./docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md). This file is a quick-start for contributors and PR authors.

## Quickstart (Rush monorepo)

```bash
# install rush once
npm i -g @microsoft/rush

# install all deps (pnpm via Rush)
rush install

# build everything (incremental, uses Rush cache)
rush build

# run tests across the repo
rush test

# lint all packages that define a 'lint' script
rush lint

# focus builds
rush build --to @quojs/core
rush build --from @quojs/react

# work inside a single package
cd packages/quojs
rushx build
rushx test
rushx lint
```

Each publishable package has its own `package.json`. The root is private and **not** published.

## Workflow

1. **Branch** from `main`: `feature/<issue>-<slug>` or `fix/<issue>-<slug>`.
2. **Code** with tests and docs.
3. **Local gates** must pass: `rush build`, `rush test`, `rush lint`.
4. **Change file** (if a publishable package changed):  
   ```bash
   rush change
   ```
5. **Open a Pull Request** (fill template, link issues/RFCs). CI enforces commit style, DCO, change files, tests and coverage.
6. **Review & merge** (squash or rebase per maintainer call).

## Commit Style (Conventional Commits) + DCO (required)

Use the conventional format:

```
type(scope): short summary

body (optional)
```

**Allowed types:** `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `chore`, `revert`

**Examples**
- `feat(quojs): add deep-path wildcard subscriptions`
- `fix(quojs-react): normalize leading dot in useSliceProp`
- `test(store): cover devtools DISPATCH apply state`

**DCO sign-off** — every commit must include a sign-off line:

```
Signed-off-by: Your Name <you@example.com>
```

Tip: use `git commit -s` to append it automatically. Commit messages are linted locally (Husky) and in CI.

## Testing & Coverage

- Test runner: **Vitest**
- UI tests: **@testing-library/react** (for `quojs-react`)
- Coverage thresholds enforced in Vitest config:
  - Lines / Branches / Functions / Statements: **≥ 95%** (on touched code)
- Prefer focused, robust tests; use snapshots only for stable, deterministic outputs.

Run all tests:

```bash
rush test
```

## Linting & Formatting

- Lint: **ESLint** (TypeScript)
- Format: **Prettier**

```bash
rush lint
rushx format
```

## Filing Issues & PRs

- Use the **Bug Report** and **Feature Request** issue templates.
- PRs must follow the **Pull Request template** and include:
  - Conventional commit title + **DCO** sign-off
  - Green local checks: `rush build`, `rush test`, `rush lint`
  - **Change file** if a publishable package changed
  - Adequate tests and docs updates

## Security

If you find a security issue, **do not open a public issue**. Follow **SECURITY.md** for responsible disclosure.

Thanks for contributing! ❤️
