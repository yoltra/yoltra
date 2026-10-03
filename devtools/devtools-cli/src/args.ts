/**
 * Command-line argument parsing.
 *
 * @remarks
 * Separated from the entry point so it can be tested: `index.ts` starts a hub, renders an Ink
 * app and waits for the process to exit, none of which a unit test can drive.
 *
 * @module @yoltra/devtools-cli
 */

/** Default hub port, matching the agents' default. */
export const DEFAULT_PORT = 9800;
/** Default number of events retained for late-connecting clients. */
export const DEFAULT_HISTORY_SIZE = 1000;

/** Environment variable read for the hub token when `--token` is not given. */
export const TOKEN_ENV = "YOLTRA_DEVTOOLS_TOKEN";

/** Parsed and validated invocation. */
export interface CliArgs {
  readonly port: number;
  readonly historySize: number;
  /**
   * Shared secret for the hub, from `--token` or {@link TOKEN_ENV}. Absent when neither is set.
   *
   * @remarks
   * The embedded hub requires it of every client, and the terminal panel presents it, so the
   * same value works whether the CLI starts its own hub or attaches to one already running.
   */
  readonly token?: string;
}

/** A rejected invocation, with something a user can act on. */
export class CliArgsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliArgsError";
  }
}

/**
 * Reads `--port`, `--history-size` and `--token` from an argument list.
 *
 * @param argv - Arguments after the executable and script (i.e. `process.argv.slice(2)`).
 * @param env - Environment to read {@link TOKEN_ENV} from when `--token` is absent (pass
 * `process.env`). An empty value counts as unset. Defaults to an empty environment.
 * @returns The validated options.
 *
 * @throws {@link CliArgsError} when a value is missing, not a number, or out of range.
 *
 * @remarks
 * Values are range-checked here rather than left to fail later. `--port 99999` used to be
 * accepted by the parser and rejected deep inside the socket library, so the user saw a stack
 * trace from a dependency instead of being told which flag was wrong; `--port abc` silently fell
 * back to the default, and the tool then listened somewhere the user had not asked for.
 *
 * @example
 * ```ts
 * parseArgs(["--port", "9900"]); // { port: 9900, historySize: 1000 }
 * parseArgs([], { YOLTRA_DEVTOOLS_TOKEN: "s3cret" }); // { port: 9800, historySize: 1000, token: "s3cret" }
 * ```
 *
 * @public
 */
export function parseArgs(
  argv: readonly string[],
  env: Readonly<Record<string, string | undefined>> = {},
): CliArgs {
  const token = readString(argv, "--token") ?? (env[TOKEN_ENV] || undefined);
  return {
    port: readNumber(argv, "--port", DEFAULT_PORT, 1, 65_535),
    historySize: readNumber(argv, "--history-size", DEFAULT_HISTORY_SIZE, 1, 1_000_000),
    ...(token !== undefined ? { token } : {}),
  };
}

/** @internal */
function readString(argv: readonly string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index < 0) return undefined;

  // A missing value is refused rather than read as "no token": an open hub is the one outcome
  // someone typing the flag did not ask for.
  const raw = argv[index + 1];
  if (raw === undefined || raw === "" || raw.startsWith("--")) {
    throw new CliArgsError(`${flag} needs a value, for example \`${flag} <secret>\`.`);
  }
  return raw;
}

/** @internal */
function readNumber(
  argv: readonly string[],
  flag: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const index = argv.indexOf(flag);
  if (index < 0) return fallback;

  const raw = argv[index + 1];
  if (raw === undefined || raw.startsWith("--")) {
    throw new CliArgsError(`${flag} needs a value, for example \`${flag} ${fallback}\`.`);
  }

  // `parseInt` would read "9900abc" as 9900 and "abc" as NaN; both deserve to be refused rather
  // than half-understood.
  const value = Number(raw);
  if (!Number.isInteger(value)) {
    throw new CliArgsError(`${flag} must be a whole number, got "${raw}".`);
  }
  if (value < min || value > max) {
    throw new CliArgsError(`${flag} must be between ${min} and ${max}, got ${value}.`);
  }
  return value;
}
