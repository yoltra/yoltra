![Quo.js logo](./assets/logo.svg)

# Quo.js Governance

> [ 🇲🇽 Versión en Español](./docs/es/GOVERNANCE.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](./docs/pt/GOVERNANCE.md)&nbsp; |
> &nbsp; 👉 [ 🇺🇸 English Version](./GOVERNANCE.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](./docs/fr/GOVERNANCE.md)

This document explains how decisions are made and how contributors become maintainers.

## Roles

- **Contributors**: Anyone sending PRs, issues, or docs.  
- **Maintainers**: Trusted contributors with merge rights to one or more packages.  
- **Lead Maintainer**: Coordinates roadmap and releases (initially **@pixerael / Erael Group.**).

A list of current maintainers is kept in [MAINTAINERS.md](./MAINTAINERS.md) (if present) or in the GitHub org/team.

## Decision Making

We aim for **lazy consensus**:
1. Propose change via PR or RFC (for substantial API changes).
2. Maintain a short discussion window (typically 3–7 days for RFCs).
3. If no well-reasoned objections, the proposal is accepted.

If consensus can’t be reached, the **Lead Maintainer** (or delegated maintainer for the package) decides.

## RFCs

Use an RFC when:
- Changing public APIs or behavior incompatibly.
- Introducing major dependencies or architectural changes.
- Proposing new core packages.

RFC template:
- Motivation & goals
- Design & alternatives
- API sketch & examples
- Migration plan & risks
- Test strategy

## Releases & Versioning

- Versioning follows **SemVer**.
- Each package is versioned independently.
- The **Release Manager** (rotating among maintainers) prepares changelogs and tags.
- Breaking changes require:
  - An RFC or clear justification
  - Migration notes in the changelog
  - Tests demonstrating the change

## Maintainer Expectations

- Be respectful and follow the **Code of Conduct**.
- Review PRs promptly and constructively.
- Maintain high test coverage and docs quality.
- Disclose conflicts of interest.

## Adding/Removing Maintainers

- **Nomination**: Any maintainer may nominate a contributor.
- **Criteria**: Consistent quality contributions (code/docs/reviews), good communication, shared project values.
- **Approval**: Lazy consensus among maintainers. The Lead Maintainer confirms access changes.
- **Inactivity**: Maintainers inactive for ~6 months may be moved to “alumni” status (can return later).

## Trademarks & Branding

The names “Quo.js” and “quojs-react” are trademarks of Erael Group. See [TRADEMARKS.md](./TRADEMARKS.md). Governance does not imply a trademark license.

## Changes to Governance

Governance changes follow the RFC process and require explicit approval by the Lead Maintainer.
