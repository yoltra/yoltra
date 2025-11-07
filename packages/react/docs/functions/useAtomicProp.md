[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useAtomicProp

# Function: useAtomicProp()

## Call Signature

> **useAtomicProp**\<`R`, `S`, `P`\>(`spec`): `PathValue`\<`S`\[`R`\], `P`\>

Defined in: [hooks/hooks.ts:229](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/hooks.ts#L229)

Fine-grained **single-path** selector for a Reducer' state.

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

> **useAtomicProp**\<`R`, `S`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`

Defined in: [hooks/hooks.ts:232](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/hooks.ts#L232)

Fine-grained **single-path** selector for a Reducer' state.

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

> **useAtomicProp**\<`R`, `S`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`

Defined in: [hooks/hooks.ts:237](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/hooks.ts#L237)

Fine-grained **single-path** selector for a Reducer' state.

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
