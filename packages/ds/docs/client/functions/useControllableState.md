![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / useControllableState

# Function: useControllableState()

> **useControllableState**\<`T`\>(`__namedParameters`): \[`T`, (`next`) => `void`\]

Defined in: [hooks/useControllableState.ts:42](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/hooks/useControllableState.ts#L42)

State a component owns until its caller decides to.

## Type Parameters

### T

`T`

## Parameters

### \_\_namedParameters

[`ControllableStateOptions`](../interfaces/ControllableStateOptions.md)\<`T`\>

## Returns

\[`T`, (`next`) => `void`\]

## Remarks

The pattern is small and easy to get subtly wrong, which is why it is here rather than in each
component: it was found solved three different ways across two consuming projects, and one of
them only half. A surface that needs to know the value passes `value` and `onChange` and owns it;
one that does not passes neither and the component keeps it.

Two details that the half-solutions missed. `onChange` fires in **both** modes, so a caller can
observe without taking ownership. And the controlled value wins on every render rather than being
copied into state once, which is what makes a parent able to reject or transform a change instead
of watching the component move anyway.

## Example

```tsx
function Disclosure({ open, defaultOpen = false, onOpenChange, children }) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  return <button onClick={() => setOpen(!isOpen)}>{children}</button>;
}
```
