# Change Log - @yoltra/eslint-config-react

This log was last generated on Wed, 19 Aug 2026 05:30:50 GMT and should not be manually modified.

## 0.2.3
Wed, 19 Aug 2026 05:30:50 GMT

### Patches

- Adds a smoke test. A shared ESLint flat config is loaded by every consumer at lint time, so a config that throws on import or resolves to something ESLint cannot read breaks linting everywhere at once, and nothing here could catch that: the package ships one file and had no test script, which `rush test` skipped silently. The test asserts the config loads, is a non-empty array of objects, and declares at least one rule. It is dependency-free on purpose, since adding a test runner and a coverage provider to a one-file package costs more than it returns, and `files` keeps it out of the tarball.

## 0.2.2
Fri, 07 Aug 2026 13:15:02 GMT

### Patches

- Add the repository field to package.json so npm can establish build provenance for published releases.

## 0.2.1
Fri, 10 Jul 2026 07:51:29 GMT

### Patches

- Added a README and a prepublishOnly step that copies the repo LICENSE into the package, so the published tarball actually contains the LICENSE and README declared in files (previously both were listed but missing).

## 0.2.0
Thu, 26 Feb 2026 03:29:58 GMT

### Minor changes

- feat(ESLint): initial release

