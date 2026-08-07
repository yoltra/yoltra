![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / hydrate

# Function: hydrate()

> **hydrate**(`options`): `Promise`\<[`Hydration`](../interfaces/Hydration.md)\>

Defined in: [persistence/persist.ts:102](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L102)

Reads persisted state, ready to seed a store.

## Parameters

### options

[`PersistOptions`](../interfaces/PersistOptions.md) & `object`

## Returns

`Promise`\<[`Hydration`](../interfaces/Hydration.md)\>

## Remarks

Every read-side failure — missing, unparseable, wrong version with no migration, a
migration that declines — resolves to "nothing to restore" and reports through
[PersistOptions.onError](../interfaces/PersistOptions.md#onerror). Nothing throws.

## Example

```ts
const hydration = await hydrate({ key: 'app', adapter, version: 3 });
const store = createStore({
  name: 'App',
  reducer: withHydration({ todos: todosSpec }, hydration),
});
```
