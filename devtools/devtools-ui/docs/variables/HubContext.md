![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / HubContext

# Variable: HubContext

> `const` **HubContext**: `Context`\<[`HubContextValue`](../interfaces/HubContextValue.md)\>

Defined in: [devtools-ui/src/context/HubContext.ts:39](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/context/HubContext.ts#L39)

React context for the DevTools hub connection.

## Remarks

The context ships with an inert default value so that components rendered
outside of a [HubProvider](../functions/HubProvider.md) do not throw. Consumers should always
wrap their tree in a provider before relying on the context value.

## Example

```tsx
import { useContext } from "react";
import { HubContext } from "@yoltra/devtools-ui";

function StatusBadge() {
  const { status } = useContext(HubContext);
  return <span>{status}</span>;
}
```
