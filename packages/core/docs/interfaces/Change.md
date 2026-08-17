![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Change

# Interface: Change\<V\>

Defined in: [types.ts:159](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L159)

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

### channel?

> `optional` **channel**: `string`

Defined in: [types.ts:175](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L175)

Channel of the causing event. Absent for the same reason as [Change.eventId](#eventid).

***

### eventId?

> `optional` **eventId**: `string`

Defined in: [types.ts:173](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L173)

The `id` of the event that caused this change.

#### Remarks

A change used to be anonymous, so a subscriber that needed to know *why* a value moved had
to mirror the cause into state and store it twice. Absent when the change did not come from
an event — a DevTools time-travel snapshot, for instance — which is itself the signal that
no event caused it.

***

### newValue

> **newValue**: `V`

Defined in: [types.ts:161](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L161)

***

### oldValue

> **oldValue**: `V`

Defined in: [types.ts:160](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L160)

***

### path?

> `optional` **path**: `string`

Defined in: [types.ts:163](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L163)

Dotted path for fine-grained listeners; e.g., "data.items.0.title"

***

### type?

> `optional` **type**: `string`

Defined in: [types.ts:177](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L177)

Type of the causing event. Absent for the same reason as [Change.eventId](#eventid).
