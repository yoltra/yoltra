[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / StoreContext

# Variable: StoreContext

> `const` **StoreContext**: `Context`\<`null` \| `StoreInstance`\<`any`, `any`, `any`\>\>

Defined in: [context/StoreContext.ts:27](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/context/StoreContext.ts#L27)

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
