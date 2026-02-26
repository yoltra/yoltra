[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / SamplingConfig

# Interface: SamplingConfig

Defined in: [capabilities.ts:15](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L15)

Sampling configuration for event throttling/filtering.

## Remarks

Protocol-level design for v1. Implementation deferred to post-v1.
Configured in the store wrapper and communicated via handshake.
Each rule targets events by composite key (`[channel, type]` tuples).

## Properties

### ignore?

> `optional` **ignore**: `object`[]

Defined in: [capabilities.ts:21](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L21)

Ignore: never send events matching these keys.

#### keys

> **keys**: \[`string`, `string`\][]

***

### skip?

> `optional` **skip**: `object`[]

Defined in: [capabilities.ts:19](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L19)

Skip-N: send every Nth event for specified keys.

#### every

> **every**: `number`

#### keys

> **keys**: \[`string`, `string`\][]

***

### throttle?

> `optional` **throttle**: `object`[]

Defined in: [capabilities.ts:17](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L17)

Throttle: at most 1 update per intervalMs for specified event keys.

#### intervalMs

> **intervalMs**: `number`

#### keys

> **keys**: \[`string`, `string`\][]
