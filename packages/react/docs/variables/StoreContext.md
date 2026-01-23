[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / StoreContext

# Variable: StoreContext

> `const` **StoreContext**: `Context`\<`null` \| `StoreInstance`\<`any`, `any`, `any`\>\>

Defined in: [context/StoreContext.ts:32](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/react/src/context/StoreContext.ts#L32)

React Context carrying a StoreInstance for Quo.js React bindings.

## Remarks

- The default value is `null`. Consumers should either:
  1) Be wrapped with [StoreProvider](StoreProvider.md), or
  2) Use a helper hook that throws a friendly error when the context is `null`.
- You can scope multiple independent stores by nesting multiple providers.

## Example

```tsx
import { useContext } from "react";
import { StoreContext } from "@quojs/react";

export function Counter() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("StoreProvider is missing");
  const state = store.getState();
  return <span>{state.counter.value}</span>;
}
```
