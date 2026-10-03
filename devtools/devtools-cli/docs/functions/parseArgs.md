![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-cli**](../README.md)

***

[@yoltra/devtools-cli](../README.md) / parseArgs

# Function: parseArgs()

> **parseArgs**(`argv`, `env`): [`CliArgs`](../interfaces/CliArgs.md)

Defined in: [args.ts:65](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-cli/src/args.ts#L65)

Reads `--port`, `--history-size` and `--token` from an argument list.

## Parameters

### argv

readonly `string`[]

Arguments after the executable and script (i.e. `process.argv.slice(2)`).

### env

`Readonly`\<`Record`\<`string`, `string` \| `undefined`\>\> = `{}`

Environment to read [TOKEN\_ENV](../variables/TOKEN_ENV.md) from when `--token` is absent (pass
`process.env`). An empty value counts as unset. Defaults to an empty environment.

## Returns

[`CliArgs`](../interfaces/CliArgs.md)

The validated options.

## Throws

[CliArgsError](../classes/CliArgsError.md) when a value is missing, not a number, or out of range.

## Remarks

Values are range-checked here rather than left to fail later. `--port 99999` used to be
accepted by the parser and rejected deep inside the socket library, so the user saw a stack
trace from a dependency instead of being told which flag was wrong; `--port abc` silently fell
back to the default, and the tool then listened somewhere the user had not asked for.

## Example

```ts
parseArgs(["--port", "9900"]); // { port: 9900, historySize: 1000 }
parseArgs([], { YOLTRA_DEVTOOLS_TOKEN: "s3cret" }); // { port: 9800, historySize: 1000, token: "s3cret" }
```
