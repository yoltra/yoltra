![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / patchesFromChange

# Function: patchesFromChange()

> **patchesFromChange**(`changedPaths`, `prevValues`, `nextValues`): [`JsonPatch`](../interfaces/JsonPatch.md)[]

Defined in: [patch-utils.ts:110](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/patch-utils.ts#L110)

Builds RFC 6902 JSON Patch operations directly from a core
`InstrumentedEvent`: the changed dotted leaf paths plus their old/new values.

## Parameters

### changedPaths

`string`[]

Dotted leaf paths that changed (slice-prefixed).

### prevValues

`Record`\<`string`, `unknown`\>

Old value at each changed path, keyed by path.

### nextValues

`Record`\<`string`, `unknown`\>

New value at each changed path, keyed by path.

## Returns

[`JsonPatch`](../interfaces/JsonPatch.md)[]

Array of [JsonPatch](../interfaces/JsonPatch.md) operations describing the state transition.

## Remarks

This is the preferred bridge now that the core reports exact changed paths and
values per event — no full-state diff or clone is required. Op is chosen per
path the same way as [computePatches](computePatches.md). Keys containing `/` or `~` are
escaped per RFC 6902; a key containing `.` cannot be represented by a dotted
path (documented limitation of the dotted-path bridge).
