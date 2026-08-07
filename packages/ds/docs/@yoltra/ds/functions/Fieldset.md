[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Fieldset

# Function: Fieldset()

> **Fieldset**(`__namedParameters`): `Element`

Defined in: [primitives/Form.tsx:122](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L122)

A group of related controls.

## Parameters

### \_\_namedParameters

[`FieldsetProps`](../interfaces/FieldsetProps.md)

## Returns

`Element`

## Remarks

A real `<fieldset>` with a `<legend>`, which is the one construct that gets a group name
announced before each control inside it. A `<div>` with a heading looks identical and tells
a screen-reader user nothing about where one group ends and the next begins.

## Example

```tsx
<Fieldset legend="Transport security" hint="Both apply off loopback.">
  <Checkbox name="tls" label="Require TLS" />
  <Checkbox name="mtls" label="Require client certificates" />
</Fieldset>
```
