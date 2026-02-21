[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / useAtomicProp

# Function: useAtomicProp()

## Call Signature

> **useAtomicProp**\<`R`, `S`, `R1`, `P`\>(`spec`): [`PathValue`](../type-aliases/PathValue.md)\<`S`\[`R1`\], `P`\>

Defined in: [react/src/hooks/hooks.ts:294](https://github.com/yoltra/yoltra/blob/a987f4d35946c58f44d8b45d3fefadd911124683/packages/react/src/hooks/hooks.ts#L294)

Fine-grained **single-path** selector for a reducer's state.

Re-renders only when the specified `reducer.property` (dotted path) actually changes.
For most applications, prefer using the typed version from [createHooks](createHooks.md)
which infers all type parameters automatically.

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
const { useAtomicProp } = createHooks(AppStoreContext);

function TodoTitle({ index }: { index: number }) {
  // Types are inferred — no explicit generics needed
  const title = useAtomicProp({
    reducer: 'todos',
    property: `items.${index}.title`,
  });
  return <span>{title}</span>;
}
```

```tsx
const title = useAtomicProp<'todos', AppState, 'todos', 'items.0.title'>(
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

Defined in: [react/src/hooks/hooks.ts:300](https://github.com/yoltra/yoltra/blob/a987f4d35946c58f44d8b45d3fefadd911124683/packages/react/src/hooks/hooks.ts#L300)

Fine-grained **single-path** selector for a reducer's state.

Re-renders only when the specified `reducer.property` (dotted path) actually changes.
For most applications, prefer using the typed version from [createHooks](createHooks.md)
which infers all type parameters automatically.

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
const { useAtomicProp } = createHooks(AppStoreContext);

function TodoTitle({ index }: { index: number }) {
  // Types are inferred — no explicit generics needed
  const title = useAtomicProp({
    reducer: 'todos',
    property: `items.${index}.title`,
  });
  return <span>{title}</span>;
}
```

```tsx
const title = useAtomicProp<'todos', AppState, 'todos', 'items.0.title'>(
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

Defined in: [react/src/hooks/hooks.ts:311](https://github.com/yoltra/yoltra/blob/a987f4d35946c58f44d8b45d3fefadd911124683/packages/react/src/hooks/hooks.ts#L311)

Fine-grained **single-path** selector for a reducer's state.

Re-renders only when the specified `reducer.property` (dotted path) actually changes.
For most applications, prefer using the typed version from [createHooks](createHooks.md)
which infers all type parameters automatically.

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
const { useAtomicProp } = createHooks(AppStoreContext);

function TodoTitle({ index }: { index: number }) {
  // Types are inferred — no explicit generics needed
  const title = useAtomicProp({
    reducer: 'todos',
    property: `items.${index}.title`,
  });
  return <span>{title}</span>;
}
```

```tsx
const title = useAtomicProp<'todos', AppState, 'todos', 'items.0.title'>(
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

Defined in: [react/src/hooks/hooks.ts:322](https://github.com/yoltra/yoltra/blob/a987f4d35946c58f44d8b45d3fefadd911124683/packages/react/src/hooks/hooks.ts#L322)

Fine-grained **single-path** selector for a reducer's state.

Re-renders only when the specified `reducer.property` (dotted path) actually changes.
For most applications, prefer using the typed version from [createHooks](createHooks.md)
which infers all type parameters automatically.

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
const { useAtomicProp } = createHooks(AppStoreContext);

function TodoTitle({ index }: { index: number }) {
  // Types are inferred — no explicit generics needed
  const title = useAtomicProp({
    reducer: 'todos',
    property: `items.${index}.title`,
  });
  return <span>{title}</span>;
}
```

```tsx
const title = useAtomicProp<'todos', AppState, 'todos', 'items.0.title'>(
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

Defined in: [react/src/hooks/hooks.ts:326](https://github.com/yoltra/yoltra/blob/a987f4d35946c58f44d8b45d3fefadd911124683/packages/react/src/hooks/hooks.ts#L326)

Fine-grained **single-path** selector for a reducer's state.

Re-renders only when the specified `reducer.property` (dotted path) actually changes.
For most applications, prefer using the typed version from [createHooks](createHooks.md)
which infers all type parameters automatically.

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
const { useAtomicProp } = createHooks(AppStoreContext);

function TodoTitle({ index }: { index: number }) {
  // Types are inferred — no explicit generics needed
  const title = useAtomicProp({
    reducer: 'todos',
    property: `items.${index}.title`,
  });
  return <span>{title}</span>;
}
```

```tsx
const title = useAtomicProp<'todos', AppState, 'todos', 'items.0.title'>(
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
