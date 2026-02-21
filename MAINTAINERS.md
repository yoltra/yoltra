![Yoltra logo](./assets/yoltra-logo.png)

# MAINTAINERS

> [ 🇲🇽 Versión en Español](../es/MAINTAINERS.md)&nbsp; |
> &nbsp; 👉 [ 🇺🇸 English Version](../../MAINTAINERS.md)&nbsp; |

This file lists active maintainers and areas of responsibility for the Yoltra monorepo.

- **Lead Maintainer:** Manu Ramirez (@pixerael), Erael Group.
- **Project Email:** [opensource@yoltra.dev](mailto:opensource@yoltra.dev)
- **Security Contact:** security@yoltra.dev (see [SECURITY.md](./SECURITY.md))
- **Code of Conduct:** [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

> Maintainers are expected to follow the workflows in `GOVERNANCE.md` and `CONTRIBUTING.md`.

## Current Maintainers

| GitHub Handle | Name         | Area(s)                                   | Notes                        |
|---------------|--------------|-------------------------------------------|------------------------------|
| @pixerael     | Manu Ramirez | Overall, releases, trademarks             | Acting owner for all packages|

### Open Maintainer Seats

We’re inviting community maintainers for the roles below. See **Becoming a Maintainer**.

| Role ID        | Area(s)                                     | Time Expectation     | Status  |
|----------------|---------------------------------------------|----------------------|---------|
| @co-maintainer | yoltra core (store/reducer/bus/utils)          | ~2–4 hrs/week        | **OPEN**|
| @react-maint   | yoltra-react (hooks, suspense, docs/examples)  | ~2–4 hrs/week        | **OPEN**|

## Package Ownership

| Package / Path           | Owners                                     |
|--------------------------|--------------------------------------------|
| `packages/core`          | @pixerael (acting), **@co-maintainer (OPEN)** |
| `packages/react`         | @pixerael (acting), **@react-maint (OPEN)**   |
| `examples/*`             | @pixerael (acting), **@react-maint (OPEN)**   |
| `docs/*`                 | @pixerael (acting), **@react-maint (OPEN)**   |

> Until seats are filled, @pixerael is the acting owner and final reviewer.

## Release Management

- **Rotation:** Owners rotate the “Release Manager” role per minor release.
- **Duties:** changelog, version bumps, tags, GitHub release notes, npm publish (if applicable).
- **SemVer:** required. Breaking changes need migration notes and (usually) an RFC.

## Becoming a Maintainer

We welcome applications for the **@co-maintainer** and **@react-maint** seats.

**Eligibility (indicative):**
- Sustained, high-quality contributions (code/docs/reviews) to the relevant area.
- Constructive collaboration aligned with the Code of Conduct.
- Familiarity with the project’s architecture and roadmap.

**How to apply:**
1. Open a GitHub Discussion titled **“Maintainer Application: \<role\> – \<your handle\>”**.
2. Include:
   - Your background and timezone
   - Relevant OSS experience / links
   - Areas you’d like to own / improve
   - Availability estimate
3. Get community feedback (lazy consensus for 5 days).
4. A current maintainer (Lead or acting owner) will confirm the appointment per `GOVERNANCE.md`.

**Expectations:**
- Triage issues, review PRs, and help with releases.
- Attend (or async-review) monthly planning notes.
- Adhere to `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and `SECURITY.md`.

## Inactive / Alumni

Maintainers inactive for ~6 months may be moved to **Alumni** status and can be reinstated later upon request.

## Escalation

If consensus can’t be reached on a technical decision, the **Lead Maintainer** decides (or delegates to the package owner). Governance changes follow RFC.
