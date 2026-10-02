![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Diagnostic

# Interface: Diagnostic

Defined in: [types.ts:700](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L700)

Something a store has to say: a failure it contained, a refusal, or a development warning.

## Remarks

`code` is stable, for a program; `message` is for a person and may be reworded. `detail` holds
the values involved, such as `event`, `error` and `slice`, so a sink can forward them without
parsing the message.

## Properties

### code

> `readonly` **code**: [`DiagnosticCode`](../type-aliases/DiagnosticCode.md)

Defined in: [types.ts:704](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L704)

What happened, stably. See [DiagnosticCode](../type-aliases/DiagnosticCode.md).

***

### detail?

> `readonly` `optional` **detail**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [types.ts:708](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L708)

The values involved.

***

### level

> `readonly` **level**: `"info"` \| `"warn"` \| `"error"`

Defined in: [types.ts:702](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L702)

How serious it is. A sink that also accepts other levels is still accepted.

***

### message

> `readonly` **message**: `string`

Defined in: [types.ts:706](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L706)

A sentence for a person. May be reworded between versions; route on `code`.
