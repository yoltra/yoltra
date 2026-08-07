![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / PersistOptions

# Interface: PersistOptions

Defined in: [persistence/persist.ts:30](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L30)

Shared configuration.

## Properties

### adapter

> `readonly` **adapter**: [`PersistenceAdapter`](PersistenceAdapter.md)

Defined in: [persistence/persist.ts:33](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L33)

***

### key

> `readonly` **key**: `string`

Defined in: [persistence/persist.ts:32](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L32)

Storage key.

***

### migrate()?

> `readonly` `optional` **migrate**: (`persisted`, `from`) => `null` \| `Record`\<`string`, `unknown`\>

Defined in: [persistence/persist.ts:52](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L52)

Upgrades a payload written by an older version.

#### Parameters

##### persisted

`unknown`

##### from

`number`

#### Returns

`null` \| `Record`\<`string`, `unknown`\>

The slices to restore, or `null` to start fresh.

***

### onError()?

> `readonly` `optional` **onError**: (`error`, `phase`) => `void`

Defined in: [persistence/persist.ts:61](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L61)

Called on any failure.

#### Parameters

##### error

`unknown`

##### phase

[`PersistencePhase`](../type-aliases/PersistencePhase.md)

#### Returns

`void`

#### Remarks

Persistence never throws into the application it is persisting. A store that will not
start because storage holds stale JSON is worse than one that starts fresh, and a full
disk should not take down a page.

***

### slices?

> `readonly` `optional` **slices**: readonly `string`[]

Defined in: [persistence/persist.ts:44](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L44)

Slices to persist. Every slice by default.

***

### throttleMs?

> `readonly` `optional` **throttleMs**: `number`

Defined in: [persistence/persist.ts:46](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L46)

Coalescing window for writes, in milliseconds. Defaults to 250.

***

### version

> `readonly` **version**: `number`

Defined in: [persistence/persist.ts:42](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L42)

Schema version of what is written.

#### Remarks

Compared on read. A mismatch is handed to [PersistOptions.migrate](#migrate), and without one
the stored value is discarded rather than trusted — reducers change, and a snapshot
written against an older shape is not merely stale, it may not be valid state at all.
