[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Change

# Interface: Change\<V\>

Defined in: [types.ts:102](https://github.com/quojs/quojs/blob/7a847d68175722f00e52941458a1511185cf0a4e/packages/core/src/types.ts#L102)

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

Defined in: [types.ts:104](https://github.com/quojs/quojs/blob/7a847d68175722f00e52941458a1511185cf0a4e/packages/core/src/types.ts#L104)

***

### oldValue

> **oldValue**: `V`

Defined in: [types.ts:103](https://github.com/quojs/quojs/blob/7a847d68175722f00e52941458a1511185cf0a4e/packages/core/src/types.ts#L103)

***

### path?

> `optional` **path**: `string`

Defined in: [types.ts:106](https://github.com/quojs/quojs/blob/7a847d68175722f00e52941458a1511185cf0a4e/packages/core/src/types.ts#L106)

Dotted path for fine-grained listeners; e.g., "data.items.0.title"
