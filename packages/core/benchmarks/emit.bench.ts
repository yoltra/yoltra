/**
 * End-to-end emit: reduce, diff, notify.
 *
 * @remarks
 * The two subscriber rows are the library's central claim, measured. Fifty subscribers
 * watching paths the event did not touch should cost what zero subscribers cost; fifty
 * watching the path it did touch should cost the notifications. If those two rows ever
 * converge, fine-grained reactivity has stopped being fine-grained.
 *
 * The instrumentation row matters because `instrument` is the seam devtools and persistence
 * both hang off, and it runs inside the synchronous commit.
 */

import { bench, describe } from "vitest";

import { createStore } from "../src/store/Store";
import type { ReducerSpec } from "../src/types";

type EM = { app: { bump: number } };

const KEYS = 100;

const slice = (): ReducerSpec<Record<string, number>, EM> => ({
  state: Object.fromEntries(Array.from({ length: KEYS }, (_, i) => [`k${i}`, 0])),
  when: { any: true },
  // Only `k0` moves, so everything watching k1..k99 must stay asleep.
  reducer: (state, event) => ({ ...state, k0: (event.payload as number) ?? 0 }),
});

function build(subscribers: number, on: (i: number) => string) {
  const store = createStore({ name: "Bench", reducer: { app: slice() } });
  for (let i = 0; i < subscribers; i++) {
    store.connect({ reducer: "app", property: on(i) }, () => undefined);
  }
  return store;
}

describe("emit, 100 state keys, one changed", () => {
  let n = 0;

  const none = build(0, () => "k0");
  bench("no subscribers", async () => {
    await none.emit("app", "bump", n++);
  });

  const untouched = build(50, (i) => `k${(i % (KEYS - 1)) + 1}`);
  bench("50 subscribers on untouched paths", async () => {
    await untouched.emit("app", "bump", n++);
  });

  const watching = build(50, () => "k0");
  bench("50 subscribers on the changed path", async () => {
    await watching.emit("app", "bump", n++);
  });

  const instrumented = build(50, () => "k0");
  instrumented.instrument(() => undefined);
  bench("50 on the changed path, instrumented", async () => {
    await instrumented.emit("app", "bump", n++);
  });
});
