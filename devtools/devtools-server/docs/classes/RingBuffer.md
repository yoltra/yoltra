[**@yoltra/devtools-server**](../README.md)

***

[@yoltra/devtools-server](../README.md) / RingBuffer

# Class: RingBuffer\<T\>

Defined in: ring-buffer.ts:20

Fixed-size circular buffer that overwrites the oldest entry on overflow.

## Remarks

Used by the hub to retain event history for late-connecting extensions.
The buffer pre-allocates an array of the given capacity and uses modular
arithmetic to track insertion position, making [push](#push) an O(1)
operation with no memory allocation after construction.

## Type Parameters

### T

`T`

Item type stored in the buffer.

## Constructors

### Constructor

> **new RingBuffer**\<`T`\>(`capacity`): `RingBuffer`\<`T`\>

Defined in: ring-buffer.ts:28

#### Parameters

##### capacity

`number`

Maximum number of items. Must be at least 1.

#### Returns

`RingBuffer`\<`T`\>

## Properties

### capacity

> `readonly` **capacity**: `number`

Defined in: ring-buffer.ts:28

Maximum number of items. Must be at least 1.

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: ring-buffer.ts:72

Current number of items stored in the buffer.

##### Returns

`number`

A value between `0` and [capacity](#capacity) inclusive.

## Methods

### clear()

> **clear**(): `void`

Defined in: ring-buffer.ts:81

Remove all items.

#### Returns

`void`

***

### push()

> **push**(`item`): `void`

Defined in: ring-buffer.ts:40

Push an item. Overwrites the oldest if at capacity.

#### Parameters

##### item

`T`

Item to add.

#### Returns

`void`

***

### toArray()

> **toArray**(): `T`[]

Defined in: ring-buffer.ts:55

Returns all items in insertion order (oldest first).

#### Returns

`T`[]

A new array containing buffered items from oldest to newest.
