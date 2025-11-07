[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useDispatch

# Function: useDispatch()

> **useDispatch**\<`AM`\>(): `Dispatch`\<`AM`\>

Defined in: [hooks/hooks.ts:120](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/hooks.ts#L120)

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
