import { createServer } from "node:net";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";

import { createStore, type ReducerSpec } from "@yoltra/core";
import { DevtoolsHub } from "@yoltra/devtools-server";

import { withNodetools } from "../src/withNodetools";

/**
 * A hub started with a token refuses every handshake without it, so the agent has to present
 * the token it was given. It used to accept `authToken` and drop it, which left a store unable
 * to attach to such a hub even with the right value.
 */

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.on("error", reject);
    srv.listen(0, () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

async function waitFor(fn: () => boolean, timeout = 3000): Promise<boolean> {
  const start = Date.now();
  while (!fn()) {
    if (Date.now() - start > timeout) return false;
    await new Promise((r) => setTimeout(r, 20));
  }
  return true;
}

type EM = { ui: { increment: number } };

const counterSpec: ReducerSpec<{ value: number }, EM> = {
  state: { value: 0 },
  when: { keys: [["ui", "increment"]] },
  reducer: (s, e) => (e.type === "increment" ? { value: s.value + (e.payload as number) } : s),
};

describe("an agent attaching to a hub that requires a token", () => {
  const cleanups: Array<() => void | Promise<void>> = [];
  let error: MockInstance<typeof console.error>;

  beforeEach(() => {
    // The hub warns when it refuses a client, and the agent reports the refused handshake; both
    // are provoked on purpose below.
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    for (const c of cleanups.splice(0).reverse()) await c();
    vi.restoreAllMocks();
  });

  async function attach(hubToken: string, agentToken: string) {
    const port = await getFreePort();
    const hub = new DevtoolsHub({ port, authToken: hubToken });
    await hub.start();
    cleanups.push(() => hub.stop());

    const store = createStore({ name: "auth-counter", reducer: { counter: counterSpec } });
    withNodetools(store, { port, authToken: agentToken, autoReconnect: false });
    cleanups.push(() => store.dispose());
    return hub;
  }

  it("registers when it presents the right token", async () => {
    const hub = await attach("s3cret", "s3cret");
    expect(await waitFor(() => hub.storeCount === 1)).toBe(true);
  });

  it("is refused when it presents the wrong token", async () => {
    const hub = await attach("s3cret", "wrong");
    // The refusal is what ends the wait: the agent reports the handshake it lost.
    expect(await waitFor(() => error.mock.calls.length > 0)).toBe(true);
    expect(hub.storeCount).toBe(0);
  });
});
