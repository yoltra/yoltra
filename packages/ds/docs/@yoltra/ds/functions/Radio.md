![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Radio

# Function: Radio()

> **Radio**(`__namedParameters`): `Element`

Defined in: [primitives/Form.tsx:198](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L198)

One option in a radio group.

## Parameters

### \_\_namedParameters

[`ToggleProps`](../interfaces/ToggleProps.md)

## Returns

`Element`

## Remarks

Every radio in a group must share a `name` — that is what makes them one control rather than
several checkboxes, and what lets arrow keys move between them. [RadioGroup](RadioGroup.md) does not
set it for you: doing so would mean cloning children, which breaks as soon as a caller wraps
an option in anything.
