[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / computePatches

# Function: computePatches()

> **computePatches**(`prevState`, `nextState`, `changedPaths`): [`JsonPatch`](../interfaces/JsonPatch.md)[]

Defined in: [patch-utils.ts:70](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/patch-utils.ts#L70)

Converts `detectChangedProps` output (dotted leaf paths) into
RFC 6902 JSON Patch operations.

## Parameters

### prevState

`any`

State before the event.

### nextState

`any`

State after the event.

### changedPaths

`string`[]

Array of dotted leaf paths from `detectChangedProps`.

## Returns

[`JsonPatch`](../interfaces/JsonPatch.md)[]

Array of [JsonPatch](../interfaces/JsonPatch.md) operations describing the state transition.

## Remarks

- Dotted paths like `"counter.value"` become JSON Pointers `"/counter/value"`.
- Determines `add`, `remove`, or `replace` by comparing old/new values at each path.
- Assumes property names do not contain `/` or `~` (safe for Yoltra state shapes).

This is the primary bridge between Yoltra internal change-detection and the
RFC 6902 patch format carried inside [StoreEvent](../interfaces/StoreEvent.md) messages.

## Example

```ts
import { computePatches } from "@yoltra/devtools-protocol";

const prev = { counter: { value: 1 } };
const next = { counter: { value: 2 } };
const patches = computePatches(prev, next, ["counter.value"]);
// [{ op: "replace", path: "/counter/value", value: 2 }]
```
