import { describe, expect, it } from "vitest";

import { CallQueue } from "../../src/store/callQueue";

/**
 * `CallQueue` drives `store.call()`'s backpressure, and its interesting behaviour is entirely in
 * what happens to a **parked producer** when the call stops — which the call-level tests reach
 * only indirectly, because they go through the store. These exercise it directly.
 *
 * The distinction under test is `end()` versus `close()`, and it is the difference between a job
 * delivering all of its steps and silently dropping the last one:
 *
 * - `end()` means "no more is coming". What was already handed over is still owed to the consumer.
 * - `close()` means "abandoned". Nothing is owed — but every parked producer is still released,
 *   because a producer left parked is an `await emit(...)` that never returns, which turns a
 *   timed-out call into a wedged responder.
 */

/** Parks a producer: fills the buffer, then offers one more while a consumer is pulling. */
function withParkedProducer() {
  const q = new CallQueue<string>(1);
  q.beginConsuming();
  void q.put("buffered"); // fills the buffer (highWaterMark of 1)
  let released = false;
  const parked = q.put("parked").then(() => {
    released = true;
  });
  return { q, parked, wasReleased: () => released };
}

describe("CallQueue.end", () => {
  it("still owes the consumer what a parked producer had already handed over", async () => {
    // The bug this prevents: a six-step job delivered five, because the sixth was mid-hand-off
    // when the terminal reply arrived and the queue was cleared outright.
    const { q, parked, wasReleased } = withParkedProducer();

    q.end();
    await parked;

    expect(wasReleased()).toBe(true);
    await expect(q.take()).resolves.toEqual({ value: "buffered", done: false });
    await expect(q.take()).resolves.toEqual({ value: "parked", done: false });
    await expect(q.take()).resolves.toEqual({ value: undefined, done: true });
  });

  it("tells a consumer already waiting that the stream is over", async () => {
    const q = new CallQueue<string>(1);
    const pending = q.take(); // parks: nothing buffered, no producer

    q.end();

    await expect(pending).resolves.toEqual({ value: undefined, done: true });
  });

  it("is idempotent, and a later put is ignored rather than queued forever", async () => {
    const q = new CallQueue<string>(1);
    q.end();
    q.end();

    await expect(q.put("late")).resolves.toBeUndefined();
    await expect(q.take()).resolves.toEqual({ value: undefined, done: true });
  });
});

describe("CallQueue.close", () => {
  it("releases a parked producer so a settled call cannot wedge the responder", async () => {
    const { q, parked, wasReleased } = withParkedProducer();

    q.close();
    await parked;

    // Released, but nothing is owed: close means abandoned, unlike end.
    expect(wasReleased()).toBe(true);
    await expect(q.take()).resolves.toEqual({ value: undefined, done: true });
  });

  it("tells a waiting consumer it is done and discards the buffer", async () => {
    const q = new CallQueue<string>(4);
    void q.put("a");
    const pending = q.take.call(q); // takes "a" straight from the buffer
    await expect(pending).resolves.toEqual({ value: "a", done: false });

    void q.put("b");
    const waiting = q.take();
    await expect(waiting).resolves.toEqual({ value: "b", done: false });

    const parkedTaker = q.take();
    q.close();
    await expect(parkedTaker).resolves.toEqual({ value: undefined, done: true });
  });

  it("is idempotent and wins over a later end", async () => {
    const q = new CallQueue<string>(1);
    q.close();
    q.close();
    q.end(); // no-op: already closed

    await expect(q.take()).resolves.toEqual({ value: undefined, done: true });
  });
});

describe("CallQueue dropping", () => {
  it("counts what it discarded when nobody ever iterated", async () => {
    // Backpressure deliberately does not engage before iteration begins: a call that is only
    // awaited never pulls, so parking its producer would deadlock the call itself.
    const q = new CallQueue<string>(2);

    await q.put("a");
    await q.put("b");
    await q.put("c"); // buffer full and no consumer — dropped rather than parked
    await q.put("d");

    expect(q.droppedCount).toBe(2);
  });

  it("hands over directly with no buffer at all", async () => {
    // highWaterMark 0 is strict lockstep: every put parks, and the consumer takes straight from
    // the parked producer rather than through a buffer. It is the tightest coupling the queue
    // offers, and the only configuration where an item never lands in the buffer.
    const q = new CallQueue<string>(0);
    q.beginConsuming();

    let settled = false;
    void q.put("only").then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false); // parked immediately; there is nowhere to buffer it

    await expect(q.take()).resolves.toEqual({ value: "only", done: false });
    await Promise.resolve();
    expect(settled).toBe(true);
    expect(q.droppedCount).toBe(0);
  });

  it("parks instead of dropping once a consumer has begun", async () => {
    const q = new CallQueue<string>(1);
    q.beginConsuming();
    void q.put("a");

    let settled = false;
    void q.put("b").then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false); // parked, not dropped
    expect(q.droppedCount).toBe(0);

    await expect(q.take()).resolves.toEqual({ value: "a", done: false });
    await Promise.resolve();
    expect(settled).toBe(true); // space freed, producer released
  });
});
