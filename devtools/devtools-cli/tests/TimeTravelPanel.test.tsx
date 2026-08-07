import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";

import { TimeTravelPanel } from "../src/components/TimeTravelPanel";

/**
 * The terminal panel, actually rendered.
 *
 * The graphical panel had time-travel from the start and the terminal did not, although both
 * consume the same hook — so the same session could be scrubbed in a browser and not in a shell.
 */

const entry = (type: string, i: number) =>
  ({
    event: { id: `e${i}`, channel: "ui", type, payload: null },
    patches: [],
    snapshotVersion: i + 1,
    committed: true,
    timestamp: "2026-01-01T00:00:00.000Z",
  }) as never;

const entries = [entry("first", 0), entry("second", 1), entry("third", 2)];

describe("TimeTravelPanel (terminal)", () => {
  it("explains itself when the store cannot replay", () => {
    const { lastFrame } = render(
      <TimeTravelPanel entries={entries} currentIndex={0} isTimeTraveling={false} canReplay={false} />,
    );

    // Better than an empty panel: the capability is off by default, so most stores land here and
    // the reason is not obvious.
    expect(lastFrame()).toContain("allowReplay");
  });

  it("shows the position and the event at it", () => {
    const { lastFrame } = render(
      <TimeTravelPanel entries={entries} currentIndex={1} isTimeTraveling canReplay />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Event 2 / 3");
    expect(frame).toContain("ui.second");
    expect(frame).toContain("time-travelling");
  });

  it("tracks the live end of the log when not travelling", () => {
    const { lastFrame } = render(
      <TimeTravelPanel entries={entries} currentIndex={-1} isTimeTraveling={false} canReplay />,
    );

    expect(lastFrame()).toContain("Event 3 / 3");
  });

  it("measures against the frozen frame while travelling", () => {
    // A live store keeps emitting; measuring against the current length would slide the position
    // out from under whoever is reading it.
    const { lastFrame } = render(
      <TimeTravelPanel
        entries={[...entries, entry("later", 3)]}
        currentIndex={1}
        isTimeTraveling
        frameCount={3}
        canReplay
      />,
    );

    expect(lastFrame()).toContain("Event 2 / 3");
  });

  it("says when nothing has been recorded", () => {
    const { lastFrame } = render(
      <TimeTravelPanel entries={[]} currentIndex={-1} isTimeTraveling={false} canReplay />,
    );

    expect(lastFrame()).toContain("No events recorded yet");
  });

  it("shows the keys that drive it", () => {
    const { lastFrame } = render(
      <TimeTravelPanel entries={entries} currentIndex={0} isTimeTraveling canReplay />,
    );

    // A terminal has no slider to drag, so the bindings have to be on screen.
    expect(lastFrame()).toContain("resume live");
  });
});
