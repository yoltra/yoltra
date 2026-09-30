# Form

Everything that surrounds a control: `FormField`, `Fieldset`, `Checkbox`, `Radio`,
`RadioGroup`, `Switch` and `Slider`.

```ts
import { FormField, Fieldset, Checkbox, Radio, RadioGroup, Switch, Slider } from "@yoltra/ds";
import "@yoltra/ds/styles/form.css";
```

One stylesheet is enough. `form.css` carries the field wrapper as well as these
controls, so it no longer has to be paired with `field.css`.

## Examples

`FormField` passes the wiring down as a render prop, so the control it wraps cannot
disagree with the label about its `id`:

```tsx
<FormField id="host" label="Hub host" hint="Where the hub listens.">
  {(control) => <Input {...control} placeholder="localhost" />}
</FormField>
```

An error replaces the hint and announces itself:

```tsx
<FormField id="host" label="Hub host" error="That host is unreachable." required>
  {(control) => <Input {...control} />}
</FormField>
```

Related controls belong in a fieldset, which gives them one name:

```tsx
<Fieldset legend="Connection" hint="How the agent reaches the hub.">
  <Input aria-label="Host" />
</Fieldset>

<RadioGroup legend="Cadence" inline>
  <Radio name="cadence" id="daily" label="Daily" />
  <Radio name="cadence" id="weekly" label="Weekly" />
</RadioGroup>
```

A label on its own, for the layouts `FormField`'s column does not fit:

```tsx
<Inline gap={2} align="center">
  <Label htmlFor="q">Filter</Label>
  <Input id="q" size="sm" />
</Inline>
```

The toggles carry their own label:

```tsx
<Checkbox id="remember" label="Remember me" hint="On this device only." />
<Switch id="dark" label="Dark mode" />
<Slider id="volume" min={0} max={10} defaultValue={5} valueText="5 of 10" />
```

## Props

`FormField`: `id`, `label`, `hint`, `error`, `required`, and `children` as
`(control) => ReactNode`.

`Label`: every native `label` attribute. `Fieldset`: `legend`, `hint`. `RadioGroup`: `legend`,
`hint`, `inline`.

`Checkbox` / `Radio` / `Switch`: every native input attribute except `type`, plus
`label` and `hint`.

`Slider`: every native input attribute except `type`, plus `valueText`.

## Notes

The error region is always in the document and collapses when empty, so a message
that arrives later is an update to something the reader is already watching rather
than a new thing appearing. It carries `role="alert"`.

`required` renders a marker *and* sets the attribute. The marker alone would be
decoration.

`valueText` on `Slider` becomes `aria-valuetext`. A number on its own is rarely what
a reader wants read out.

`.yl-label` is styled on its own now. It used to be styled only as `.yl-field > .yl-label`, while
this package's own TSDoc showed a bare `<label className="yl-label">`, so a consuming project copied
that example sixteen times and every one received nothing. `Label` means nobody needs the class name
at all.

The switch knob is `--yl-color-bg-panel` on `--yl-color-interactive-track`. Both
exist because the knob's position is the state, so it has to clear 3:1 against the
track: it used to be a white dot on a pale groove at 1.48:1.
