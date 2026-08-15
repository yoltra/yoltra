![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / PROTOCOL\_VERSION

# Variable: PROTOCOL\_VERSION

> `const` **PROTOCOL\_VERSION**: `"0.1.0"` = `"0.1.0"`

Defined in: [version.ts:27](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/version.ts#L27)

Protocol version following semver.

## Remarks

Used during the [HandshakeRequest](../interfaces/HandshakeRequest.md) to negotiate compatible features
between hub, stores, and extensions. The hub compares major versions and
rejects connections with an incompatible major version.

## Example

```ts
import { PROTOCOL_VERSION } from '@yoltra/devtools-protocol';

const handshake: HandshakeRequest = {
  type: 'HANDSHAKE_REQUEST',
  protocolVersion: PROTOCOL_VERSION,
  role: DevtoolsRole.STORE,
  // ...
};
```
