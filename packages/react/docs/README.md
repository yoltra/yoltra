**@quojs/react**

***

# @quojs/react

## Hooks

Atomic subscriptions:
- [useSliceProp](hooks/useSliceProp.md)
- [useSliceProps](hooks/useSliceProps.md)

Store and Dispatch:
- [useStore](hooks/useStore.md)
- [useDispatch](hooks/useDispatch.md)

Suspense:
- [useSuspenseSliceProp](hooks/useSuspenseSliceProp.md)
- [useSuspenseSliceProps](hooks/useSuspenseSliceProps.md)

If you ever need a selector:
- [useSelector](hooks/useSelector.md)

## Functions

What you really care about is [**createQuoHooks**](functions/createQuoHooks.md), it allows you to craft
typed hooks for your Store. the rest are used internally:

- [clearSuspenseCache](functions/clearSuspenseCache.md)
- [invalidateSliceProp](functions/invalidateSliceProp.md)
- [invalidateSlicePropsByReducer](functions/invalidateSlicePropsByReducer.md)
- [shallowEqual](functions/shallowEqual.md)

## Interfaces

- [SuspenseSlicePropOptions](interfaces/SuspenseSlicePropOptions.md)
- [SuspenseSlicePropsOptions](interfaces/SuspenseSlicePropsOptions.md)

## Type Aliases

- [UseSliceProp](type-aliases/UseSliceProp.md)
- [UseSliceProps](type-aliases/UseSliceProps.md)

## Variables

- [StoreContext](variables/StoreContext.md)
- [StoreProvider](variables/StoreProvider.md)
