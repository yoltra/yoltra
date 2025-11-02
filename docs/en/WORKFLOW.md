![Quo.js logo](../../assets/logo.svg)

# Ongoing Workflow (Independent Versions)

> [ 🇲🇽 Versión en Español](../es/WORKFLOW.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](../pt/WORKFLOW.md)&nbsp; | &nbsp; 👉
> [ 🇺🇸 English Version](./WORKFLOW.md)&nbsp; | &nbsp;[ 🇫🇷 Version française](../fr/WORKFLOW.md)

This document describes the ongoing development and release workflow for Quo.js packages using
**independent versioning** in a Rush monorepo.

## Day-to-day development

- **Feature/fix branch** off `main`:
  - Example branch names:
    - `feat(core): ...`
    - `fix(react): ...`
  - Generate change file(s):
    ```bash
    rush change -v
    ```
    - Pick **patch** for fixes.
    - Pick **minor** for new features.
    - Pick **minor** for breaking changes (while `<1.0.0`, treat all breaking changes as minor).
  - Open a PR → merge after review.

## TypeDoc Workflow Guide

Keeping our documentation in sync with the codebase is essential for clarity, onboarding, and
API reference generation. Follow these steps whenever you modify or add code:

1. Document Your Code

After completing your implementation, ensure all new or updated code includes TypeDoc
annotations such as @param, @returns, and @example. These annotations are critical because
they’re what the documentation generator uses to extract comments, types, and examples into the
Markdown output.

2. Generate Documentation

Run the Rush command to rebuild the documentation.

```bash
  rushx:docs
```

This will invoke TypeDoc and regenerate all
Markdown files from your annotations.

3. Review the Output

Open the generated Markdown files and confirm that your latest changes appear correctly. Verify
that new functions, classes, and properties are listed, that descriptions and examples match
your updates, and that no outdated sections remain.

4. Commit the Docs

Once everything looks correct, commit the generated documentation using a Conventional Commit
message with the "docs" type. This keeps our history clear and helps CI/CD workflows trigger
correctly.

## Version & publish cycle

Can be manual or automated in CI:

```bash
rush version --ensure-version-policy
rush publish --publish --apply --target-branch main
```

- Only packages with change files get bumped.
- Unchanged packages remain at their current version.

## Breaking changes in `@quojs/core`

- Bump **minor** of core (e.g., `0.2.x → 0.3.0`).
- Update adapters you validated to:

  ```json
  "peerDependencies": {
    "@quojs/core": "^0.3.0"
  }
  ```

- Generate change files for those adapters (patch or minor, depending on scope).
- Publish only the adapters that you’ve verified.
- **Do not bump adapters you haven’t validated yet**; consumers’ peer checks will protect them.

## Pre-releases

- For risky or experimental work, publish prereleases:
  ```bash
  0.2.0-alpha.0
  ```
  with `--tag next` (to npm) or publish into Verdaccio.
- Adapters can adopt the new peer range incrementally at their own pace.
