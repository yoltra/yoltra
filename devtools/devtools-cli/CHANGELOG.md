# Change Log - @yoltra/devtools-cli

This log was last generated on Tue, 18 Aug 2026 01:10:17 GMT and should not be manually modified.

## 0.6.0
Tue, 18 Aug 2026 01:10:17 GMT

### Minor changes

- Exports the command-line argument surface — `parseArgs`, `CliArgs`, `CliArgsError`, `DEFAULT_PORT` and `DEFAULT_HISTORY_SIZE` — from the package entry point.

The package already advertised `exports["."].types`, but the entry module exported nothing, so the published declaration file was empty and the generated API reference was a title with no body. These are the same symbols the binary parses its own arguments with, and the same ones the test suite already covers, so publishing them costs nothing and lets a caller embedding the hub reuse the argument contract rather than re-deriving it.

## 0.5.0
Sat, 15 Aug 2026 22:14:53 GMT

### Updates

- Renames the build output to `.mjs` for consistency with the rest of the suite — this package is ESM-only, so it was never mis-parsed. Adds explicit extensions to the relative specifiers of published declaration files. Extensionless relative re-exports do not resolve under `moduleResolution: nodenext`, and because nearly every project sets `skipLibCheck: true` the errors were suppressed while every re-exported symbol silently degraded to `any`.

## 0.4.0
Fri, 07 Aug 2026 13:15:02 GMT

### Minor changes

- The terminal gains a Time Travel tab. Both surfaces consume the same hook, so the same session could be scrubbed in a browser and not in a shell for no reason other than the tab never being added. A terminal has no slider, so arrow keys step through the history and the bindings are shown on screen; a store that did not advertise replay gets an explanation rather than an empty panel, since the capability is off by default and the reason is not obvious. Components are rendered in tests now.

### Patches

- The package runs tests now — its script was `exit 0` and vitest was not even installed. Argument parsing moves out of the entry point, where it could only be reached by starting a hub and rendering a terminal app, and is validated: a port outside the bindable range was accepted here and rejected deep inside the socket library, so the user saw a stack trace from a dependency instead of being told which flag was wrong, and a non-numeric value fell back to the default so the tool listened somewhere nobody had asked for. Both are refused with a message naming the flag, exiting 2 rather than crashing.

## 0.3.0
Sun, 12 Jul 2026 00:20:57 GMT

_Version update only_

## 0.2.0
Fri, 10 Jul 2026 07:51:29 GMT

### Minor changes

- Initial release: devtools CLI to launch and manage the hub.

### Patches

- Added an explicit exports map (types + import) declaring the package as intentionally ESM-only, consistent with it being a CLI/Ink app rather than a dual cjs+esm library.

