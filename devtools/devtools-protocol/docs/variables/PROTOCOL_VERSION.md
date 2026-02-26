[**@yoltra/devtools-protocol**](../README.md)

---

[@yoltra/devtools-protocol](../README.md) / PROTOCOL_VERSION

# Variable: PROTOCOL_VERSION

> `const` **PROTOCOL_VERSION**: `"0.1.0"` = `"0.1.0"`

Defined in:
[version.ts:27](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/version.ts#L27)

Protocol version following semver.

## Remarks

Used during the [HandshakeRequest](../interfaces/HandshakeRequest.md) to negotiate compatible
features between hub, stores, and extensions. The hub compares major versions and rejects
connections with an incompatible major version.

## Example

```ts
import { PROTOCOL_VERSION } from "@yoltra/devtools-protocol";

const handshake: HandshakeRequest = {
  type: "HANDSHAKE_REQUEST",
  protocolVersion: PROTOCOL_VERSION,
  role: DevtoolsRole.STORE,
  // ...
};
```
