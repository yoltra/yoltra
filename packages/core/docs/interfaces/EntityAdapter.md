![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EntityAdapter

# Interface: EntityAdapter\<T, Id\>

Defined in: [entity/entityAdapter.ts:71](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L71)

Reducer helpers, selectors, and the subscription paths that make the shape worth having.

## Type Parameters

### T

`T`

### Id

`Id` *extends* [`EntityId`](../type-aliases/EntityId.md) = `string`

## Properties

### idsPath

> `readonly` **idsPath**: `string`

Defined in: [entity/entityAdapter.ts:100](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L100)

Path to the order array. Subscribe here for a list that reorders.

## Methods

### addMany()

> **addMany**\<`S`\>(`state`, `entities`): `S`

Defined in: [entity/entityAdapter.ts:77](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L77)

#### Type Parameters

##### S

`S` *extends* [`EntityState`](EntityState.md)\<`T`, `Id`\>

#### Parameters

##### state

`S`

##### entities

readonly `T`[]

#### Returns

`S`

***

### addOne()

> **addOne**\<`S`\>(`state`, `entity`): `S`

Defined in: [entity/entityAdapter.ts:76](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L76)

Adds an entity. Existing ids are left alone — this is not an upsert.

#### Type Parameters

##### S

`S` *extends* [`EntityState`](EntityState.md)\<`T`, `Id`\>

#### Parameters

##### state

`S`

##### entity

`T`

#### Returns

`S`

***

### anyField()

> **anyField**(`field`): `string`

Defined in: [entity/entityAdapter.ts:104](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L104)

Wildcard across every entity's `field`, for the loose subscription registry.

#### Parameters

##### field

`string`

#### Returns

`string`

***

### getInitialState()

#### Call Signature

> **getInitialState**(): [`EntityState`](EntityState.md)\<`T`, `Id`\>

Defined in: [entity/entityAdapter.ts:72](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L72)

##### Returns

[`EntityState`](EntityState.md)\<`T`, `Id`\>

#### Call Signature

> **getInitialState**\<`Extra`\>(`extra`): [`EntityState`](EntityState.md)\<`T`, `Id`\> & `Extra`

Defined in: [entity/entityAdapter.ts:73](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L73)

##### Type Parameters

###### Extra

`Extra` *extends* `object`

##### Parameters

###### extra

`Extra`

##### Returns

[`EntityState`](EntityState.md)\<`T`, `Id`\> & `Extra`

***

### pathTo()

> **pathTo**(`id`, `field?`): `string`

Defined in: [entity/entityAdapter.ts:102](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L102)

Path to one entity, or to a field of it.

#### Parameters

##### id

`Id`

##### field?

`string`

#### Returns

`string`

***

### removeAll()

> **removeAll**\<`S`\>(`state`): `S`

Defined in: [entity/entityAdapter.ts:91](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L91)

#### Type Parameters

##### S

`S` *extends* [`EntityState`](EntityState.md)\<`T`, `Id`\>

#### Parameters

##### state

`S`

#### Returns

`S`

***

### removeMany()

> **removeMany**\<`S`\>(`state`, `ids`): `S`

Defined in: [entity/entityAdapter.ts:90](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L90)

#### Type Parameters

##### S

`S` *extends* [`EntityState`](EntityState.md)\<`T`, `Id`\>

#### Parameters

##### state

`S`

##### ids

readonly `Id`[]

#### Returns

`S`

***

### removeOne()

> **removeOne**\<`S`\>(`state`, `id`): `S`

Defined in: [entity/entityAdapter.ts:89](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L89)

#### Type Parameters

##### S

`S` *extends* [`EntityState`](EntityState.md)\<`T`, `Id`\>

#### Parameters

##### state

`S`

##### id

`Id`

#### Returns

`S`

***

### selectAll()

> **selectAll**(`state`): readonly `T`[]

Defined in: [entity/entityAdapter.ts:95](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L95)

#### Parameters

##### state

[`EntityState`](EntityState.md)\<`T`, `Id`\>

#### Returns

readonly `T`[]

***

### selectById()

> **selectById**(`state`, `id`): `undefined` \| `T`

Defined in: [entity/entityAdapter.ts:96](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L96)

#### Parameters

##### state

[`EntityState`](EntityState.md)\<`T`, `Id`\>

##### id

`Id`

#### Returns

`undefined` \| `T`

***

### selectEntities()

> **selectEntities**(`state`): `Readonly`\<`Record`\<`Id`, `T`\>\>

Defined in: [entity/entityAdapter.ts:94](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L94)

#### Parameters

##### state

[`EntityState`](EntityState.md)\<`T`, `Id`\>

#### Returns

`Readonly`\<`Record`\<`Id`, `T`\>\>

***

### selectIds()

> **selectIds**(`state`): readonly `Id`[]

Defined in: [entity/entityAdapter.ts:93](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L93)

#### Parameters

##### state

[`EntityState`](EntityState.md)\<`T`, `Id`\>

#### Returns

readonly `Id`[]

***

### selectTotal()

> **selectTotal**(`state`): `number`

Defined in: [entity/entityAdapter.ts:97](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L97)

#### Parameters

##### state

[`EntityState`](EntityState.md)\<`T`, `Id`\>

#### Returns

`number`

***

### setAll()

> **setAll**\<`S`\>(`state`, `entities`): `S`

Defined in: [entity/entityAdapter.ts:82](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L82)

Replaces the whole collection.

#### Type Parameters

##### S

`S` *extends* [`EntityState`](EntityState.md)\<`T`, `Id`\>

#### Parameters

##### state

`S`

##### entities

readonly `T`[]

#### Returns

`S`

***

### setMany()

> **setMany**\<`S`\>(`state`, `entities`): `S`

Defined in: [entity/entityAdapter.ts:80](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L80)

#### Type Parameters

##### S

`S` *extends* [`EntityState`](EntityState.md)\<`T`, `Id`\>

#### Parameters

##### state

`S`

##### entities

readonly `T`[]

#### Returns

`S`

***

### setOne()

> **setOne**\<`S`\>(`state`, `entity`): `S`

Defined in: [entity/entityAdapter.ts:79](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L79)

Adds or replaces one entity wholesale.

#### Type Parameters

##### S

`S` *extends* [`EntityState`](EntityState.md)\<`T`, `Id`\>

#### Parameters

##### state

`S`

##### entity

`T`

#### Returns

`S`

***

### updateMany()

> **updateMany**\<`S`\>(`state`, `updates`): `S`

Defined in: [entity/entityAdapter.ts:85](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L85)

#### Type Parameters

##### S

`S` *extends* [`EntityState`](EntityState.md)\<`T`, `Id`\>

#### Parameters

##### state

`S`

##### updates

readonly [`EntityUpdate`](EntityUpdate.md)\<`T`, `Id`\>[]

#### Returns

`S`

***

### updateOne()

> **updateOne**\<`S`\>(`state`, `update`): `S`

Defined in: [entity/entityAdapter.ts:84](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L84)

Merges `changes` into one entity. Unknown ids are ignored.

#### Type Parameters

##### S

`S` *extends* [`EntityState`](EntityState.md)\<`T`, `Id`\>

#### Parameters

##### state

`S`

##### update

[`EntityUpdate`](EntityUpdate.md)\<`T`, `Id`\>

#### Returns

`S`

***

### upsertMany()

> **upsertMany**\<`S`\>(`state`, `entities`): `S`

Defined in: [entity/entityAdapter.ts:88](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L88)

#### Type Parameters

##### S

`S` *extends* [`EntityState`](EntityState.md)\<`T`, `Id`\>

#### Parameters

##### state

`S`

##### entities

readonly `T`[]

#### Returns

`S`

***

### upsertOne()

> **upsertOne**\<`S`\>(`state`, `entity`): `S`

Defined in: [entity/entityAdapter.ts:87](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L87)

Adds, or merges into an existing entity.

#### Type Parameters

##### S

`S` *extends* [`EntityState`](EntityState.md)\<`T`, `Id`\>

#### Parameters

##### state

`S`

##### entity

`T`

#### Returns

`S`
