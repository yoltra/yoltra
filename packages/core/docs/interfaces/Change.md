[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Change

# Interface: Change\<V\>

Defined in: [types.ts:133](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L133)

Generic "old → new" wrapper for fine-grained change notifications.
Carries the dotted `path` that changed.

## Example

```ts
const change: Change<string> = {
  oldValue: 'foo',
  newValue: 'bar',
  path: 'user.name'
};
```

## Type Parameters

### V

`V` = `any`

Value type at the changed path.

## Properties

### newValue

> **newValue**: `V`

Defined in: [types.ts:135](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L135)

***

### oldValue

> **oldValue**: `V`

Defined in: [types.ts:134](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L134)

***

### path?

> `optional` **path**: `string`

Defined in: [types.ts:137](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L137)

Dotted path for fine-grained listeners; e.g., "data.items.0.title"
