![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Reducer

# Class: Reducer\<S, EM\>

Defined in: [reducer/Reducer.ts:50](https://github.com/yoltra/yoltra/blob/main/packages/core/src/reducer/Reducer.ts#L50)

Thin wrapper around a pure reducer function (stateful event consumer):
given a state `S` and an event (from [\`EventUnion\<EM\>\`](../type-aliases/EventUnion.md)),
returns the next state `S`.

## Remarks

- The reducer function is expected to be **pure** and **side-effect free**.
- Use this class when you want to pass a reducer around as a value, or to
  unify the reducer interface across the core API.

## Example

```ts
type State = { count: number };
type EM = { math: { add: number; set: number } };

const rf: ReducerFunction<State, EM> = (s, evt) => {
  if (evt.channel === 'math' && evt.type === 'add') {
    return { count: s.count + evt.payload };
  }
  if (evt.channel === 'math' && evt.type === 'set') {
    return { count: evt.payload };
  }
  return s;
};

const r = new Reducer<State, EM>(rf);

const s0 = { count: 0 };
const s1 = r.reduce(s0, {
  channel: 'math',
  type: 'add',
  payload: 2,
  id: crypto.randomUUID()
} as EventUnion<EM>);
// s1.count === 2
```

## Type Parameters

### S

`S`

State shape handled by this reducer.

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map describing the valid event keys and payload types.

## Constructors

### Constructor

> **new Reducer**\<`S`, `EM`\>(`reduce`): `Reducer`\<`S`, `EM`\>

Defined in: [reducer/Reducer.ts:72](https://github.com/yoltra/yoltra/blob/main/packages/core/src/reducer/Reducer.ts#L72)

Creates a new Reducer from a pure reducer function.

#### Parameters

##### reduce

[`ReducerFunction`](../type-aliases/ReducerFunction.md)\<`S`, `EM`\>

A function `(state, event) => nextState` that implements your update logic.

#### Returns

`Reducer`\<`S`, `EM`\>

#### Example

```ts
const reducer = new Reducer<MyState, MyEM>((state, event) => {
  // implement your transitions here
  return state;
});
```

## Methods

### reduce()

> **reduce**(`state`, `event`): [`Rejection`](../interfaces/Rejection.md) \| `S`

Defined in: [reducer/Reducer.ts:90](https://github.com/yoltra/yoltra/blob/main/packages/core/src/reducer/Reducer.ts#L90)

Applies the reducer to produce the next state.

#### Parameters

##### state

`S`

Current state.

##### event

[`EventUnion`](../type-aliases/EventUnion.md)\<`EM`\>

An event drawn from [\`EventUnion\<EM\>\`](../type-aliases/EventUnion.md).

#### Returns

[`Rejection`](../interfaces/Rejection.md) \| `S`

The next state, or a [Rejection](../interfaces/Rejection.md) if the reducer refused the write.

#### Example

```ts
const next = reducer.reduce(curr, someEvent as EventUnion<MyEM>);
```
