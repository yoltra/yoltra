/**
 * The bounded encoder's rescale loop: a snapshot that will not fit is retried with a smaller
 * node budget until it does, and the shortened result says so instead of presenting a partial
 * tree as the state.
 */

import { describe, expect, it } from "vitest";

import { encodeStateBounded } from "../../src/index";

describe("encodeStateBounded", () => {
  it("returns untruncated output when the value fits", () => {
    const result = encodeStateBounded({ small: true }, 10_000);
    expect(result.truncated).toBe(false);
    expect("note" in result).toBe(false);
  });

  it("rescales the node budget until the payload fits, and says what was omitted", () => {
    // Deep rather than wide, deliberately: pruning a deep chain replaces the whole tail with
    // one marker, so a smaller node budget genuinely shrinks the payload and the loop can
    // land under the cap. (A flat object cannot shrink — every pruned leaf becomes a marker
    // of similar size — which is the give-up case below.)
    let deep: Record<string, unknown> = { pad: "leaf" };
    for (let i = 0; i < 2_000; i++) deep = { next: deep, pad: `level ${i} padding` };

    const result = encodeStateBounded(deep, 5_000);

    expect(result.truncated).toBe(true);
    expect(result.note).toMatch(/too large to send in full/);
  });

  it("gives up honestly when no budget can fit the cap", () => {
    const wide = Object.fromEntries(
      Array.from({ length: 2_000 }, (_, i) => [`key_${i}`, `value ${i} with some padding`]),
    );

    // 500 bytes cannot hold even the maximally reduced encoding: the result says so rather
    // than pretending a sliver of state is the state.
    const result = encodeStateBounded(wide, 500);

    expect(result.truncated).toBe(true);
    expect(result.note).toMatch(/could not be reduced to fit/);
  });

  it("keeps the caller's sanitize hook through the rescale attempts", () => {
    const wide = Object.fromEntries(
      Array.from({ length: 2_000 }, (_, i) => [`secret_${i}`, `token ${i}`]),
    );

    const result = encodeStateBounded(wide, 500, {
      sanitize: (path, value) => (/secret_1\b/.test(path) ? "[redacted]" : value),
    });

    expect(result.truncated).toBe(true);
    // Whatever survived the truncation went through the hook.
    const survivors = JSON.stringify(result.value);
    expect(survivors).not.toContain('"token 1"');
  });
});
