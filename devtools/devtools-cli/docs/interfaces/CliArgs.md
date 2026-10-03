![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-cli**](../README.md)

***

[@yoltra/devtools-cli](../README.md) / CliArgs

# Interface: CliArgs

Defined in: [args.ts:20](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-cli/src/args.ts#L20)

Parsed and validated invocation.

## Properties

### historySize

> `readonly` **historySize**: `number`

Defined in: [args.ts:22](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-cli/src/args.ts#L22)

***

### port

> `readonly` **port**: `number`

Defined in: [args.ts:21](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-cli/src/args.ts#L21)

***

### token?

> `readonly` `optional` **token**: `string`

Defined in: [args.ts:30](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-cli/src/args.ts#L30)

Shared secret for the hub, from `--token` or [TOKEN\_ENV](../variables/TOKEN_ENV.md). Absent when neither is set.

#### Remarks

The embedded hub requires it of every client, and the terminal panel presents it, so the
same value works whether the CLI starts its own hub or attaches to one already running.
