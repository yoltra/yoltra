[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useAtomicProp

# Function: useAtomicProp()

## Call Signature

> **useAtomicProp**\<`R`, `S`, `R1`, `P`\>(`spec`): [`PathValue`](../type-aliases/PathValue.md)\<`S`\[`R1`\], `P`\>

Defined in: [hooks/hooks.ts:317](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/react/src/hooks/hooks.ts#L317)

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

Defined in: [hooks/hooks.ts:323](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/react/src/hooks/hooks.ts#L323)

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

Defined in: [hooks/hooks.ts:334](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/react/src/hooks/hooks.ts#L334)

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

Defined in: [hooks/hooks.ts:345](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/react/src/hooks/hooks.ts#L345)

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

Defined in: [hooks/hooks.ts:349](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/react/src/hooks/hooks.ts#L349)

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
