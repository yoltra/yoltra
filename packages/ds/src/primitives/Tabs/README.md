# Tabs

One panel visible at a time, with a roving tab list.

```ts
import { Tabs } from "@yoltra/ds/client";
import "@yoltra/ds/styles/tabs.css";
```

`/client`: the selection is state, so this is a client component.

## Examples

```tsx
<Tabs
  items={[
    { id: "install", label: "Install", content: <CodeBlock code="npm i @yoltra/ds" /> },
    { id: "usage", label: "Usage", content: <p>Import a component.</p> },
  ]}
/>
```

The first tab is selected unless another is named:

```tsx
<Tabs items={items} defaultId="usage" />
```

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `items` | `TabItem[]` | Each is `{ id, label, content }`. |
| `defaultId` | `string` | Defaults to the first item. |
| `activation` | `"automatic" \| "manual"` | `"automatic"`: selection follows focus. |

## Notes

It implements the ARIA tabs pattern.

- **One tab stop.** The selected tab is the only one with `tabIndex={0}`, so Tab moves past the
  set rather than through it, and arrow keys move within.
- **Arrows follow the writing direction.** `ArrowRight` advances in a left-to-right container and
  retreats in a right-to-left one, read from the computed direction rather than assumed. `Home`
  and `End` jump to the ends, and the ends wrap.
- **`aria-controls` and `aria-labelledby`** tie each tab to its panel and the panel back to its
  tab.
- **The panel is focusable**, so Tab from the selected tab lands in the content it selected. That
  matters most when the panel holds nothing focusable of its own.

Selection follows focus by default, which is what the ARIA practices recommend when a panel is
cheap. `activation="manual"` moves focus only and waits for Enter, Space or a click, for the case
the recommendation carves out: a panel expensive enough that arrowing past three to reach the
fourth would fetch three things nobody asked for.

Selection is internal. There is no controlled form, so a URL cannot drive which tab is open.

There is no accordion beside this. A consuming project built one, and it is not here.
