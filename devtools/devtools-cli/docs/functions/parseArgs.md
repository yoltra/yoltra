![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-cli**](../README.md)

***

[@yoltra/devtools-cli](../README.md) / parseArgs

# Function: parseArgs()

> **parseArgs**(`argv`): [`CliArgs`](../interfaces/CliArgs.md)

Defined in: [args.ts:51](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-cli/src/args.ts#L51)

Reads `--port` and `--history-size` from an argument list.

## Parameters

### argv

readonly `string`[]

Arguments after the executable and script (i.e. `process.argv.slice(2)`).

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
```
