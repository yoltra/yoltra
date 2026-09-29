![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / AuthCard

# Function: AuthCard()

> **AuthCard**(`__namedParameters`): `Element`

Defined in: [primitives/AuthCard/AuthCard.tsx:45](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/AuthCard/AuthCard.tsx#L45)

A centred card for a sign-in, sign-up or recovery screen.

## Parameters

### \_\_namedParameters

[`AuthCardProps`](../interfaces/AuthCardProps.md)

## Returns

`Element`

## Remarks

Pure composition over [Card](Card.md), [Stack](Stack.md) and [Heading](Heading.md), which is exactly why it
belongs here: a consuming project used it six times across two applications and then reproduced
the same four nested elements inline a seventh time, because the component lived in one app's
folder and the other could not import it. That is a distribution problem rather than a design
one, and shipping it here is the fix.

## Example

```tsx
<AuthCard title="Sign in">
  <Stack as="form" gap={3} onSubmit={submit}>
    <FormField id="email" label="Email">{(c) => <Input {...c} type="email" />}</FormField>
    <Button type="submit" loading={busy}>Sign in</Button>
  </Stack>
</AuthCard>
```
