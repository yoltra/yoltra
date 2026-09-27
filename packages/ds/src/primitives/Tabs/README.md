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

## Notes

This is a minimal implementation, and it is worth being precise about where it stops.
It sets `role="tablist"`, `role="tab"`, `aria-selected` and `role="tabpanel"`, and
only the selected panel is in the document.

It does **not** implement the rest of the ARIA tabs pattern: there is no arrow-key
navigation between tabs, no `aria-controls` tying a tab to its panel, no
`aria-labelledby` tying the panel back, and no roving `tabIndex`, so every tab is a
separate tab stop. A keyboard reader can reach and activate all of them, which is why
this is a gap rather than a defect, but it is not the pattern an assistive technology
user expects.

Selection is internal. There is no controlled form, so a URL cannot drive which tab
is open.

There is no accordion beside this. A consuming project built one, and it is not here.
