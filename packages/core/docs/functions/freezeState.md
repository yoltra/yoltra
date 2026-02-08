[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / freezeState

# Function: freezeState()

> **freezeState**\<`T`\>(`obj`, `seen`): [`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`T`\>

Defined in: [utils/immutability.ts:52](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/utils/immutability.ts#L52)

Deep-freezes a value **in place** and returns it as [\`DeepReadonly\<T\>\`](../type-aliases/DeepReadonly.md).

## Type Parameters

### T

`T`

The input value type to freeze.

## Parameters

### obj

`T`

Any value; objects and arrays are frozen recursively.

### seen

`WeakSet`\<`object`\> = `...`

(Advanced) A `WeakSet` used to track visited objects for cycle/alias safety.

## Returns

[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`T`\>

The **same** reference as `obj`, but frozen and typed as `DeepReadonly<T>`.

## Remarks

- **In-place**: this function mutates the input by freezing it and its children, then returns it.
- **Early exits**:
  - Primitives and `null` are returned as-is.
  - Already-frozen objects (`Object.isFrozen(obj)`) are returned as-is.
  - Previously seen objects (by identity) are returned as-is to avoid infinite recursion on cycles.
- **Arrays**: freezes each element, then `Object.freeze(array)`. Length/property descriptors are not rewritten.
- **Objects**: iterates **own** string and symbol keys. Only **data properties** are recursed (getters/setters are skipped).
- **Strict mode**: Mutating a frozen object throws; in non-strict mode it is a no-op (per JS semantics).

## Examples

```ts
const state = { user: { name: 'Ada' }, items: [1, { id: 1 }] };
const frozen = freezeState(state);

Object.isFrozen(frozen);                 // true
Object.isFrozen(frozen.user);            // true
Object.isFrozen(frozen.items);           // true
Object.isFrozen(frozen.items[1]);        // true
```

```ts
const a: any = {};
a.self = a;              // cycle
freezeState(a);          // does not recurse infinitely
```

```ts
const o = Object.freeze({ x: 1 });
const out = freezeState(o);
out === o;               // true
```
