import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { startSnapshotRetry } from "../src/hooks/snapshotRetry";

describe("startSnapshotRetry", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("re-issues the request every interval until settled, then stops", () => {
    let settled = false;
    const request = vi.fn();

    const cancel = startSnapshotRetry({
      request,
      isSettled: () => settled,
      intervalMs: 1500,
    });

    // Nothing until the first interval elapses.
    expect(request).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1500);
    expect(request).toHaveBeenCalledTimes(1);

    // Keeps retrying while unsettled.
    vi.advanceTimersByTime(3000);
    expect(request).toHaveBeenCalledTimes(3);

    // Once the snapshot lands, the next tick self-cancels — no more requests.
    settled = true;
    vi.advanceTimersByTime(1500);
    expect(request).toHaveBeenCalledTimes(3);

    vi.advanceTimersByTime(6000);
    expect(request).toHaveBeenCalledTimes(3);

    cancel();
  });

  it("stops immediately when cancelled, before any retry fires", () => {
    const request = vi.fn();

    const cancel = startSnapshotRetry({
      request,
      isSettled: () => false,
      intervalMs: 1500,
    });

    cancel();
    vi.advanceTimersByTime(10_000);
    expect(request).toHaveBeenCalledTimes(0);
  });

  it("is idempotent when cancelled more than once", () => {
    const request = vi.fn();
    const cancel = startSnapshotRetry({
      request,
      isSettled: () => false,
      intervalMs: 1000,
    });

    vi.advanceTimersByTime(1000);
    expect(request).toHaveBeenCalledTimes(1);

    cancel();
    expect(() => cancel()).not.toThrow();
    vi.advanceTimersByTime(5000);
    expect(request).toHaveBeenCalledTimes(1);
  });
});
