![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / createEntityAdapter

# Function: createEntityAdapter()

> **createEntityAdapter**\<`T`, `Id`\>(`options`): [`EntityAdapter`](../interfaces/EntityAdapter.md)\<`T`, `Id`\>

Defined in: [entity/entityAdapter.ts:163](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L163)

Builds an adapter for one entity type.

## Type Parameters

### T

`T`

### Id

`Id` *extends* [`EntityId`](../type-aliases/EntityId.md) = `string`

## Parameters

### options

[`EntityAdapterOptions`](../interfaces/EntityAdapterOptions.md)\<`T`, `Id`\> = `{}`

## Returns

[`EntityAdapter`](../interfaces/EntityAdapter.md)\<`T`, `Id`\>

## Example

```ts
const todos = createEntityAdapter<Todo>();

const spec: ReducerSpec<EntityState<Todo>, EM> = {
  state: todos.getInitialState(),
  when: { keys: eventKeys<EM>()([['todos', 'toggled']]) },
  reducer: (state, event) =>
    todos.updateOne(state, { id: event.payload.id, changes: { done: event.payload.done } }),
};

// and in a component
useAtomicProp({ reducer: 'todos', property: todos.pathTo(id, 'title') });
```
