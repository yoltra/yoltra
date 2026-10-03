/**
 * The orchestration behind `store.call()`.
 *
 * @remarks
 * Moved out of `Store.ts` unchanged, and it lands beside the types and the queue it already
 * used. The seam is three members wide, which is what made this one extractable: the body mints
 * an id, registers a collector effect, and emits the request. It reaches nothing else.
 *
 * `registerEffect` and `emit` arrive as bound references, since `Store` binds both in its
 * constructor. `Store.call` keeps its signature and its explicit return type.
 *
 * @module
 */

import type {
  DeepReadonly,
  EffectSpec,
  EmitOptions,
  EmitResult,
  EventMapBase,
  EventUnion,
  Scheduler,
  TimerHandle,
} from "../types";
import {
  CallAbortedError,
  CallTimeoutError,
  type CallCancellation,
  type CallCorrelation,
  type CallHandle,
  type CallOptions,
  type ReplySpec,
} from "./call";
import { CallQueue } from "./callQueue";

/** Idle time a {@link performCall} tolerates before giving up. */
const DEFAULT_CALL_TIMEOUT_MS = 30_000;

/** Progress events a call buffers before pacing the producer. */
const DEFAULT_CALL_WATERMARK = 16;

/**
 * What `performCall` needs from the store.
 *
 * @remarks
 * Five members, named rather than structural over the whole class, because five is few enough
 * that naming them documents the coupling instead of hiding it.
 */
export interface CallDeps<St, EM extends EventMapBase> {
  readonly idFactory: () => string;
  /** Arms the idle timeout: the store's `StoreSpec.scheduler`. */
  readonly scheduler: Scheduler;
  /** The store's lifetime. A call still pending when it aborts is rejected. */
  readonly signal: AbortSignal;
  readonly registerEffect: (spec: EffectSpec<DeepReadonly<St>, EM>) => () => void;
  readonly emit: <C extends keyof EM & string, T extends keyof EM[C] & string>(
    channel: C,
    type: T,
    payload: EM[C][T],
    opts?: EmitOptions,
  ) => Promise<EmitResult>;
}

export function performCall<
  St,
  EM extends EventMapBase,
  C extends keyof EM & string,
  T extends keyof EM[C] & string,
>(
  deps: CallDeps<St, EM>,
  channel: C,
  type: T,
  payload: EM[C][T],
  opts: CallOptions<EM>,
): CallHandle<EventUnion<EM>, EventUnion<EM>> {
  const correlation: CallCorrelation = opts.correlation ?? "either";
  // Before anything is registered or emitted: either mistake would leave a call that can only
  // time out, thirty seconds later and far from the line that caused it.
  if (correlation !== "either" && correlation !== "causal" && correlation !== "id") {
    throw new Error(`[yoltra] call: correlation must be "either", "causal" or "id", got ${JSON.stringify(correlation)}`);
  }
  if (correlation === "id" && opts.correlationId === undefined) {
    throw new Error(`[yoltra] call: correlation "id" needs a correlationId to match on`);
  }
  const { channel: replyChannel, isTerminal } = parseReply<EM>(opts.reply);
  const idleMs = opts.timeoutMs ?? DEFAULT_CALL_TIMEOUT_MS;
  const queue = new CallQueue<EventUnion<EM>>(opts.highWaterMark ?? DEFAULT_CALL_WATERMARK);

  // Minted here rather than left to `emit`, because the correlation has to be known before the
  // request goes out — a reply can arrive during the emit itself, synchronously.
  const requestId = deps.idFactory();

  let settle!: (event: EventUnion<EM>) => void;
  let fail!: (error: Error) => void;
  let settled = false;
  const terminal = new Promise<EventUnion<EM>>((resolve, reject) => {
    settle = resolve;
    fail = reject;
  });
  // Attached immediately so a rejection that nobody has awaited yet is not reported as
  // unhandled; the caller's own await still sees it.
  terminal.catch(() => undefined);

  let timer: TimerHandle | null = null;
  let unregister: (() => void) | null = null;

  /**
   * Settles the call once. `graceful` distinguishes a terminal reply — after which the
   * consumer is still owed whatever progress it has not read — from an abort, after which
   * nothing is owed to anyone.
   */
  const finish = (fn: () => void, graceful = false): void => {
    if (settled) return;
    settled = true;
    if (timer !== null) deps.scheduler.clearTimeout(timer);
    timer = null;
    unregister?.();
    unregister = null;
    if (graceful) queue.end();
    else queue.close();
    opts.signal?.removeEventListener("abort", onAbort);
    deps.signal.removeEventListener("abort", onStoreDisposed);
    fn();
  };

  // Whether the request went out. A call that settles before sending it has no responder to tell.
  let sent = false;

  /**
   * Tells the responder that this call gave up, through {@link CallOptions.cancel}. After the
   * call has settled, so the cancellation cannot be mistaken for progress, and never throwing:
   * the caller is already being told why the call ended.
   */
  const tellResponder = (reason: CallCancellation["reason"], detail?: string): void => {
    if (!sent || opts.cancel === undefined) return;
    const [cancelChannel, cancelType] = opts.cancel;
    const payload: CallCancellation =
      detail === undefined ? { requestId, reason } : { requestId, reason, detail };
    const emitOpts =
      opts.correlationId !== undefined ? { meta: { correlationId: opts.correlationId } } : undefined;
    try {
      void deps.emit(cancelChannel, cancelType, payload as never, emitOpts).catch(() => undefined);
    } catch {
      // Ignored: see above.
    }
  };

  /** Settles the call as given up, then tells the responder, unless it had already settled. */
  const giveUp = (error: Error, reason: CallCancellation["reason"], detail?: string): void => {
    if (settled) return;
    finish(() => fail(error));
    tellResponder(reason, detail);
  };

  function onAbort(): void {
    const why = String(opts.signal?.reason ?? "signal aborted");
    giveUp(new CallAbortedError(why), "aborted", why);
  }

  function onStoreDisposed(): void {
    finish(() => fail(new CallAbortedError("store disposed")));
  }

  // Before anything is registered, armed or sent. A store already disposed, or a signal already
  // aborted, settles the call here, and nothing after this point runs: the request used to go
  // out and an idle timer was armed for a call that had already failed.
  if (deps.signal.aborted) onStoreDisposed();
  else deps.signal.addEventListener("abort", onStoreDisposed, { once: true });
  if (opts.signal !== undefined) {
    if (opts.signal.aborted) onAbort();
    else if (!settled) opts.signal.addEventListener("abort", onAbort, { once: true });
  }

  const arm = (): void => {
    if (timer !== null) deps.scheduler.clearTimeout(timer);
    // Idle: every correlated event pushes the deadline out, so a streaming responder is not
    // punished for having a lot to say.
    const handle = deps.scheduler.setTimeout(() => {
      giveUp(new CallTimeoutError(channel, type, idleMs), "timeout");
    }, idleMs);
    (handle as { unref?: () => void }).unref?.();
    timer = handle;
  };

  if (!settled) unregister = deps.registerEffect({
    // A pattern effect on the reply channel: which types are terminal is known, which are
    // progress is not, so the filter cannot be a key list.
    when: { channel: replyChannel as keyof EM & string },
    effect: async (event) => {
      if (settled) return;
      if (!isReplyTo<EM>(event, requestId, opts.correlationId, correlation)) return;

      arm();

      if (isTerminal(String(event.type))) {
        finish(() => settle(event), true);
        return;
      }

      // The await is the backpressure. This runs inside the store's effect phase, so the
      // responder's own `await emit(...)` does not resolve until it returns.
      await queue.put(event);
    },
  });

  if (!settled) {
    arm();
    sent = true;
    void deps.emit(channel, type, payload, {
      id: requestId,
      ...(opts.correlationId !== undefined
        ? { meta: { correlationId: opts.correlationId } }
        : {}),
    });
  }

  const handle = {
    then: (onOk?: never, onErr?: never) => terminal.then(onOk, onErr),
    catch: (onErr?: never) => terminal.catch(onErr),
    finally: (onDone?: () => void) => terminal.finally(onDone),
    get dropped() {
      return queue.droppedCount;
    },
    cancel: (reason = "cancelled") => {
      giveUp(new CallAbortedError(reason), "cancelled", reason);
    },
    [Symbol.asyncIterator]: (): AsyncIterator<EventUnion<EM>> => {
      queue.beginConsuming();
      return {
        next: () => queue.take(),
        // Called by `for await` on `break`, `return` or a throw. Without it, abandoning the
        // loop would leave the effect registered and the producer parked for good.
        return: async () => {
          queue.close();
          return { value: undefined, done: true };
        },
      };
    },
  } as CallHandle<EventUnion<EM>, EventUnion<EM>>;

  return handle;
}

