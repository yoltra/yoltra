// file: quojs/packages/react/tests/utils/warnOnce.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { warnOnce } from "../../src/utils/warnOnce";

describe("warnOnce", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = "development";
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    (console.warn as any).mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  it("logs a warning only once per key", () => {
    warnOnce("key-1", "message 1");
    warnOnce("key-1", "message 1");
    warnOnce("key-2", "message 2");

    expect(console.warn).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenNthCalledWith(1, "message 1");
    expect(console.warn).toHaveBeenNthCalledWith(2, "message 2");
  });

  it("is a no-op in production", () => {
    (console.warn as any).mockClear();
    process.env.NODE_ENV = "production";

    warnOnce("prod-key", "should-not-log");

    expect(console.warn).not.toHaveBeenCalled();
  });
});
