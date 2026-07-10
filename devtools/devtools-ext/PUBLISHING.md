# Publishing — Yoltra DevTools (Chrome Web Store)

Everything needed to ship `@yoltra/devtools-ext` to the Chrome Web Store. This
extension is **not** on the npm/Rush version track (`shouldPublish: false`); it
versions on its own line in [`public/manifest.json`](public/manifest.json).

## Build the store artifact

```bash
cd devtools/devtools-ext
pnpm package        # builds dist/ then zips it → store/yoltra-devtools-<version>.zip
```

`pnpm package` = `pnpm build && node scripts/pack-extension.mjs`. The zip has
`manifest.json` at its root (Web Store requirement) and lands in `store/`
(gitignored). Zero extra dependencies — it shells out to the system `zip`.

## Version bumps

The Web Store **rejects an upload whose version isn't higher than the live one.**
Before each release, bump `version` in **both** `public/manifest.json` (the store
source of truth) and `package.json` (kept in sync for tidiness), then re-run
`pnpm package`. This is independent of `rush version --bump` — the suite's bump
never touches this package.

## First publish (manual — one time)

The first upload must be manual: it creates the listing and mints the extension
ID that any later automation needs.

1. **Developer account** — one-time US$5 registration at
   <https://chrome.google.com/webstore/devconsole> (done ✅).
2. **New item → Upload** `store/yoltra-devtools-<version>.zip`.
3. Fill the **store listing** (copy below), **privacy** answers, and
   **distribution** (public, category *Developer Tools*).
4. **Submit for review.** First review typically takes a few days.
5. After approval, copy the **extension ID** from the console — needed to wire CI
   later.

## Store listing copy (draft)

- **Name:** Yoltra DevTools
- **Summary (≤132):** Inspect Yoltra state — event timeline, state tree,
  subscriptions, time-travel, and metrics, right in DevTools.
- **Category:** Developer Tools
- **Language:** English (add Spanish later — the UI is bilingual-ready)
- **Description:**

  > Yoltra DevTools adds a panel to Chrome DevTools for apps built with the
  > [Yoltra](https://yoltra.dev) state library. Inspect the live state tree,
  > watch the event timeline, see which components subscribe to which paths,
  > scrub through time-travel history, emit events, and read performance metrics.
  >
  > Your app opts in by instrumenting a store with `withDevtools()`, which
  > connects to the DevTools hub; the panel connects to the same hub and mirrors
  > the store. Learn more at https://yoltra.dev.

- **Assets:**
  - Store icon **128×128** — `public/icons/logo-128.png` ✅
  - Screenshots **1280×800** (or 640×400), 1–5 required — **TODO: capture** the
    panel running against the `yoltra-mission-control` example (load the unpacked
    `dist/`, open DevTools → *Yoltra* panel).
  - Small promo tile 440×280 — optional, defer.

## Privacy & compliance (console form)

- **Single purpose:** "A DevTools panel for inspecting Yoltra application state
  during development."
- **Permission justification — `storage`:** "Persists the developer's panel
  preferences (e.g. selected tab, layout) locally via `chrome.storage`."
- **Host / remote code:** none. No `host_permissions`, no remotely-hosted code;
  everything ships in the package.
- **Data usage:** the extension does **not** collect, transmit, or sell user
  data. It reads the inspected app's state locally through the DevTools hub. Tick
  "does not collect user data"; no external privacy-policy URL is required for
  that declaration (a `yoltra.dev/privacy` page is still nice-to-have).

## Later: automate publishing (optional)

Once the listing exists and you have the extension ID, a tag can auto-publish via
the Chrome Web Store API (`chrome-webstore-upload-cli`), driven by a GitHub
Action. It needs repo secrets: `EXTENSION_ID`, OAuth `CLIENT_ID` / `CLIENT_SECRET`
/ `REFRESH_TOKEN`. Deferred until after the first manual release. Note: adding the
CLI is a devDependency, so wire it in a dedicated change (touches the lockfile).

## Firefox (AMO) — later

The manifest is MV3 and Firefox-compatible, but AMO needs a
`browser_specific_settings.gecko.id`. Add that + a separate `pnpm package:firefox`
when you target AMO.
