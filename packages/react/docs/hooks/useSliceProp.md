[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSliceProp

# Function: useSliceProp()

## Call Signature

> **useSliceProp**\<`R`, `S`, `P`\>(`spec`): `PathValue`\<`S`\[`R`\], `P`\>

Defined in: [hooks/hooks.ts:228](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/hooks.ts#L228)

Fine-grained **single-path** selector for a slice.

Re-renders only when the specified `reducer.property` (dotted path) actually changes.

**Supports**
- Exact root prop: `{ reducer: "todo", property: "data" }`
- Exact deep path: `{ reducer: "todo", property: "data.123.title" }`
- Wildcards (pattern): `{ reducer: "todo", property: "data.*" }` or `"data.**"`

**Overloads**
- Exact path (no `*`): returns the precise `PathValue` when `map` is omitted
- Exact path + `map`: returns `T` from `map(value)`
- Glob path (with `*`/`**`): requires `map` and returns `T` from `map(slice)`

### Type Parameters

#### R

`R` *extends* `string`

#### S

`S` *extends* `Record`\<`R`, `any`\>

#### P

`P` *extends* `string`

### Parameters

#### spec

##### property

`P`

##### reducer

`R`

### Returns

`PathValue`\<`S`\[`R`\], `P`\>

### Examples

```tsx
const title = useSliceProp<'todos', AppState, 'items.0.title'>(
  { reducer: 'todos', property: 'items.0.title' }
);
```

```tsx
const len = useSliceProp(
  { reducer: 'todos', property: 'items' },
  items => items.length
);
```

```tsx
const titles = useSliceProp(
  { reducer: 'todos', property: 'items.**' },
  slice => slice.items.map(x => x.title),
  shallowEqual
);
```

## Call Signature

> **useSliceProp**\<`R`, `S`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`

Defined in: [hooks/hooks.ts:231](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/hooks.ts#L231)

Fine-grained **single-path** selector for a slice.

Re-renders only when the specified `reducer.property` (dotted path) actually changes.

**Supports**
- Exact root prop: `{ reducer: "todo", property: "data" }`
- Exact deep path: `{ reducer: "todo", property: "data.123.title" }`
- Wildcards (pattern): `{ reducer: "todo", property: "data.*" }` or `"data.**"`

**Overloads**
- Exact path (no `*`): returns the precise `PathValue` when `map` is omitted
- Exact path + `map`: returns `T` from `map(value)`
- Glob path (with `*`/`**`): requires `map` and returns `T` from `map(slice)`

### Type Parameters

#### R

`R` *extends* `string`

#### S

`S` *extends* `Record`\<`R`, `any`\>

#### P

`P` *extends* `string`

#### T

`T`

### Parameters

#### spec

##### property

`P`

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
const title = useSliceProp<'todos', AppState, 'items.0.title'>(
  { reducer: 'todos', property: 'items.0.title' }
);
```

```tsx
const len = useSliceProp(
  { reducer: 'todos', property: 'items' },
  items => items.length
);
```

```tsx
const titles = useSliceProp(
  { reducer: 'todos', property: 'items.**' },
  slice => slice.items.map(x => x.title),
  shallowEqual
);
```

## Call Signature

> **useSliceProp**\<`R`, `S`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`

Defined in: [hooks/hooks.ts:236](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/hooks.ts#L236)

Fine-grained **single-path** selector for a slice.

Re-renders only when the specified `reducer.property` (dotted path) actually changes.

**Supports**
- Exact root prop: `{ reducer: "todo", property: "data" }`
- Exact deep path: `{ reducer: "todo", property: "data.123.title" }`
- Wildcards (pattern): `{ reducer: "todo", property: "data.*" }` or `"data.**"`

**Overloads**
- Exact path (no `*`): returns the precise `PathValue` when `map` is omitted
- Exact path + `map`: returns `T` from `map(value)`
- Glob path (with `*`/`**`): requires `map` and returns `T` from `map(slice)`

### Type Parameters

#### R

`R` *extends* `string`

#### S

`S` *extends* `Record`\<`R`, `any`\>

#### P

`P` *extends* `string`

#### T

`T`

### Parameters

#### spec

##### property

`P`

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
const title = useSliceProp<'todos', AppState, 'items.0.title'>(
  { reducer: 'todos', property: 'items.0.title' }
);
```

```tsx
const len = useSliceProp(
  { reducer: 'todos', property: 'items' },
  items => items.length
);
```

```tsx
const titles = useSliceProp(
  { reducer: 'todos', property: 'items.**' },
  slice => slice.items.map(x => x.title),
  shallowEqual
);
```
