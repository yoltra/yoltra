![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-server**](../README.md)

***

[@yoltra/devtools-server](../README.md) / startCli

# Function: startCli()

> **startCli**(`argv`): `Promise`\<`void`\>

Defined in: [cli.ts:31](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-server/src/cli.ts#L31)

Parse CLI arguments and start the hub server.

## Parameters

### argv

`string`[] = `process.argv`

Argument vector to parse. Defaults to `process.argv`.

## Returns

`Promise`\<`void`\>

Resolves once the hub is listening; never resolves during
         normal operation (the hub runs until the CLI is interrupted).

## Remarks

Supported flags:

| Flag               | Default | Description                        |
| ------------------ | ------- | ---------------------------------- |
| `--port`           | `9800`  | WebSocket port to bind on.         |
| `--history-size`   | `1000`  | Ring-buffer capacity for replays.  |

The function stops the hub cleanly when the CLI is interrupted, and exits
with code `1` if the server fails to start.

Usage: `npx @yoltra/devtools-server [--port 9800] [--history-size 1000]`
