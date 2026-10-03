import { DevtoolsRole, PROTOCOL_VERSION } from "@yoltra/devtools-protocol";
import { createLoopbackHub } from "@yoltra/devtools-ui";
import { render } from "ink-testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "../src/app";
import { EventEmitter } from "../src/components/EventEmitter";
import { EventTimeline } from "../src/components/EventTimeline";
import { MetricsDashboard } from "../src/components/MetricsDashboard";
import { StateTree } from "../src/components/StateTree";
import { SubscriptionsPanel } from "../src/components/SubscriptionsPanel";

/**
 * The terminal panels, rendered with data. Rendering the whole app brought every component into
 * the coverage counts, and these are the cases the app tests do not reach.
 */

const pause = (ms = 30) => new Promise((r) => setTimeout(r, ms));

async function until(fn: () => boolean, label: string): Promise<void> {
  const start = Date.now();
  while (!fn()) {
    if (Date.now() - start > 10_000) throw new Error(`timed out waiting for ${label}`);
    await pause(10);
  }
  await pause(50);
}

const rendered: Array<ReturnType<typeof render>> = [];
afterEach(() => {
  for (const r of rendered.splice(0)) r.unmount();
  vi.restoreAllMocks();
});

function show(node: Parameters<typeof render>[0]) {
  const r = render(node);
  rendered.push(r);
  return r;
}

