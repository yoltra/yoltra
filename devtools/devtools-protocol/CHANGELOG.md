# Change Log - @yoltra/devtools-protocol

This log was last generated on Fri, 10 Jul 2026 07:51:29 GMT and should not be manually modified.

## 0.2.0
Fri, 10 Jul 2026 07:51:29 GMT

### Minor changes

- Initial release: typed devtools message union, versioned handshake, RFC-6902 patch utilities, and a transport-agnostic reconnecting WebSocket client with backpressure signaling.

### Patches

- computePatches and patchesFromChange now escape JSON Pointer segments per RFC 6902 (~ becomes ~0 and / becomes ~1), so a state key containing / or ~ produces a valid pointer. A key containing a literal . still cannot be represented by a dotted path (documented limitation).

