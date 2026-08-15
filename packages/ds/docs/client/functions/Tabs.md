![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / Tabs

# Function: Tabs()

> **Tabs**(`__namedParameters`): `Element`

Defined in: [primitives/Tabs.tsx:35](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Tabs.tsx#L35)

Tabbed panels.

## Parameters

### \_\_namedParameters

[`TabsProps`](../interfaces/TabsProps.md)

## Returns

`Element`

## Remarks

Holds the selected tab in React state, which is why it ships from `@yoltra/ds/client` rather
than the server-safe entry.

## Example

```tsx
<Tabs
  items={[
    { id: "npm", label: "npm", content: <CodeBlock code="npm i @yoltra/core" /> },
    { id: "pnpm", label: "pnpm", content: <CodeBlock code="pnpm add @yoltra/core" /> },
  ]}
/>
```
