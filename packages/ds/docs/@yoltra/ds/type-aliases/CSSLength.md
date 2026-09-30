![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / CSSLength

# Type Alias: CSSLength

> **CSSLength** = `number` \| `string`

Defined in: [tokens/tokens.ts:22](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L22)

Yoltra Design System, foundation tokens.

A brand-anchored primitive scale (colour, type, space, radius, elevation, motion) shared by
the website, docs and examples.

## Remarks

These are **primitives**: raw values with no intent attached. Components never read them
directly, because "this button is `primary[500]`" is a fact that cannot survive a theme
switch. They read the semantic roles in `./themes`, which map these onto intents, and those
roles are what `./css` emits as custom properties.

The one deliberate exception is `palette`, which is **not emitted**. A palette step is an
answer to "which blue", and every question a stylesheet actually asks is "which blue *for
what*". Emitting the ramp would invite components to reach past the semantic layer, which is
the coupling the layer exists to prevent. `tests/styles.test.ts` asserts the omission is
deliberate rather than an oversight.

Brand: primary blue `#1A7FE2`, carbon `#0F172A`. Type: Inter + JetBrains Mono.
