![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / Tabs

# Function: Tabs()

> **Tabs**(`__namedParameters`): `Element`

Defined in: [primitives/Tabs/Tabs.tsx:65](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Tabs/Tabs.tsx#L65)

Tabbed panels, implementing the ARIA tabs pattern.

## Parameters

### \_\_namedParameters

[`TabsProps`](../interfaces/TabsProps.md)

## Returns

`Element`

## Remarks

Holds the selected tab in React state, which is why it ships from `@yoltra/ds/client` rather
than the server-safe entry.

The keyboard contract, which is the part that used to be missing. Earlier versions set the four
roles and `aria-selected` and nothing else: every tab was its own tab stop, arrow keys did
nothing, and no attribute connected a tab to the panel it controlled. Everything was reachable
and operable, so it was a gap rather than a defect, and it was not the pattern anybody using a
screen reader expects.

Now:

- **One tab stop.** The selected tab is the only one with `tabIndex={0}`, so Tab moves past the
  whole set rather than through it. Arrow keys move within.
- **Arrows follow the writing direction.** `ArrowRight` advances in a left-to-right container
  and retreats in a right-to-left one, read from the computed direction rather than assumed.
  `Home` and `End` jump to the ends, and the ends wrap.
- **`aria-controls` and `aria-labelledby`** tie each tab to its panel and back, so a reader can
  move between them and know what it is looking at.
- **The panel is focusable.** `tabIndex={0}` means Tab from the selected tab lands in the
  content it selected, which matters most when that content holds nothing focusable of its own.

## Example

```tsx
<Tabs
  items={[
    { id: "npm", label: "npm", content: <CodeBlock code="npm i @yoltra/core" /> },
    { id: "pnpm", label: "pnpm", content: <CodeBlock code="pnpm add @yoltra/core" /> },
  ]}
/>
```
