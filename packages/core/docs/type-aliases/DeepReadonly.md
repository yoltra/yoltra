![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / DeepReadonly

# Type Alias: DeepReadonly\<T\>

> **DeepReadonly**\<`T`\> = `T` *extends* (...`args`) => `unknown` ? `T` : `T` *extends* infer A[] ? `ReadonlyArray`\<`DeepReadonly`\<`A`\>\> : `T` *extends* `ReadonlyMap`\<infer K, infer V\> ? `ReadonlyMap`\<`DeepReadonly`\<`K`\>, `DeepReadonly`\<`V`\>\> : `T` *extends* `ReadonlySet`\<infer V\> ? `ReadonlySet`\<`DeepReadonly`\<`V`\>\> : `T` *extends* `Date` \| `RegExp` \| `Promise`\<`unknown`\> \| `Error` ? `T` : `T` *extends* `object` ? `{ readonly [K in keyof T]: DeepReadonly<T[K]> }` : `T`

Defined in: [types.ts:1503](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1503)

Deep readonly type: recursively makes all properties readonly.

## Type Parameters

### T

`T`

Type to make readonly.

## Remarks

The built-in object types are handled before the general mapped-object case, because
mapping over one destroys it. `{ readonly [K in keyof Map<K, V>]: ... }` produces an object
carrying the *names* of a Map's methods with their signatures rewritten, so reading a Map
out of state and calling `.get()` on it was a type error even though the value at runtime
is an ordinary Map. The same applied to `Set`, `Date`, `RegExp` and any function stored in
state.

Collections become their `Readonly*` counterparts, which is the same treatment arrays
already had. Functions are returned untouched: a function's properties are not state, and
mapping over them makes it uncallable.
