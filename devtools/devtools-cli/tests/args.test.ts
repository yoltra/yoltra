import { describe, expect, it } from "vitest";

import { CliArgsError, DEFAULT_HISTORY_SIZE, DEFAULT_PORT, parseArgs } from "../src/args";

describe("parseArgs", () => {
  it("falls back to the defaults when nothing is passed", () => {
    expect(parseArgs([])).toEqual({ port: DEFAULT_PORT, historySize: DEFAULT_HISTORY_SIZE });
  });

  it("reads the values it is given", () => {
    expect(parseArgs(["--port", "9900", "--history-size", "50"])).toEqual({
      port: 9900,
      historySize: 50,
    });
  });

  it("refuses a port outside the range a socket can bind", () => {
    // This used to be accepted here and rejected deep inside the socket library, so the user
    // was shown a stack trace from a dependency rather than being told which flag was wrong.
    expect(() => parseArgs(["--port", "99999"])).toThrow(CliArgsError);
    expect(() => parseArgs(["--port", "99999"])).toThrow(/between 1 and 65535/);
    expect(() => parseArgs(["--port", "0"])).toThrow(CliArgsError);
  });

  it("refuses a value that is not a number instead of quietly using the default", () => {
    // Falling back silently meant the tool listened on a port the user had not asked for and
    // never said so.
    expect(() => parseArgs(["--port", "abc"])).toThrow(/whole number/);
    expect(() => parseArgs(["--port", "9900abc"])).toThrow(/whole number/);
    expect(() => parseArgs(["--port", "99.5"])).toThrow(/whole number/);
  });

  it("refuses a flag with nothing after it", () => {
    expect(() => parseArgs(["--port"])).toThrow(/needs a value/);
    // The next flag is not the value: `--port --history-size 50` is a mistake, not a port.
    expect(() => parseArgs(["--port", "--history-size", "50"])).toThrow(/needs a value/);
  });

  it("checks history size the same way", () => {
    expect(() => parseArgs(["--history-size", "0"])).toThrow(/between 1 and 1000000/);
    expect(parseArgs(["--history-size", "1"]).historySize).toBe(1);
  });

  it("ignores arguments it does not know", () => {
    expect(parseArgs(["--verbose", "--port", "9900"]).port).toBe(9900);
  });
});
