// file: quojs/packages/react/tests/generic/suspense.cache.unit.test.ts
import { describe, it, expect, afterEach } from "vitest";
import {
  suspenseCache,
  invalidateAtomicProp,
  invalidateAtomicPropsByReducer,
  clearSuspenseCache,
} from "../../src/hooks/suspense";

// tiny async helpers (no fake timers needed)
const delay = <T,>(v: T, ms = 0) => new Promise<T>((res) => setTimeout(() => res(v), ms));
const fail = (e: unknown, ms = 0) => new Promise<never>((_, rej) => setTimeout(() => rej(e), ms));

describe("suspenseCache + invalidators (unit)", () => {
  afterEach(() => {
    clearSuspenseCache(); // ensure clean cache between tests
  });

  it("read: pending -> ready (resolves) and returns cached value", async () => {
    const key = "k:ready";

    // 1st read throws promise (pending)
    let thrown: unknown | null = null;
    try {
      // staleTime=null => no expiry
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      suspenseCache.read<number>(key, () => delay(42, 0), null);
    } catch (p) {
      thrown = p;
    }

    expect(thrown).toBeInstanceOf(Promise);

    // wait the promise
    await (thrown as Promise<unknown>);

    // 2nd read returns the cached value (no throw)
    const v = suspenseCache.read<number>(key, () => {
      throw new Error("should not be called when cache is ready");
    }, null);
    
    expect(v).toBe(42);
  });

  it("read: pending -> error, then stays error until invalidated", async () => {
    const key = "k:error";

    // first call moves to pending and throws
    let pending: unknown | null = null;
    try {
      // IMPORTANT: staleTime=null to keep error sticky until we invalidate
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      suspenseCache.read<number>(key, () => fail(new Error("boom"), 0), null);
    } catch (p) {
      pending = p;
    }
    expect(pending).toBeInstanceOf(Promise);

    // await loader rejection to transition to error
    await (pending as Promise<unknown>).catch(() => undefined);

    // subsequent read throws the cached error (still fresh)
    let err: unknown = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      suspenseCache.read<number>(key, () => 123, null);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe("boom");

    // now invalidate via public helpers (exercise both code paths)
    invalidateAtomicProp("anyReducer", "any.path");
    invalidateAtomicPropsByReducer("anyReducer");

    // direct invalidate to clear the specific key
    suspenseCache.invalidate(key);

    // after invalidation, read should go pending again, then resolve with new value
    let p2: unknown;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      suspenseCache.read<number>(key, () => 7, null);
    } catch (th) {
      p2 = th;
    }
    expect(p2).toBeInstanceOf(Promise);
    await (p2 as Promise<unknown>);

    const v = suspenseCache.read<number>(key, () => 0, null);
    expect(v).toBe(7);
  });

  it("clearSuspenseCache wipes everything", async () => {
    const key1 = "k:one";
    const key2 = "k:two";

    // seed both keys (go pending, then ready)
    let p1: unknown, p2: unknown;
    try { suspenseCache.read(key1, () => delay("A", 0), null); } catch (th) { p1 = th; }
    try { suspenseCache.read(key2, () => delay("B", 0), null); } catch (th) { p2 = th; }
    await Promise.all([p1 as Promise<unknown>, p2 as Promise<unknown>]);

    // sanity: both are ready/cached
    expect(suspenseCache.read(key1, () => "X", null)).toBe("A");
    expect(suspenseCache.read(key2, () => "Y", null)).toBe("B");

    // clear and confirm loaders run again (pending -> ready)
    clearSuspenseCache();

    let p3: unknown, p4: unknown;
    try { suspenseCache.read(key1, () => "X", null); } catch (th) { p3 = th; }
    try { suspenseCache.read(key2, () => "Y", null); } catch (th) { p4 = th; }
    expect(p3).toBeInstanceOf(Promise);
    expect(p4).toBeInstanceOf(Promise);
    await Promise.all([p3 as Promise<unknown>, p4 as Promise<unknown>]);

    // now they should be ready with the new values
    expect(suspenseCache.read(key1, () => "should not run", null)).toBe("X");
    expect(suspenseCache.read(key2, () => "should not run", null)).toBe("Y");
  });
});
