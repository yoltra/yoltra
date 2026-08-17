![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / useStoreState

# Function: useStoreState()

> **useStoreState**(`storeId`): `object`

Defined in: [devtools-ui/src/hooks/useStoreState.ts:63](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/hooks/useStoreState.ts#L63)

Lazily fetches a store's full state and keeps it up-to-date via patches.

## Parameters

### storeId

The store ID to track state for, or `null` to disable.

`null` | `string`

## Returns

`object`

An object with `state`, `version`, `loading`, and `refresh`.

### loading

> **loading**: `boolean`

### refresh()

> **refresh**: () => `void`

#### Returns

`void`

### state

> **state**: `unknown`

### version

> **version**: `number`

## Remarks

The state is initially `null` until a `STATE_SNAPSHOT` is received.
After that, incoming `STORE_EVENT` patches are applied incrementally
using [applyPatches](applyPatches.md). Patches that arrive before the snapshot are
buffered and replayed in version order once the snapshot is available.

Call `refresh()` to discard the current state and re-fetch from scratch.

## Example

```tsx
import { useStoreState } from "@yoltra/devtools-ui";

function StateInspector({ storeId }: { storeId: string }) {
  const { state, version, loading, refresh } = useStoreState(storeId);
  if (loading) return <p>Loading...</p>;
  return (
    <div>
      <p>Version: {version}</p>
      <pre>{JSON.stringify(state, null, 2)}</pre>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```