/*
 * Both helpers below live here rather than in `call.ts`, and are not exported.
 *
 * They were `@internal` and exported for this module, which put them in the published
 * `call.d.ts` while TypeDoc's `excludeInternal` kept them out of the reference. A consumer
 * reviewing the package read `isReplyTo` there and reasonably concluded it was public API, then
 * built a conclusion on it. `call.d.ts` now carries exactly the public surface — `ReplySpec`,
 * `CallOptions`, `CallHandle`, `CallTimeoutError`, `CallAbortedError` — and nothing else.
 */
/**
 * Normalises a {@link ReplySpec} into a channel and a terminal-type test.
 *
 * @internal
 */
function parseReply<EM extends EventMapBase>(
  reply: ReplySpec<EM>,
): { channel: string; isTerminal: (type: string) => boolean } {
  const [channel, types] = reply as readonly [string, (string | readonly string[])?];

  // A channel on its own means every reply on it ends the call — the shape a responder with one
  // kind of answer takes, and the one where naming the type would be noise.
  if (types === undefined) return { channel, isTerminal: () => true };

  if (typeof types === "string") return { channel, isTerminal: (t) => t === types };

  const set = new Set(types);
  return { channel, isTerminal: (t) => set.has(t) };
}

/**
 * Whether `event` is a reply to the request identified by `requestId` / `correlationId`.
 *
 * @remarks
 * Under `"either"`, the parent link first: the store stamps `parentId` on anything emitted while
 * handling an event, so a responder that answers through the `emit` it was given is correlated
 * without doing anything. The explicit id is the fallback for replies that crossed a boundary the
 * parent link cannot. `"causal"` and `"id"` each use one link and ignore the other.
 *
 * Note this tests the **immediate** parent, not descent. A reply emitted a further hop down a
 * cascade carries the intermediate event's id as its `parentId` and does not match; such a
 * responder must echo a `correlationId`.
 *
 * @internal
 */
function isReplyTo<EM extends EventMapBase>(
  event: EventUnion<EM>,
  requestId: string,
  correlationId: string | undefined,
  correlation: CallCorrelation,
): boolean {
  if (correlation !== "id" && event.parentId === requestId) return true;
  if (correlation === "causal" || correlationId === undefined) return false;
  return (event.meta as { correlationId?: unknown } | undefined)?.correlationId === correlationId;
}
