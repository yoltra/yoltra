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
} from "../types";
import {
  CallAbortedError,
  CallTimeoutError,
  type CallHandle,
  type CallOptions,
  parseReply,
  isReplyTo,
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
 * Three members, named rather than structural over the whole class, because three is few enough
 * that naming them documents the coupling instead of hiding it.
 */
export interface CallDeps<St, EM extends EventMapBase> {
  readonly idFactory: () => string;
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

  let timer: ReturnType<typeof setTimeout> | null = null;
  let unregister: (() => void) | null = null;

  /**
   * Settles the call once. `graceful` distinguishes a terminal reply — after which the
   * consumer is still owed whatever progress it has not read — from an abort, after which
   * nothing is owed to anyone.
   */
  const finish = (fn: () => void, graceful = false): void => {
    if (settled) return;
    settled = true;
    if (timer !== null) clearTimeout(timer);
    timer = null;
    unregister?.();
    unregister = null;
    if (graceful) queue.end();
    else queue.close();
    opts.signal?.removeEventListener("abort", onAbort);
    fn();
  };

  function onAbort(): void {
    finish(() => fail(new CallAbortedError(String(opts.signal?.reason ?? "signal aborted"))));
  }

  const arm = (): void => {
    if (timer !== null) clearTimeout(timer);
    // Idle: every correlated event pushes the deadline out, so a streaming responder is not
    // punished for having a lot to say.
    timer = setTimeout(() => {
      finish(() => fail(new CallTimeoutError(channel, type, idleMs)));
    }, idleMs);
    (timer as { unref?: () => void }).unref?.();
  };

  unregister = deps.registerEffect({
    // A pattern effect on the reply channel: which types are terminal is known, which are
    // progress is not, so the filter cannot be a key list.
    when: { channel: replyChannel as keyof EM & string },
    effect: async (event) => {
      if (settled) return;
      if (!isReplyTo<EM>(event, requestId, opts.correlationId)) return;

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

  if (opts.signal !== undefined) {
    if (opts.signal.aborted) onAbort();
    else opts.signal.addEventListener("abort", onAbort, { once: true });
  }

  arm();

  void deps.emit(channel, type, payload, {
    id: requestId,
    ...(opts.correlationId !== undefined
      ? { meta: { correlationId: opts.correlationId } }
      : {}),
  });

  const handle = {
    then: (onOk?: never, onErr?: never) => terminal.then(onOk, onErr),
    catch: (onErr?: never) => terminal.catch(onErr),
    finally: (onDone?: () => void) => terminal.finally(onDone),
    get dropped() {
      return queue.droppedCount;
    },
    cancel: (reason = "cancelled") => {
      finish(() => fail(new CallAbortedError(reason)));
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
