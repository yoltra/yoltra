![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / describeWhenProblem

# Function: describeWhenProblem()

> **describeWhenProblem**(`when`, `consumer`): `undefined` \| `string`

Defined in: [store/matching.ts:137](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/matching.ts#L137)

Why `when` cannot be registered for `consumer`, or `undefined` when it can.

## Parameters

### when

`unknown`

### consumer

[`WhenConsumer`](../type-aliases/WhenConsumer.md)

## Returns

`undefined` \| `string`

## Remarks

Two failures, both of which used to register without a word and then match nothing:

- **`channelPattern` on a reducer or an effect.** Only middleware honours it. A reducer's
  input set has to be closed and readable from its spec, or replaying the same log against
  the same code could fold a different set of events once something adds a channel; and every
  effect for an event runs one after another, so a pattern would quietly enlist an effect in
  the chain of every channel it matched. Both seams read the matcher as keyed, found no keys,
  and mounted on nothing: a reducer that never ran, an effect that was not even reported.
- **A shape that is none of the five forms**, such as `{ any: false }`, `{ keys: "a" }` or
  `{}`. Each of those matched nothing on every seam. The message prints the matcher rather
  than diagnosing each field: it is what the caller needs to find, and it costs the bundle
  one string instead of six.

A matcher that matches nothing *on purpose* is still accepted: `{ keys: [] }` and
`{ channels: [] }` are well-formed, and a caller may build them from a list that happens to
be empty.

Exported so code that accepts a `when` from configuration can refuse a malformed one with the
store's own message, before handing it to a store or to [matchesWhen](matchesWhen.md).

## Example

```ts
const problem = describeWhenProblem(config.capture, "middleware");
if (problem !== undefined) throw new Error(`capture: ${problem}`);
```
