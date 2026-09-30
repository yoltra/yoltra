/**
 * @module @yoltra/core
 */

import type { EventMapBase, EventUnion } from "../types";

/**
 * Which reply events end a {@link StoreInstance.call | call}, and therefore what it resolves to.
 *
 * @remarks
 * Given as `[channel]` or `[channel, type]` or `[channel, [type, type]]`. The named types are
 * **terminal**: the first one to arrive settles the call. Every other correlated event on that
 * channel is progress.
 *
 * Naming a channel alone makes every event on it terminal, which suits a responder with a single
 * kind of answer. Naming types is what lets a responder stream: `["rpc", ["answer", "error"]]`
 * ends on either, and anything else — `progress`, `partial`, `log` — flows to the consumer.
 *
 * @public
 */
export type ReplySpec<EM extends EventMapBase> =
  | readonly [channel: keyof EM & string]
  | readonly [channel: keyof EM & string, type: string]
  | readonly [channel: keyof EM & string, types: readonly string[]];

/**
 * Options for {@link StoreInstance.call}.
 *
 * @public
 */
export interface CallOptions<EM extends EventMapBase> {
  /** Which reply events end the call. See {@link ReplySpec}. */
  readonly reply: ReplySpec<EM>;

  /**
   * How long the call may sit **idle** before it gives up, in milliseconds.
   *
   * @remarks
   * Idle, not total: every correlated event resets it, progress included. A job that streams for
   * two minutes must not fail a thirty-second call, and a total deadline would make the timeout a
   * function of how much work the responder had to do rather than whether it is still alive.
   *
   * For a genuine deadline — "this must be finished by then, however lively" — use
   * {@link CallOptions.signal} with an `AbortSignal.timeout()`.
   *
   * @default 30000
   */
  readonly timeoutMs?: number;

  /**
   * Aborts the call. The returned promise rejects and the iterator ends.
   *
   * @remarks
   * Unlike `timeoutMs` this is absolute, so it is the right tool for a request deadline, a
   * user-cancelled action, or a component unmounting.
   */
  readonly signal?: AbortSignal;

  /**
   * How many progress events may buffer before the producer is made to wait.
   *
   * @remarks
   * Only meaningful once the caller is iterating. See {@link StoreInstance.call} for what
   * backpressure means here and when it engages.
   *
   * @default 16
   */
  readonly highWaterMark?: number;

  /**
   * Correlate on this id **in addition to** the parent link.
   *
   * @remarks
   * The default matching is structural: the store stamps `parentId` on anything emitted while an
   * event is being handled, so a responder that answers through the `emit` it was handed is
   * correlated without either side carrying an id. That is free and cannot be forged, but it only
   * holds in one process and only for a **direct** reply — see {@link StoreInstance.call}.
   *
   * A reply arriving from another node, a worker, or any transport carries no parent link, so for
   * those the responder echoes an id and both sides agree on it here.
   *
   * When set, the id is sent as `meta.correlationId` and a reply matches if it echoes that value
   * **or** is a direct child of the request. This option *widens* the match; it does not replace
   * the parent check, which still runs first. There is deliberately no way to match on the echoed
   * id alone: a local responder therefore needs no changes to be compatible with a remote one.
   */
  readonly correlationId?: string;
}

/**
 * The result of {@link StoreInstance.call}: awaitable for the terminal reply, async-iterable for
 * progress.
 *
 * @typeParam TReply - The terminal reply event.
 * @typeParam TProgress - Non-terminal correlated events.
 *
 * @remarks
 * One object serving both shapes, rather than two functions, because the caller's intent is not
 * known at the call site — the same request may be awaited in one place and streamed in another,
 * and the responder should not have to care which.
 *
 * ```ts
 * // Await the answer, ignore the running commentary.
 * const done = await store.call("rpc", "ask", { q }, { reply: ["rpc", "answer"] });
 *
 * // Or consume the commentary, then take the answer.
 * const call = store.call("rpc", "ask", { q }, { reply: ["rpc", "answer"] });
 * for await (const step of call) render(step.payload);
 * const answer = await call;
 * ```
 *
 * Awaiting the same call twice is safe and yields the same reply; the terminal event is retained.
 *
 * @public
 */
export interface CallHandle<TReply, TProgress> extends Promise<TReply>, AsyncIterable<TProgress> {
  /**
   * Progress events discarded because nothing was iterating.
   *
   * @remarks
   * Zero unless the call was awaited without being iterated *and* the responder streamed more
   * than `highWaterMark` events. Non-zero is not an error — it is the honest count of what a
   * caller chose not to read, and is worth logging rather than guessing at.
   */
  readonly dropped: number;

  /** Stops listening and settles the call. Safe to call more than once. */
  cancel(reason?: string): void;
}

/**
 * Raised when a call goes {@link CallOptions.timeoutMs} without a correlated event.
 *
 * @public
 */
export class CallTimeoutError extends Error {
  readonly channel: string;
  readonly type: string;
  readonly idleMs: number;

  constructor(channel: string, type: string, idleMs: number) {
    super(
      `[yoltra] call to "${channel}/${type}" saw no correlated reply for ${idleMs}ms. ` +
        `The timeout is idle rather than total, so this means the responder went quiet, not ` +
        `that it was slow. Check that something handles "${channel}/${type}" and that its reply ` +
        `is emitted through the \`emit\` it was handed — a reply emitted from an unrelated ` +
        `context carries no causal link, and needs an explicit correlationId instead.`,
    );
    this.name = "CallTimeoutError";
    this.channel = channel;
    this.type = type;
    this.idleMs = idleMs;
  }
}

/**
 * Raised when a call is cancelled, or its {@link CallOptions.signal} aborts.
 *
 * @public
 */
export class CallAbortedError extends Error {
  constructor(reason: string) {
    super(`[yoltra] call aborted: ${reason}`);
    this.name = "CallAbortedError";
  }
}
