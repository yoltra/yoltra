import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TimeTravelPanel } from "../src/components/panels/TimeTravelPanel";
import type { TimeTravelPanelProps } from "../src/components/panels/TimeTravelPanel";

/**
 * The panel's own behaviour, rendered.
 *
 * Nearly three thousand lines of this package had no test that rendered anything, so every
 * conditional in it — a disabled control, an action shown only when the store supports it — was
 * asserted by reading the source and hoping.
 */

const entry = (channel: string, type: string, i: number) =>
  ({
    event: { id: `e${i}`, channel, type, payload: null },
    patches: [],
    snapshotVersion: i + 1,
    committed: true,
    timestamp: "2026-01-01T00:00:00.000Z",
  }) as never;

const noop = () => undefined;

function renderPanel(overrides: Partial<TimeTravelPanelProps> = {}) {
  const props: TimeTravelPanelProps = {
    entries: [entry("ui", "a", 0), entry("ui", "b", 1), entry("ui", "c", 2)],
    currentIndex: 1,
    isTimeTraveling: false,
    previewState: { n: 1 },
    frameCount: null,
    onJumpTo: noop,
    onStepBack: noop,
    onStepForward: noop,
    onResume: noop,
    ...overrides,
  };
  return render(<TimeTravelPanel {...props} />);
}

// Auto-cleanup only happens when the framework exposes globals; without it each render
// stacks in the same document and every query matches twice.
afterEach(cleanup);

describe("TimeTravelPanel", () => {
  it("shows the position within the recorded history", () => {
    renderPanel();
    expect(screen.getByText(/Event 3 \/ 3/)).toBeDefined();
  });

  it("offers Resume only while actually time-travelling", () => {
    const live = renderPanel();
    expect(live.queryByText("Resume Live")).toBeNull();
    cleanup();

    renderPanel({ isTimeTraveling: true });
    expect(screen.getByText("Resume Live")).toBeDefined();
  });

  it("hides the replay action when the caller does not offer one", () => {
    // Replay is gated on the store's capability, so a panel pointed at a store that cannot do it
    // must not show a button that would silently do nothing.
    renderPanel();
    expect(screen.queryByText("Replay events")).toBeNull();
  });

  it("shows the replay action and calls it", async () => {
    const onReplay = vi.fn();
    renderPanel({ onReplay });

    const button = screen.getByText("Replay events");
    button.click();

    expect(onReplay).toHaveBeenCalledOnce();
  });

  it("disables stepping back at the start of history", () => {
    renderPanel({ entries: [], frameCount: 0 });
    const back = screen.getByText("‹ Back") as HTMLButtonElement;
    expect(back.disabled).toBe(true);
  });

  it("says so when nothing has been recorded", () => {
    renderPanel({ entries: [], frameCount: 0 });
    expect(screen.getByText("No events recorded yet")).toBeDefined();
  });
});
