[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / detectChangedProps

# Function: detectChangedProps()

> **detectChangedProps**(`oldState`, `newState`, `path`, `seenPairs`): `string`[]

Defined in: [utils/detectChangedProps.ts:68](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/utils/detectChangedProps.ts#L68)

Computes the list of **dotted leaf paths** that changed between two values.

The algorithm performs a deep structural comparison with special handling for:
- **Primitives / null** → treated as leafs (change = current `path`)
- **Date** → compares `getTime()`
- **RegExp** → compares `source` and `flags`
- **Arrays** → if lengths differ, the whole array path is marked changed; otherwise compares
  element-by-element producing paths like `"items.0.title"`
- **Objects** → compares by the **union of keys**, recursing into shared keys and marking
  added/removed keys as changed at their **full path**

Cycles and repeated object aliases are handled via **pair-wise** tracking using a
`WeakMap<object, WeakSet<object>>` so recursion doesn’t loop and shared subgraphs do not
produce false negatives.

## Parameters

### oldState

`any`

Previous value to diff.

### newState

`any`

Next value to diff.

### path

`string` = `""`

Current dotted path (callers pass `""` for root; recursion appends segments).

### seenPairs

`WeakMap`\<`object`, `WeakSet`\<`object`\>\> = `...`

(Advanced) Pair tracker for cycle/alias detection. You generally never pass this.

## Returns

`string`[]

An array of **dotted leaf paths** that changed. Paths use `"."` as a separator and
indices for arrays (e.g., `"todos.0.title"`). If nothing changed, returns `[]`.

## Examples

```ts
detectChangedProps(
  { user: { name: 'Ada', age: 37 } },
  { user: { name: 'Grace', age: 37 } }
);
// => ['user.name']
```

```ts
detectChangedProps(
  { items: [{ title: 'A' }, { title: 'B' }] },
  { items: [{ title: 'A+' }, { title: 'B' }] }
);
// => ['items.0.title']
```

```ts
detectChangedProps({ nums: [1,2] }, { nums: [1,2,3] });
// => ['nums']
```

```ts
detectChangedProps(new Date(0), new Date(0), 'createdAt');      // => []
detectChangedProps(new Date(0), new Date(1), 'createdAt');      // => ['createdAt']
detectChangedProps(/a/i, /a/i, 'pattern');                      // => []
detectChangedProps(/a/i, /a/g, 'pattern');                      // => ['pattern']
```

## Remarks

- If `oldState === newState` (same reference), returns `[]` immediately.
- For objects, only **own enumerable** keys are compared (via `Object.keys`).
- Returned paths are **leaf paths** where a primitive/terminal difference was detected; for arrays,
  a length change is treated as a leaf change at the array path.
