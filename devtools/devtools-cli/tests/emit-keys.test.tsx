import { DevtoolsRole, PROTOCOL_VERSION } from "@yoltra/devtools-protocol";
import { createLoopbackHub } from "@yoltra/devtools-ui";
import { render } from "ink-testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";

import { App } from "../src/app";

/**
 * The global keys and the Emit form.
 *
 * `q`, `[`, `]` and Tab are bound for the whole app, and the Emit tab is three text fields. With
 * nothing between them, typing a payload such as `["a"]` switched stores, Tab left the form in
 * the middle of a field, and any `q` in a channel, a type or a payload quit the program. The
 * form now holds the keyboard while it is focused, and Esc hands it back.
 */

const ESC = "\u001B";
const TAB = "\t";

const pause = (ms = 30) => new Promise((r) => setTimeout(r, ms));

/**
 * Waits for a frame, then a little longer. Ink attaches and detaches its input handlers in
 * effects that run after the frame is drawn, so a key written the moment a frame appears can
 * still reach the handlers of the frame before it.
 */
async function until(fn: () => boolean, label: string): Promise<void> {
  const start = Date.now();
  while (!fn()) {
    if (Date.now() - start > 10_000) throw new Error(`timed out waiting for ${label}`);
    await pause(10);
  }
  // Long enough for the effects of a loaded machine: a key written before they run reaches the
  // previous frame's handlers, which is how a `[` once switched stores mid-payload in this test.
  await pause(150);
}

/** A loopback hub with one store attached, so the panels have something to show. */
function hubWithStore() {
  const hub = createLoopbackHub();
  const store = hub.agentSocketFactory("loopback://store", {
    onOpen: () =>
      store.send(
        JSON.stringify({
          type: "HANDSHAKE_REQUEST",
          protocolVersion: PROTOCOL_VERSION,
          role: DevtoolsRole.STORE,
          store: { id: "s1", name: "Counter", capabilities: { emit: true } },
        }),
      ),
    onMessage: () => undefined,
    onClose: () => undefined,
    onError: () => undefined,
  });
  return hub;
}

let exit: MockInstance<typeof process.exit>;
let app: ReturnType<typeof render> | undefined;

beforeEach(() => {
  exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  vi.restoreAllMocks();
});

async function openEmitTab() {
  const hub = hubWithStore();
  app = render(<App config={{ port: 0, autoReconnect: false, WebSocket: hub.WebSocket }} />);
  const frame = () => app?.lastFrame() ?? "";
  await until(() => frame().includes("Counter"), "the store to appear");

  for (const tab of ["State", "Time Travel", "Subscriptions", "Metrics", "Emit"]) {
    app.stdin.write(TAB);
    await until(() => frame().includes(`[${tab}]`), `the ${tab} tab`);
  }
  // The form's own hint is what says it holds the keyboard; the tab label alone appears a render earlier.
  await until(() => frame().includes("Esc: leave the form"), "the form to take the keyboard");
  return { stdin: app.stdin, frame };
}

/**
 * Types into the focused field one key at a time, waiting for each to show. The text field reads
 * its value from the last render, so two keys delivered before a re-render overwrite each other.
 */
async function type(
  stdin: { write: (s: string) => void },
  frame: () => string,
  text: string,
): Promise<void> {
  let typed = "";
  for (const ch of text) {
    stdin.write(ch);
    typed += ch;
    const expected = typed;
    await until(() => frame().includes(expected), `"${expected}" to be typed`);
  }
}

// Generous, because the first render pays for loading Ink and the app, and `rush test` runs every
// package's suite at once.
describe("the Emit form", { timeout: 30_000 }, () => {
  it("keeps q, [, ] and Tab while a field has focus", async () => {
    const { stdin, frame } = await openEmitTab();

    await type(stdin, frame, "q[]");
    stdin.write(TAB);
    await pause(100);

    expect(exit).not.toHaveBeenCalled();
    expect(frame()).toContain("[Emit]");
    expect(frame()).toContain("q[]");
  });

  it("hands the keyboard back on Esc", async () => {
    const { stdin, frame } = await openEmitTab();

    stdin.write(ESC);
    await until(() => frame().includes("Enter: edit the form"), "the form to let go");

    stdin.write(TAB);
    await until(() => frame().includes("[Events]"), "Tab to switch panels again");

    // Back on the form, it has the keyboard again.
    stdin.write("\u001B[Z"); // Shift+Tab
    await until(() => frame().includes("[Emit]"), "the Emit tab again");
    await type(stdin, frame, "q");
    await pause(100);
    expect(exit).not.toHaveBeenCalled();
  });

  it("quits on q once the form has let go", async () => {
    const { stdin, frame } = await openEmitTab();

    stdin.write(ESC);
    await until(() => frame().includes("Enter: edit the form"), "the form to let go");
    stdin.write("q");
    await until(() => exit.mock.calls.length > 0, "the quit");

    expect(exit).toHaveBeenCalledWith(0);
  });

  it("takes the keyboard back on Enter", async () => {
    const { stdin, frame } = await openEmitTab();

    stdin.write(ESC);
    await until(() => frame().includes("Enter: edit the form"), "the form to let go");
    stdin.write("\r");
    await until(() => frame().includes("Esc: leave the form"), "the form to take the keyboard");
    await type(stdin, frame, "q");
    await pause(100);

    expect(exit).not.toHaveBeenCalled();
  });
});
