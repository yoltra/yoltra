![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / PersistenceAdapter

# Interface: PersistenceAdapter

Defined in: [persistence/persist.ts:22](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L22)

Where persisted state lives. Bring your own; core imports no platform global.

## Methods

### read()

> **read**(`key`): `null` \| `string` \| `Promise`\<`null` \| `string`\>

Defined in: [persistence/persist.ts:23](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L23)

#### Parameters

##### key

`string`

#### Returns

`null` \| `string` \| `Promise`\<`null` \| `string`\>

***

### remove()

> **remove**(`key`): `void` \| `Promise`\<`void`\>

Defined in: [persistence/persist.ts:25](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L25)

#### Parameters

##### key

`string`

#### Returns

`void` \| `Promise`\<`void`\>

***

### write()

> **write**(`key`, `value`): `void` \| `Promise`\<`void`\>

Defined in: [persistence/persist.ts:24](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L24)

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`void` \| `Promise`\<`void`\>
