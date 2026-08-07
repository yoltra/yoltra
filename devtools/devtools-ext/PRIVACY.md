# Privacy policy — Yoltra DevTools

**Last updated:** 31 July 2026

## The short version

This extension collects nothing, sends nothing anywhere, and has no servers.

## What it does with data

Yoltra DevTools reads the state and event stream of a Yoltra store running in a page you are
inspecting, and displays them in the DevTools panel. That data reaches the panel one of two ways:

- **Directly**, over a `postMessage` bridge within your own browser, between the page and the
  panel inspecting it. Nothing leaves the machine.
- **Over a local WebSocket** to a DevTools hub you started yourself, normally on `localhost`.
  Where that hub listens is your choice; the extension does not start one.

In both cases the data goes to the panel and nowhere else. There is no telemetry, no analytics,
no crash reporting, no remote endpoint, and no account.

## What it stores

`chrome.storage.local` holds the host and port of the hub you last connected to, so the panel can
reconnect. That is the entire contents. It never leaves your browser and is removed when you
uninstall the extension.

## Permissions, and why each one exists

| Permission | Why |
| --- | --- |
| `storage` | Remembers the hub host and port between sessions. |
| `content_scripts` on `http` and `https` pages | Relays protocol frames between an inspected page and the panel. It reads only messages tagged for this extension and injects nothing else. |
| `background` service worker | Pairs a page with the panel inspecting its tab. It forwards frames and does not read them. |

There are no host permissions beyond the content script, no `tabs` permission, no network access
to any remote origin, and no ability to read pages you are not actively inspecting with the panel
open.

## Sensitive data

Application state can contain personal data, tokens or session material — it is your state, so
only you know. Two things follow:

- Anything the panel displays came from a page you opened DevTools on, and stays on your machine.
- If you connect to a hub, state crosses a local socket. Hubs bind to loopback by default, but
  loopback is not an authentication boundary: other processes on the same machine can reach it.
  On a shared or containerised host, start the hub with an auth token. The agent supports a
  `sanitize` hook for redacting values before they leave the process at all.

## Contact

Questions or reports: https://github.com/yoltra/yoltra/issues
