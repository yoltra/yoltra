[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useDispatch

# Function: useDispatch()

> **useDispatch**\<`AM`\>(): `Dispatch`\<`AM`\>

Defined in: [hooks/hooks.ts:119](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/hooks.ts#L119)

Returns the store’s `dispatch` function (stable reference).

## Type Parameters

### AM

`AM` *extends* `ActionMapBase`

Action map type.

## Returns

`Dispatch`\<`AM`\>

## Example

```tsx
const dispatch = useDispatch<MyAM>();
dispatch('ui', 'toggle', true);
```