describe("StateTree", () => {
  it("shows nested values", () => {
    const { lastFrame } = show(
      <StateTree state={{ cart: { items: ["apple"], total: 3, open: true } }} loading={false} />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("cart");
    expect(frame).toContain("apple");
    expect(frame).toContain("3");
  });

  it("shows empty values, cuts deep trees and long arrays short", () => {
    const { lastFrame } = show(
      <StateTree
        loading={false}
        state={{
          none: null,
          missing: undefined,
          big: 10n,
          deep: { a: { b: { c: { d: 1 } } } },
          list: Array.from({ length: 25 }, (_, i) => i),
        }}
      />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("null");
    expect(frame).toContain("undefined");
    expect(frame).toContain("10");
    expect(frame).toContain("...");
    expect(frame).toContain("5 more");
  });

  it("says when it is loading, and when there is nothing", () => {
    expect(show(<StateTree state={null} loading />).lastFrame()).toContain("Loading state");
    expect(show(<StateTree state={null} loading={false} />).lastFrame()).toContain(
      "No state available",
    );
  });
});

describe("the empty panels", () => {
  it("say what is missing rather than showing nothing", () => {
    expect(show(<SubscriptionsPanel data={null} loading />).lastFrame()).toContain("Loading");
    expect(show(<SubscriptionsPanel data={null} loading={false} />).lastFrame()).toContain(
      "No subscription data",
    );
    const empty = show(
      <SubscriptionsPanel
        loading={false}
        data={{ atomic: [], event: [], coarse: 0, reducers: [], effects: [], middleware: [] } as never}
      />,
    ).lastFrame();
    expect(empty).toContain("None");
    expect(show(<MetricsDashboard metrics={null} loading />).lastFrame()).toContain("Loading");
    expect(show(<MetricsDashboard metrics={null} loading={false} />).lastFrame()).toContain(
      "No metrics available",
    );
    expect(show(<EventTimeline entries={[]} />).lastFrame()).toContain("No events recorded");
  });
});

describe("SubscriptionsPanel", () => {
  it("lists every kind of subscriber, and how each middleware is matched", () => {
    const { lastFrame } = show(
      <SubscriptionsPanel
        loading={false}
        data={{
          atomic: [{ reducer: "cart", property: "total" }],
          event: [{ channel: "ui", type: "add", phase: "after" }],
          coarse: 2,
          reducers: [{ name: "cart" }],
          effects: [{ channel: "ui", type: "add", name: "save", description: "persists" }],
          middleware: [
            { name: "guard", description: "blocks", when: { any: true } },
            { when: { channel: "ui" } },
            { when: { channels: ["ui", "net"] } },
            { when: { keys: [["ui", "add"]] } },
            { when: { other: 1 } },
            { when: "raw" },
          ],
        } as never}
      />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("cart.total");
    expect(frame).toContain("ui::add");
    expect(frame).toContain("Coarse Subscribers: 2");
    expect(frame).toContain("when: any");
    expect(frame).toContain("when: channel: ui");
    expect(frame).toContain("channels: ui, net");
    expect(frame).toContain("middleware-1");
  });
});

// Generous, because `rush test` runs every package's suite at once and Ink renders on its own
// schedule.
describe("EventEmitter", { timeout: 30_000 }, () => {
  const frameOf = (r: ReturnType<typeof render>) => r.lastFrame() ?? "";

  /** Types one key at a time, waiting for each to show: two keys before a re-render collide. */
  async function typeInto(r: ReturnType<typeof render>, text: string, after = "") {
    let typed = after;
    for (const ch of text) {
      r.stdin.write(ch);
      typed += ch;
      const expected = typed;
      await until(() => frameOf(r).includes(expected), `"${expected}" to be typed`);
    }
  }

  /** Presses Enter and waits for the field to move on, which the placeholder of the next shows. */
  async function next(r: ReturnType<typeof render>, placeholder: string) {
    r.stdin.write("\r");
    await until(() => frameOf(r).includes(placeholder), `the field with "${placeholder}"`);
  }

  it("walks the fields with Enter and emits the parsed payload", async () => {
    const onEmit = vi.fn();
    const r = show(<EventEmitter onEmit={onEmit} />);
    await until(() => frameOf(r).includes("e.g., counter"), "the form");

    await typeInto(r, "cart");
    await next(r, "e.g., increment");
    await typeInto(r, "add");
    r.stdin.write("\r");
    await pause(100);
    r.stdin.write("\r");

    await until(() => onEmit.mock.calls.length > 0, "the emit");
    expect(onEmit).toHaveBeenCalledWith("cart", "add", {});
    await until(() => frameOf(r).includes("Event emitted!"), "the confirmation");
  });

  it("asks for a channel and a type before emitting", async () => {
    const onEmit = vi.fn();
    const r = show(<EventEmitter onEmit={onEmit} />);
    await until(() => frameOf(r).includes("e.g., counter"), "the form");

    await next(r, "e.g., increment");
    r.stdin.write("\r");
    await pause(100);
    r.stdin.write("\r");

    await until(() => frameOf(r).includes("Channel and type are required"), "the error");
    expect(onEmit).not.toHaveBeenCalled();
  });

  it("refuses a payload that is not JSON", async () => {
    const onEmit = vi.fn();
    const r = show(<EventEmitter onEmit={onEmit} />);
    await until(() => frameOf(r).includes("e.g., counter"), "the form");

    await typeInto(r, "c");
    await next(r, "e.g., increment");
    await typeInto(r, "t");
    r.stdin.write("\r");
    await pause(100);
    await typeInto(r, "x", "{}");
    r.stdin.write("\r");

    await until(() => frameOf(r).includes("Invalid JSON payload"), "the error");
    expect(onEmit).not.toHaveBeenCalled();
  });
});

describe("the global keys outside the Emit form", { timeout: 30_000 }, () => {
  it("cycle stores and step through time travel", async () => {
    const hub = createLoopbackHub();
    const commands: Array<Record<string, unknown>> = [];
    for (const id of ["Cart", "Profile"]) {
      const store = hub.agentSocketFactory("loopback://store", {
        onOpen: () =>
          store.send(
            JSON.stringify({
              type: "HANDSHAKE_REQUEST",
              protocolVersion: PROTOCOL_VERSION,
              role: DevtoolsRole.STORE,
              store: { id, name: id, capabilities: { replay: true } },
            }),
          ),
        onMessage: (raw) => commands.push(JSON.parse(raw) as Record<string, unknown>),
        onClose: () => undefined,
        onError: () => undefined,
      });
    }
    const app = show(<App config={{ port: 0, autoReconnect: false, WebSocket: hub.WebSocket }} />);
    const frame = () => app.lastFrame() ?? "";
    await until(() => frame().includes("Profile"), "both stores");

    // Events, State, Time Travel.
    app.stdin.write("\t");
    await until(() => frame().includes("[State]"), "the State tab");
    app.stdin.write("\t");
    await until(() => frame().includes("[Time Travel]"), "the Time Travel tab");

    for (const key of ["\u001B[D", "\u001B[C", "r", "]", "["]) {
      app.stdin.write(key);
      await pause(50);
    }
    // Shift+Tab back, then the panel still answers.
    app.stdin.write("\u001B[Z");
    await until(() => frame().includes("[State]"), "the State tab again");

    expect(commands.some((m) => m.type === "REQUEST_STATE")).toBe(true);
  });
});
