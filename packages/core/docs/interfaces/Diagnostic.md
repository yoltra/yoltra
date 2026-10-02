![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Diagnostic

# Interface: Diagnostic

Defined in: [types.ts:638](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L638)

Something a store has to say: a failure it contained, a refusal, or a development warning.

## Remarks

`code` is stable, for a program; `message` is for a person and may be reworded. `detail` holds
the values involved, such as `event`, `error` and `slice`, so a sink can forward them without
parsing the message.

## Properties

### code

> `readonly` **code**: [`DiagnosticCode`](../type-aliases/DiagnosticCode.md)

Defined in: [types.ts:642](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L642)

What happened, stably. See [DiagnosticCode](../type-aliases/DiagnosticCode.md).

***

### detail?

> `readonly` `optional` **detail**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [types.ts:646](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L646)

The values involved.

***

### level

> `readonly` **level**: `"info"` \| `"warn"` \| `"error"`

Defined in: [types.ts:640](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L640)

How serious it is. A sink that also accepts other levels is still accepted.

***

### message

> `readonly` **message**: `string`

Defined in: [types.ts:644](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L644)

A sentence for a person. May be reworded between versions; route on `code`.
