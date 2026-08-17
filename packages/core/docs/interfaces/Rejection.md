![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Rejection

# Interface: Rejection

Defined in: [store/rejection.ts:28](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/rejection.ts#L28)

A reducer's refusal to apply a write, carrying the reason.

## Remarks

Distinct from a reducer returning its state unchanged, which is indistinguishable from "the
event did not concern me". A `Rejection` says *this write was considered and declined*, and it
says why — which is what a contended store needs and what a lost update otherwise costs.

## Properties

### \[REJECTED\]

> `readonly` **\[REJECTED\]**: `true`

Defined in: [store/rejection.ts:29](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/rejection.ts#L29)

***

### reason

> `readonly` **reason**: `string`

Defined in: [store/rejection.ts:31](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/rejection.ts#L31)

Why the write was refused. Surfaced to the caller and to `onRejected`.
