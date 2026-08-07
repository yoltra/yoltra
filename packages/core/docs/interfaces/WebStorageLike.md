[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / WebStorageLike

# Interface: WebStorageLike

Defined in: [persistence/adapters.ts:14](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/adapters.ts#L14)

The slice of the Web Storage API used here.

## Methods

### getItem()

> **getItem**(`key`): `null` \| `string`

Defined in: [persistence/adapters.ts:15](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/adapters.ts#L15)

#### Parameters

##### key

`string`

#### Returns

`null` \| `string`

***

### removeItem()

> **removeItem**(`key`): `void`

Defined in: [persistence/adapters.ts:17](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/adapters.ts#L17)

#### Parameters

##### key

`string`

#### Returns

`void`

***

### setItem()

> **setItem**(`key`, `value`): `void`

Defined in: [persistence/adapters.ts:16](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/adapters.ts#L16)

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`void`
