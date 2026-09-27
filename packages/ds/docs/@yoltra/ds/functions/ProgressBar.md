![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / ProgressBar

# Function: ProgressBar()

> **ProgressBar**(`__namedParameters`): `Element`

Defined in: [primitives/ProgressBar/ProgressBar.tsx:44](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/ProgressBar/ProgressBar.tsx#L44)

A determinate progress bar.

## Parameters

### \_\_namedParameters

[`ProgressBarProps`](../interfaces/ProgressBarProps.md)

## Returns

`Element`

## Remarks

Determinate only, and that is the point: it is the counterpart to [Spinner](Spinner.md), which says
that something is happening, where this says how much of it is done. A consuming project put the
distinction well while arguing against a spinner for long work: a spinner would hide a stuck job,
where the word "running" beside a task id does not.

The value is clamped rather than trusted. A bar rendered past its end is a layout bug that
arrives with production data, long after the component was reviewed.

## Example

```tsx
<ProgressBar label="Downloading model" value={done} max={total} valueText={`${done} of ${total} files`} />
```
