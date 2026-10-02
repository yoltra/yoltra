![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / PersistOptions

# Interface: PersistOptions

Defined in: [persistence/persist.ts:32](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L32)

Shared configuration.

## Properties

### adapter

> `readonly` **adapter**: [`PersistenceAdapter`](PersistenceAdapter.md)

Defined in: [persistence/persist.ts:35](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L35)

***

### key

> `readonly` **key**: `string`

Defined in: [persistence/persist.ts:34](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L34)

Storage key.

***

### maxNodes?

> `readonly` `optional` **maxNodes**: `number`

Defined in: [persistence/persist.ts:58](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L58)

Largest number of values encoded in one write. Defaults to 100 000.

#### Remarks

State larger than this is **not written**: the previous stored value stays, and a
[PersistEncodeError](../classes/PersistEncodeError.md) with `truncated: true` reaches [PersistOptions.onError](#onerror).
Writing the part that fit would replace a complete earlier snapshot with a partial one,
which hydrates into state no reducer ever produced.

***

### migrate()?

> `readonly` `optional` **migrate**: (`persisted`, `from`) => `null` \| `Record`\<`string`, `unknown`\>

Defined in: [persistence/persist.ts:72](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L72)

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

Defined in: [persistence/persist.ts:81](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L81)

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

### scheduler?

> `readonly` `optional` **scheduler**: [`Scheduler`](Scheduler.md)

Defined in: [persistence/persist.ts:66](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L66)

Where the coalescing timer is armed. Defaults to the global `setTimeout` and `clearTimeout`,
looked up when the timer is armed, so fake timers installed later still apply.

#### Remarks

Pass the store's own scheduler to keep every timer a host owns behind one port.

***

### slices?

> `readonly` `optional` **slices**: readonly `string`[]

Defined in: [persistence/persist.ts:46](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L46)

Slices to persist. Every slice by default.

***

### throttleMs?

> `readonly` `optional` **throttleMs**: `number`

Defined in: [persistence/persist.ts:48](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L48)

Coalescing window for writes, in milliseconds. Defaults to 250.

***

### version

> `readonly` **version**: `number`

Defined in: [persistence/persist.ts:44](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L44)

Schema version of what is written.

#### Remarks

Compared on read. A mismatch is handed to [PersistOptions.migrate](#migrate), and without one
the stored value is discarded rather than trusted — reducers change, and a snapshot
written against an older shape is not merely stale, it may not be valid state at all.
