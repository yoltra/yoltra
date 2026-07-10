/**
 * Framework-agnostic retry policy for one-shot request/response exchanges.
 *
 * @remarks
 * Some DevTools requests (e.g. `REQUEST_STATE`) expect a single response. If
 * that request races store registration or the hub handshake it can be
 * dropped, leaving the UI waiting forever. This helper re-issues the request
 * on a fixed interval until the response is observed, then stops. Extracted
 * from the hooks so the timing behaviour is unit-testable without React.
 *
 * @module @yoltra/devtools-ui
 */

/**
 * Minimal timer surface, injectable so tests can drive it with fake timers.
 *
 * @internal
 */
export interface RetryScheduler {
  setInterval: (handler: () => void, ms: number) => ReturnType<typeof setInterval>;
  clearInterval: (id: ReturnType<typeof setInterval>) => void;
}

/**
 * Options for {@link startSnapshotRetry}.
 *
 * @internal
 */
export interface SnapshotRetryOptions {
  /** Re-issue the request. Called once per interval until settled. */
  request: () => void;
  /** Returns `true` once the awaited response has been observed. */
  isSettled: () => boolean;
  /** Interval between retries, in milliseconds. */
  intervalMs: number;
  /** Timer implementation. Defaults to the global timers. */
  scheduler?: RetryScheduler;
}

/**
 * Begin re-issuing `request` every `intervalMs` until `isSettled()` returns
 * `true`, at which point the retry stops on its own. Returns a cancel function
 * that stops it immediately (call on unmount / when the response arrives).
 *
 * @param options - See {@link SnapshotRetryOptions}.
 * @returns A function that cancels the retry loop.
 * @internal
 */
export function startSnapshotRetry(options: SnapshotRetryOptions): () => void {
  const scheduler: RetryScheduler = options.scheduler ?? {
    setInterval: (h, ms) => setInterval(h, ms),
    clearInterval: (id) => clearInterval(id),
  };

  let id: ReturnType<typeof setInterval> | null = scheduler.setInterval(() => {
    if (options.isSettled()) {
      cancel();
      return;
    }
    options.request();
  }, options.intervalMs);

  function cancel() {
    if (id !== null) {
      scheduler.clearInterval(id);
      id = null;
    }
  }

  return cancel;
}
