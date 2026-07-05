[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / StoreContext

# Variable: StoreContext

> `const` **StoreContext**: `Context`\<`StoreInstance`\<`any`, `any`, `any`\>\>

Defined in: [react/src/context/StoreContext.ts:32](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/react/src/context/StoreContext.ts#L32)

React Context carrying a StoreInstance for yoltra React bindings.

## Remarks

- The default value is `null`. Consumers should either:
  1) Be wrapped with [StoreProvider](StoreProvider.md), or
  2) Use a helper hook that throws a friendly error when the context is `null`.
- You can scope multiple independent stores by nesting multiple providers.

## Example

```tsx
import { useContext } from "react";
import { StoreContext } from "@yoltra/react";

export function Counter() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("StoreProvider is missing");
  const state = store.getState();
  return <span>{state.counter.value}</span>;
}
```
