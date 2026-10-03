![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-server**](../README.md)

***

[@yoltra/devtools-server](../README.md) / startCli

# Function: startCli()

> **startCli**(`argv`): `Promise`\<`void`\>

Defined in: [cli.ts:36](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-server/src/cli.ts#L36)

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
| `--token`          | none    | Shared secret every client must present (the hub's `authToken` option). |

The token can also come from the `YOLTRA_DEVTOOLS_TOKEN` environment variable, which keeps it
out of the process list; `--token` wins when both are set. Without either, the hub runs open
and says so at startup.

The function stops the hub cleanly when the CLI is interrupted, and exits
with code `1` if the server fails to start.

Usage: `npx @yoltra/devtools-server [--port 9800] [--history-size 1000] [--token <secret>]`
