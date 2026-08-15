# Change Log - @yoltra/devtools-protocol

This log was last generated on Sat, 15 Aug 2026 22:14:53 GMT and should not be manually modified.

## 0.5.0
Sat, 15 Aug 2026 22:14:53 GMT

### Updates

- Names build outputs `.mjs` and `.cjs` instead of `.esm.js` and `.cjs.js`, and adds explicit extensions to the relative specifiers of published declaration files.\n\nNode infers a `.js` file's format from the nearest package.json `type` field, so the `require` condition resolved to a file parsed as ESM and threw `ReferenceError: exports is not defined in ES module scope` on a CommonJS consumer's first line. The declarations had the mirror problem: extensionless relative re-exports do not resolve under `moduleResolution: nodenext`, and because nearly every project sets `skipLibCheck: true` the errors were suppressed while every re-exported symbol silently degraded to `any` — a green build with no completions and no type checking, which is worse than a hard failure because nothing about it looks like one.

## 0.4.0
Fri, 07 Aug 2026 13:15:02 GMT

### Minor changes

- HandshakeRequest carries an optional authToken, and the reconnecting client presents it on every handshake including after a reconnect. Required only by a hub that was started with one.
- Adds encodeStateBounded, which shrinks an encoded value until its serialized form fits a byte budget, and truncated/truncationNote fields on StateSnapshot so a shortened tree can say that it is one. Node count is a poor proxy for bytes — a hundred nodes holding blobs outweigh a hundred thousand holding integers — so the output is measured and the node budget rescaled by how far it overshot. Scaling by the overshoot rather than halving is what makes it converge: from the default hundred thousand nodes, repeated halving needs a dozen rounds to reach the hundreds, and a state that could have been shown in part would have been abandoned instead.
- Adds encodeState and decodeState, a lossless encoding of store state for a JSON wire. JSON.stringify does not fail on the values it cannot represent — it destroys them: a Map or Set becomes {}, a Date becomes a string, undefined disappears from objects, and a BigInt or a cycle throws. Values are now tagged rather than coerced, so Map, Set, Date, RegExp, Error, BigInt, undefined, NaN, the infinities, cycles and shared references all survive a round trip exactly. An application object that happens to carry the marker key is escaped so it decodes unchanged. Functions and symbols have no faithful representation and decode to undefined rather than a placeholder pretending otherwise, with their paths listed in the encode report. Encoding also accepts a sanitize hook, so tokens and personal data can be redacted before state crosses a socket, and a node budget that truncates visibly instead of producing a frame the hub will reject — which reads to a user as a panel that hangs.
- The state codec moves to `@yoltra/core`. It serializes store state, and persistence there needs the same implementation; re-exporting it from here would mean this package depending on core, and it is deliberately a leaf with no dependencies at all. The browser and node agents already peer-depend on core and now import it from there.\n\nCoverage thresholds are re-based as a result. Nothing went untested: a well-covered 400-line module left the package and took its tests with it, leaving `patch-utils` at 96% beside `ws-transport` at 28%. The old numbers were the codec carrying the average, and the gap in `ws-transport` is now visible rather than averaged away.

### Updates

- Coverage is now measured and gated. No package in the devtools suite had a threshold of any kind, so nothing stopped coverage falling; the tooling to measure it was not installed either. Thresholds are set at what is actually met so a regression fails the build, with type declarations and entry points excluded because counting files that compile to nothing measures how much of a package is types rather than how much of its logic is tested. Modules that are genuinely under-tested are left in the numbers rather than excluded — hiding one makes the figure look better and the package no safer.
- Sampling is documented as what it is. The type said implementation was deferred long after both agents had implemented it, so a reader had every reason to believe a working feature did nothing.
- Tests the reconnecting WebSocket client, which every devtools agent depends on to reach the hub and which sat at 28% coverage. The socket arrives through an injected factory — that is what keeps this package free of both the browser `WebSocket` global and the `ws` package — so a driveable fake socket and a fake clock exercise the whole state machine without a network: handshake request and refusal, malformed frames, buffering and in-order flush, exponential backoff with its floor, giving up after the configured attempts, failure to construct a socket at all, and the epoch guard that stops a superseded socket's late close from tearing down its replacement.\n\nCoverage of the module goes from 27.9% to 94.0% and the package from 43.2% to 94.6%, so the thresholds are raised to the new measured floor rather than left at the ones re-based when the state codec moved out and took its coverage with it.

## 0.3.0
Sun, 12 Jul 2026 00:20:57 GMT

_Version update only_

## 0.2.0
Fri, 10 Jul 2026 07:51:29 GMT

### Minor changes

- Initial release: typed devtools message union, versioned handshake, RFC-6902 patch utilities, and a transport-agnostic reconnecting WebSocket client with backpressure signaling.

### Patches

- computePatches and patchesFromChange now escape JSON Pointer segments per RFC 6902 (~ becomes ~0 and / becomes ~1), so a state key containing / or ~ produces a valid pointer. A key containing a literal . still cannot be represented by a dotted path (documented limitation).

