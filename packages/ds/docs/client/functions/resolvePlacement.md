[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / resolvePlacement

# Function: resolvePlacement()

> **resolvePlacement**(`__namedParameters`): [`PlacementResult`](../interfaces/PlacementResult.md)

Defined in: [overlay/placement.ts:155](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/placement.ts#L155)

Resolves a requested placement into viewport coordinates, flipping and clamping as needed.

## Parameters

### \_\_namedParameters

[`PlacementInput`](../interfaces/PlacementInput.md)

## Returns

[`PlacementResult`](../interfaces/PlacementResult.md)

## Remarks

Two corrections, in this order, because they answer different questions:

**Flip** handles the main axis — the one the side is on. A menu requested below a trigger near
the bottom of the window has nowhere to go, and shrinking it or letting it hang off-screen are
both worse than putting it above. It flips only when the opposite side actually fits, so an
overlay taller than the window stays where it was asked to go rather than jumping to a side
that overflows just as much.

**Clamp** handles the cross axis. A `bottom-start` menu whose trigger sits near the right edge
would run past it; sliding it left keeps it on screen without changing which side it is on.
Only the cross axis is clamped — clamping the main axis would slide the overlay over the very
element it is describing.

## Example

```ts
const { x, y, placement } = resolvePlacement({
  anchor: trigger.getBoundingClientRect(),
  floating: { width: 220, height: 180 },
  viewport: { width: window.innerWidth, height: window.innerHeight },
  placement: "bottom-start",
});
```
