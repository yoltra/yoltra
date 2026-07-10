[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / detectChangedProps

# Function: detectChangedProps()

> **detectChangedProps**(`oldState`, `newState`, `path`, `ancestors`): `string`[]

Defined in: [utils/detectChangedProps.ts:71](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/utils/detectChangedProps.ts#L71)

Computes the list of **dotted leaf paths** that changed between two values.

The algorithm performs a deep structural comparison with special handling for:
- **Primitives / null** → treated as leafs (change = current `path`; two `NaN`s are equal)
- **Date** → compares `getTime()`
- **RegExp** → compares `source` and `flags`
- **Arrays** → if lengths differ, the whole array path is marked changed; otherwise compares
  element-by-element producing paths like `"items.0.title"`
- **Objects** → compares by the **union of keys**, recursing into shared keys and marking
  added/removed keys as changed at their **full path**

Cycles are handled by tracking the `(old, new)` pairs currently on the **recursion path**
(added on entry, removed on unwind). A pair is skipped only when it is a genuine ancestor of
itself (a real cycle) — a pair that merely appears again at a *sibling* path (legitimate
aliasing, e.g. the same object referenced from two keys) is still diffed, so real changes at
the second site are never dropped.

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

### ancestors

`Map`\<`object`, `Set`\<`object`\>\> = `...`

(Advanced) Pairs on the current recursion path, for cycle detection. You
generally never pass this.

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
