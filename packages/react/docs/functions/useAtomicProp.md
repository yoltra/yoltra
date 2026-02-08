[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useAtomicProp

# Function: useAtomicProp()

## Call Signature

> **useAtomicProp**\<`R`, `S`, `R1`, `P`\>(`spec`): [`PathValue`](../type-aliases/PathValue.md)\<`S`\[`R1`\], `P`\>

Defined in: [react/src/hooks/hooks.ts:296](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/hooks.ts#L296)

Fine-grained **single-path** selector for a reducer's state.

Re-renders only when the specified `reducer.property` (dotted path) actually changes.

**Supports**
- Exact root prop: `{ reducer: "todo", property: "data" }`
- Exact deep path: `{ reducer: "todo", property: "data.123.title" }`
- Wildcards (pattern): `{ reducer: "todo", property: "data.*" }` or `"data.**"`

**Overloads**
- Exact path (no `*`): returns the precise `PathValue` when `map` is omitted
- Exact path + `map`: returns `T` from `map(value)`
- Glob path (with `*`/`**`): requires `map` and returns `T` from `map(state)`

### Type Parameters

#### R

`R` *extends* `string`

#### S

`S` *extends* `Record`\<`R`, `any`\>

#### R1

`R1` *extends* `string`

#### P

`P` *extends* `string`

### Parameters

#### spec

##### property

`P`

##### reducer

`R1`

### Returns

[`PathValue`](../type-aliases/PathValue.md)\<`S`\[`R1`\], `P`\>

### Examples

```tsx
const title = useAtomicProp<'todos', AppState, 'items.0.title'>(
  { reducer: 'todos', property: 'items.0.title' }
);
```

```tsx
const len = useAtomicProp(
  { reducer: 'todos', property: 'items' },
  items => items.length
);
```

```tsx
const titles = useAtomicProp(
  { reducer: 'todos', property: 'items.**' },
  state => state.items.map(x => x.title),
  shallowEqual
);
```

## Call Signature

> **useAtomicProp**\<`R`, `S`, `R1`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`

Defined in: [react/src/hooks/hooks.ts:302](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/hooks.ts#L302)

Fine-grained **single-path** selector for a reducer's state.

Re-renders only when the specified `reducer.property` (dotted path) actually changes.

**Supports**
- Exact root prop: `{ reducer: "todo", property: "data" }`
- Exact deep path: `{ reducer: "todo", property: "data.123.title" }`
- Wildcards (pattern): `{ reducer: "todo", property: "data.*" }` or `"data.**"`

**Overloads**
- Exact path (no `*`): returns the precise `PathValue` when `map` is omitted
- Exact path + `map`: returns `T` from `map(value)`
- Glob path (with `*`/`**`): requires `map` and returns `T` from `map(state)`

### Type Parameters

#### R

`R` *extends* `string`

#### S

`S` *extends* `Record`\<`R`, `any`\>

#### R1

`R1` *extends* `string`

#### P

`P` *extends* `string`

#### T

`T`

### Parameters

#### spec

##### property

`P`

##### reducer

`R1`

#### map

(`value`) => `T`

#### isEqual?

(`a`, `b`) => `boolean`

### Returns

`T`

### Examples

```tsx
const title = useAtomicProp<'todos', AppState, 'items.0.title'>(
  { reducer: 'todos', property: 'items.0.title' }
);
```

```tsx
const len = useAtomicProp(
  { reducer: 'todos', property: 'items' },
  items => items.length
);
```

```tsx
const titles = useAtomicProp(
  { reducer: 'todos', property: 'items.**' },
  state => state.items.map(x => x.title),
  shallowEqual
);
```

## Call Signature

> **useAtomicProp**\<`R`, `S`, `R1`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`

Defined in: [react/src/hooks/hooks.ts:313](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/hooks.ts#L313)

Fine-grained **single-path** selector for a reducer's state.

Re-renders only when the specified `reducer.property` (dotted path) actually changes.

**Supports**
- Exact root prop: `{ reducer: "todo", property: "data" }`
- Exact deep path: `{ reducer: "todo", property: "data.123.title" }`
- Wildcards (pattern): `{ reducer: "todo", property: "data.*" }` or `"data.**"`

**Overloads**
- Exact path (no `*`): returns the precise `PathValue` when `map` is omitted
- Exact path + `map`: returns `T` from `map(value)`
- Glob path (with `*`/`**`): requires `map` and returns `T` from `map(state)`

### Type Parameters

#### R

`R` *extends* `string`

#### S

`S` *extends* `Record`\<`R`, `any`\>

#### R1

`R1` *extends* `string`

#### P

`P` *extends* `string`

#### T

`T`

### Parameters

#### spec

##### property

`P`

##### reducer

`R1`

#### map

(`value`) => `T`

#### isEqual?

(`a`, `b`) => `boolean`

### Returns

`T`

### Examples

```tsx
const title = useAtomicProp<'todos', AppState, 'items.0.title'>(
  { reducer: 'todos', property: 'items.0.title' }
);
```

```tsx
const len = useAtomicProp(
  { reducer: 'todos', property: 'items' },
  items => items.length
);
```

```tsx
const titles = useAtomicProp(
  { reducer: 'todos', property: 'items.**' },
  state => state.items.map(x => x.title),
  shallowEqual
);
```

## Call Signature

> **useAtomicProp**\<`R`, `S`\>(`spec`): `unknown`

Defined in: [react/src/hooks/hooks.ts:324](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/hooks.ts#L324)

Fine-grained **single-path** selector for a reducer's state.

Re-renders only when the specified `reducer.property` (dotted path) actually changes.

**Supports**
- Exact root prop: `{ reducer: "todo", property: "data" }`
- Exact deep path: `{ reducer: "todo", property: "data.123.title" }`
- Wildcards (pattern): `{ reducer: "todo", property: "data.*" }` or `"data.**"`

**Overloads**
- Exact path (no `*`): returns the precise `PathValue` when `map` is omitted
- Exact path + `map`: returns `T` from `map(value)`
- Glob path (with `*`/`**`): requires `map` and returns `T` from `map(state)`

### Type Parameters

#### R

`R` *extends* `string`

#### S

`S` *extends* `Record`\<`R`, `any`\>

### Parameters

#### spec

##### property

`string`

##### reducer

`R`

### Returns

`unknown`

### Examples

```tsx
const title = useAtomicProp<'todos', AppState, 'items.0.title'>(
  { reducer: 'todos', property: 'items.0.title' }
);
```

```tsx
const len = useAtomicProp(
  { reducer: 'todos', property: 'items' },
  items => items.length
);
```

```tsx
const titles = useAtomicProp(
  { reducer: 'todos', property: 'items.**' },
  state => state.items.map(x => x.title),
  shallowEqual
);
```

## Call Signature

> **useAtomicProp**\<`R`, `S`, `T`\>(`spec`, `map`, `isEqual?`): `T`

Defined in: [react/src/hooks/hooks.ts:328](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/hooks.ts#L328)

Fine-grained **single-path** selector for a reducer's state.

Re-renders only when the specified `reducer.property` (dotted path) actually changes.

**Supports**
- Exact root prop: `{ reducer: "todo", property: "data" }`
- Exact deep path: `{ reducer: "todo", property: "data.123.title" }`
- Wildcards (pattern): `{ reducer: "todo", property: "data.*" }` or `"data.**"`

**Overloads**
- Exact path (no `*`): returns the precise `PathValue` when `map` is omitted
- Exact path + `map`: returns `T` from `map(value)`
- Glob path (with `*`/`**`): requires `map` and returns `T` from `map(state)`

### Type Parameters

#### R

`R` *extends* `string`

#### S

`S` *extends* `Record`\<`R`, `any`\>

#### T

`T`

### Parameters

#### spec

##### property

`string`

##### reducer

`R`

#### map

(`value`) => `T`

#### isEqual?

(`a`, `b`) => `boolean`

### Returns

`T`

### Examples

```tsx
const title = useAtomicProp<'todos', AppState, 'items.0.title'>(
  { reducer: 'todos', property: 'items.0.title' }
);
```

```tsx
const len = useAtomicProp(
  { reducer: 'todos', property: 'items' },
  items => items.length
);
```

```tsx
const titles = useAtomicProp(
  { reducer: 'todos', property: 'items.**' },
  state => state.items.map(x => x.title),
  shallowEqual
);
```
