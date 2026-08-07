[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / PersistenceAdapter

# Interface: PersistenceAdapter

Defined in: [persistence/persist.ts:20](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L20)

Where persisted state lives. Bring your own; core imports no platform global.

## Methods

### read()

> **read**(`key`): `null` \| `string` \| `Promise`\<`null` \| `string`\>

Defined in: [persistence/persist.ts:21](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L21)

#### Parameters

##### key

`string`

#### Returns

`null` \| `string` \| `Promise`\<`null` \| `string`\>

***

### remove()

> **remove**(`key`): `void` \| `Promise`\<`void`\>

Defined in: [persistence/persist.ts:23](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L23)

#### Parameters

##### key

`string`

#### Returns

`void` \| `Promise`\<`void`\>

***

### write()

> **write**(`key`, `value`): `void` \| `Promise`\<`void`\>

Defined in: [persistence/persist.ts:22](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L22)

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`void` \| `Promise`\<`void`\>
