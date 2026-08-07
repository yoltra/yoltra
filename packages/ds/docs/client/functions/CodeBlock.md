[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / CodeBlock

# Function: CodeBlock()

> **CodeBlock**(`__namedParameters`): `Element`

Defined in: [primitives/CodeBlock.tsx:38](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/CodeBlock.tsx#L38)

A block of code, with a copy button.

## Parameters

### \_\_namedParameters

[`CodeBlockProps`](../interfaces/CodeBlockProps.md)

## Returns

`Element`

## Remarks

Ships from `@yoltra/ds/client`: copying needs the clipboard API, and the button tracks
whether it has just been pressed.

## Example

```tsx
<CodeBlock title="store.ts" language="ts" code={`createStore(spec)`} />
```
