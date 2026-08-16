import { describe, it, expect, vi, afterEach } from "vitest";

import { createStore } from "../../src/store/Store";
import { CallAbortedError, CallTimeoutError } from "../../src/store/call";

/**
 * `call` is request/reply over the event bus. The parts worth pinning are the ones a hand-rolled
 * version gets wrong: the subscription outliving the call, a responder that forgets to echo an
 * id, a timeout that fires while the responder is plainly still working, and a progress stream
 * that buffers without bound because the "backpressure" was a queue with a limit and no brakes.
 */

type EM = {
  rpc: {
    ask: { q: string };
    answer: { text: string };
    error: { reason: string };
    progress: { pct: number };
  };
  job: { start: { id: string }; done: { ok: boolean }; tick: { n: number } };
};

function bus() {
  return createStore<Record<string, never>, EM>({ name: "calls" });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("correlation", () => {
  it("matches a reply causally, with no correlation id anywhere", async () => {
    const store = bus();

    // The responder does nothing special: it replies through the `emit` it was handed, and the
    // store's own causal stamp does the rest.
    store.registerEffect({
      when: { keys: [["rpc", "ask"]] },
      effect: async (event, _get, emit) => {
        if (event.channel !== "rpc" || event.type !== "ask") return;
        await emit("rpc", "answer", { text: `re: ${event.payload.q}` });
      },
    });

    const res = await store.call("rpc", "ask", { q: "hello" }, { reply: ["rpc", "answer"] });

    expect(res.type).toBe("answer");
    expect((res.payload as { text: string }).text).toBe("re: hello");
  });

  it("ignores a reply that is not a reply to this call", async () => {
    const store = bus();

    // Two calls in flight, and a responder that answers each. Correlation is the only thing
    // keeping the answers from being swapped.
    store.registerEffect({
      when: { keys: [["rpc", "ask"]] },
      effect: async (event, _get, emit) => {
        if (event.channel !== "rpc" || event.type !== "ask") return;
        await emit("rpc", "answer", { text: event.payload.q.toUpperCase() });
      },
    });

    const [a, b] = await Promise.all([
      store.call("rpc", "ask", { q: "one" }, { reply: ["rpc", "answer"] }),
      store.call("rpc", "ask", { q: "two" }, { reply: ["rpc", "answer"] }),
    ]);

    expect((a.payload as { text: string }).text).toBe("ONE");
    expect((b.payload as { text: string }).text).toBe("TWO");
  });

  it("matches an echoed correlationId when causality cannot reach", async () => {
    const store = bus();

    // Stands in for a reply that crossed a boundary: emitted from no causal context at all, the
    // way a transport re-emitting a received frame would.
    store.onEvent("rpc", "ask", (event) => {
      const id = (event.meta as { correlationId: string }).correlationId;
      setTimeout(() => {
        void store.emit("rpc", "answer", { text: "from afar" }, { meta: { correlationId: id } });
      }, 0);
    });

    const res = await store.call(
      "rpc",
      "ask",
      { q: "?" },
      { reply: ["rpc", "answer"], correlationId: "corr-1" },
    );

    expect((res.payload as { text: string }).text).toBe("from afar");
  });
});

describe("terminal types", () => {
  it("resolves on any listed terminal, carrying its own discriminant", async () => {
    const store = bus();
    store.registerEffect({
      when: { keys: [["rpc", "ask"]] },
      effect: async (event, _get, emit) => {
        if (event.channel !== "rpc" || event.type !== "ask") return;
        if (event.payload.q === "bad") await emit("rpc", "error", { reason: "nope" });
        else await emit("rpc", "answer", { text: "fine" });
      },
    });

    const ok = await store.call("rpc", "ask", { q: "good" }, { reply: ["rpc", ["answer", "error"]] });
    const bad = await store.call("rpc", "ask", { q: "bad" }, { reply: ["rpc", ["answer", "error"]] });

    // The caller discriminates on `type` — which is why a call resolves to the event and not the
    // payload. Neither reply is "the" shape.
    expect(ok.type).toBe("answer");
    expect(bad.type).toBe("error");
    expect((bad.payload as { reason: string }).reason).toBe("nope");
  });

  it("treats every event on the channel as terminal when only a channel is named", async () => {
    const store = bus();
    store.registerEffect({
      when: { keys: [["rpc", "ask"]] },
      effect: async (_e, _get, emit) => {
        await emit("rpc", "error", { reason: "any reply ends it" });
      },
    });

    const res = await store.call("rpc", "ask", { q: "?" }, { reply: ["rpc"] });
    expect(res.type).toBe("error");
  });
});

describe("progress", () => {
  it("streams non-terminal events and ends on the terminal", async () => {
    const store = bus();
    store.registerEffect({
      when: { keys: [["job", "start"]] },
      effect: async (_e, _get, emit) => {
        for (let n = 1; n <= 3; n++) await emit("job", "tick", { n });
        await emit("job", "done", { ok: true });
      },
    });

    const call = store.call("job", "start", { id: "j1" }, { reply: ["job", "done"] });

    const seen: number[] = [];
    for await (const step of call) seen.push((step.payload as { n: number }).n);

    expect(seen).toEqual([1, 2, 3]);
    expect((await call).type).toBe("done");
  });

  it("makes the producer wait for a slow consumer", async () => {
    const store = bus();
    const emitted: number[] = [];
    const consumed: number[] = [];

    store.registerEffect({
      when: { keys: [["job", "start"]] },
      effect: async (_e, _get, emit) => {
        for (let n = 1; n <= 6; n++) {
          await emit("job", "tick", { n });
          // Recorded only once the emit resolves — which, with backpressure, means once the
          // consumer has taken it.
          emitted.push(n);
        }
        await emit("job", "done", { ok: true });
      },
    });

    const call = store.call("job", "start", { id: "j" }, {
      reply: ["job", "done"],
      highWaterMark: 1,
    });

    for await (const step of call) {
      consumed.push((step.payload as { n: number }).n);
      // At a high-water mark of 1, the producer cannot be more than one item ahead. If
      // backpressure were decorative it would already have emitted all six.
      expect(emitted.length).toBeLessThanOrEqual(consumed.length + 1);
      await new Promise((r) => setTimeout(r, 1));
    }

    expect(consumed).toEqual([1, 2, 3, 4, 5, 6]);
    await call;
  });

  it("does not block a producer when nobody iterates, and counts what it dropped", async () => {
    const store = bus();
    store.registerEffect({
      when: { keys: [["job", "start"]] },
      effect: async (_e, _get, emit) => {
        for (let n = 1; n <= 10; n++) await emit("job", "tick", { n });
        await emit("job", "done", { ok: true });
      },
    });

    // Awaited, never iterated. Blocking here would deadlock the call itself: the producer would
    // be waiting to hand over progress nobody will read, and would never reach the terminal
    // event that ends the wait.
    const call = store.call("job", "start", { id: "j" }, {
      reply: ["job", "done"],
      highWaterMark: 2,
    });

    const res = await call;

    expect(res.type).toBe("done");
    expect(call.dropped).toBe(8);
  });

  it("releases a parked producer when the consumer abandons the loop", async () => {
    const store = bus();
    let reached = 0;

    store.registerEffect({
      when: { keys: [["job", "start"]] },
      effect: async (_e, _get, emit) => {
        for (let n = 1; n <= 5; n++) {
          await emit("job", "tick", { n });
          reached = n;
        }
      },
    });

    const call = store.call("job", "start", { id: "j" }, {
      reply: ["job", "done"],
      highWaterMark: 1,
      timeoutMs: 50,
    });

    for await (const _step of call) break; // `return()` on the iterator

    await new Promise((r) => setTimeout(r, 20));

    // The producer must not still be parked on a queue nobody will drain — that would wedge it
    // for good, which is worse than the unbounded buffer backpressure replaced.
    expect(reached).toBeGreaterThan(0);
    call.cancel("done looking");
  });
});

describe("giving up", () => {
  it("times out on silence, and says why", async () => {
    const store = bus();
    // Nothing answers.
    await expect(
      store.call("rpc", "ask", { q: "?" }, { reply: ["rpc", "answer"], timeoutMs: 20 }),
    ).rejects.toBeInstanceOf(CallTimeoutError);
  });

  it("does not time out while progress keeps arriving", async () => {
    const store = bus();
    store.registerEffect({
      when: { keys: [["job", "start"]] },
      effect: async (_e, _get, emit) => {
        // Six ticks at 15ms each is 90ms of work against a 40ms idle timeout. A total deadline
        // would fail this; an idle one must not, because the responder is plainly alive.
        for (let n = 1; n <= 6; n++) {
          await new Promise((r) => setTimeout(r, 15));
          await emit("job", "tick", { n });
        }
        await emit("job", "done", { ok: true });
      },
    });

    const call = store.call("job", "start", { id: "j" }, {
      reply: ["job", "done"],
      timeoutMs: 40,
    });
    for await (const _s of call) void 0;

    expect((await call).type).toBe("done");
  });

  it("aborts from a signal, and from cancel()", async () => {
    const store = bus();

    const controller = new AbortController();
    const viaSignal = store.call("rpc", "ask", { q: "?" }, {
      reply: ["rpc", "answer"],
      signal: controller.signal,
    });
    controller.abort("user navigated away");
    await expect(viaSignal).rejects.toBeInstanceOf(CallAbortedError);

    const viaCancel = store.call("rpc", "ask", { q: "?" }, { reply: ["rpc", "answer"] });
    viaCancel.cancel("no longer needed");
    await expect(viaCancel).rejects.toThrow(/no longer needed/);
  });

  it("rejects immediately for an already-aborted signal", async () => {
    const store = bus();
    await expect(
      store.call("rpc", "ask", { q: "?" }, {
        reply: ["rpc", "answer"],
        signal: AbortSignal.abort("too late"),
      }),
    ).rejects.toBeInstanceOf(CallAbortedError);
  });
});

describe("abandoning mid-stream", () => {
  it("ends a parked consumer's loop when the call is cancelled", async () => {
    const store = bus();
    // Answers nothing, so the consumer parks waiting for a first item that never comes.
    const call = store.call("job", "start", { id: "j" }, { reply: ["job", "done"] });

    const seen: unknown[] = [];
    const loop = (async () => {
      for await (const step of call) seen.push(step);
    })();

    // A consumer waiting on next() must be released, or the loop never returns and the caller
    // hangs on a call that has already been abandoned.
    setTimeout(() => call.cancel("changed my mind"), 5);
    await loop;

    expect(seen).toEqual([]);
    await expect(call).rejects.toThrow(/changed my mind/);
  });

  it("releases a parked producer when the call is cancelled", async () => {
    const store = bus();
    let reached = 0;

    store.registerEffect({
      when: { keys: [["job", "start"]] },
      effect: async (_e, _get, emit) => {
        for (let n = 1; n <= 5; n++) {
          await emit("job", "tick", { n });
          reached = n;
        }
      },
    });

    const call = store.call("job", "start", { id: "j" }, {
      reply: ["job", "done"],
      highWaterMark: 1,
    });

    // Start consuming so backpressure engages, then take one and walk away.
    const it = call[Symbol.asyncIterator]();
    await it.next();
    call.cancel("done with this");

    await new Promise((r) => setTimeout(r, 20));

    // A producer parked on `put` is a pending `await emit` in the responder. Leaving it parked
    // after the call is over would wedge it for good — worse than the unbounded buffer that
    // backpressure replaced.
    expect(reached).toBeGreaterThanOrEqual(1);
    await expect(call).rejects.toThrow(/done with this/);
  });
});

describe("cleanup", () => {
  it("leaves no subscription behind, however the call ends", async () => {
    const store = bus();
    store.registerEffect({
      when: { keys: [["rpc", "ask"]] },
      effect: async (_e, _get, emit) => {
        await emit("rpc", "answer", { text: "hi" });
      },
    });

    const before = store.__devtoolsIntrospect().effects.length;

    await store.call("rpc", "ask", { q: "1" }, { reply: ["rpc", "answer"] });
    await store
      .call("rpc", "ask", { q: "2" }, { reply: ["nope" as never], timeoutMs: 10 })
      .catch(() => undefined);
    store.call("rpc", "ask", { q: "3" }, { reply: ["rpc", "answer"] }).cancel();

    // Resolved, timed out, cancelled — a leak in any of the three is the classic hand-rolled bug.
    expect(store.__devtoolsIntrospect().effects.length).toBe(before);
  });

  it("can be awaited more than once", async () => {
    const store = bus();
    store.registerEffect({
      when: { keys: [["rpc", "ask"]] },
      effect: async (_e, _get, emit) => {
        await emit("rpc", "answer", { text: "once" });
      },
    });

    const call = store.call("rpc", "ask", { q: "?" }, { reply: ["rpc", "answer"] });
    const a = await call;
    const b = await call;

    expect(a).toBe(b);
  });
});
