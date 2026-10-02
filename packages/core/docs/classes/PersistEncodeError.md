![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / PersistEncodeError

# Class: PersistEncodeError

Defined in: [persistence/persist.ts:95](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L95)

What an encode had to give up, reported under the `"encode"` phase.

## Remarks

Two different losses, with two different outcomes. A **truncated** encode (state past
[PersistOptions.maxNodes](../interfaces/PersistOptions.md#maxnodes)) is never written, so `written` is `false` and storage keeps its
previous value. **Unsupported** values (functions, symbols, class instances the codec cannot
represent) are written as markers, so `written` is `true` and `unsupported` names their paths.

## Extends

- `Error`

## Constructors

### Constructor

> **new PersistEncodeError**(`truncated`, `unsupported`, `written`): `PersistEncodeError`

Defined in: [persistence/persist.ts:103](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L103)

#### Parameters

##### truncated

`boolean`

##### unsupported

readonly `string`[]

##### written

`boolean`

#### Returns

`PersistEncodeError`

#### Overrides

`Error.constructor`

## Properties

### truncated

> `readonly` **truncated**: `boolean`

Defined in: [persistence/persist.ts:97](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L97)

The state exceeded the node budget.

***

### unsupported

> `readonly` **unsupported**: readonly `string`[]

Defined in: [persistence/persist.ts:99](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L99)

Paths of values written as markers because they have no faithful representation.

***

### written

> `readonly` **written**: `boolean`

Defined in: [persistence/persist.ts:101](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L101)

Whether anything was written.
