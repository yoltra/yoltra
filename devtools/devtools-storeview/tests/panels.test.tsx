import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EventTimeline } from "../src/components/panels/EventTimeline";
import { Inspector } from "../src/components/panels/Inspector";
import { MetricsDashboard } from "../src/components/panels/MetricsDashboard";
import { StateTreeExplorer } from "../src/components/panels/StateTreeExplorer";
import { SubscriptionsPanel } from "../src/components/panels/SubscriptionsPanel";

/**
 * The panels, rendered with data. Mounting the whole app brought every panel into the coverage
 * counts; these are the paths the mount does not reach without a store behind it.
 */

afterEach(cleanup);

const entry = (id: string, committed: boolean) =>
  ({
    event: { id, channel: "cart", type: committed ? "add" : "remove", payload: { sku: "a1" } },
    storeId: "Cart",
    patches: committed ? [{ op: "replace", path: "/cart/total", value: 3 }] : [],
    snapshotVersion: 1,
    committed,
    ...(committed ? {} : { reason: "vetoed", vetoedBy: "guard" }),
    timestamp: "2026-01-01T00:00:00.000Z",
  }) as never;

const subscriptions = {
  atomic: [{ reducer: "cart", property: "total" }],
  event: [{ channel: "cart", type: "add", phase: "after" }],
  coarse: 1,
  reducers: [{ name: "cart" }],
  effects: [{ channel: "cart", type: "add", name: "save" }],
  middleware: [
    { name: "guard", when: { any: true } },
    { when: { channel: "cart" } },
    { when: { channels: ["cart", "ui"] } },
    { when: { keys: [["cart", "add"]] } },
  ],
} as never;

describe("Inspector", () => {
  it("shows the selected event, and opens the emit composer", () => {
    const onEmit = vi.fn();
    render(<Inspector entries={[entry("e1", true), entry("e2", false)]} canEmit onEmit={onEmit} />);

    fireEvent.click(screen.getAllByText("add")[0]!);
    expect(screen.queryByText(/Select an event/)).toBeNull();

    fireEvent.click(screen.getByText("+ Emit"));
    expect(screen.getByText("Close")).toBeTruthy();
  });

  it("filters by status, and emits from the composer", () => {
    const onEmit = vi.fn();
    render(<Inspector entries={[entry("e1", true), entry("e2", false)]} canEmit onEmit={onEmit} />);

    fireEvent.click(screen.getByText("Committed"));
    expect(screen.queryByText("add")).toBeNull();
    fireEvent.click(screen.getByText("Uncommitted"));
    expect(screen.getByText("No events")).toBeTruthy();

    fireEvent.click(screen.getByText("+ Emit"));
    fireEvent.change(screen.getByPlaceholderText("e.g., counter"), { target: { value: "cart" } });
    fireEvent.change(screen.getByPlaceholderText("e.g., increment"), { target: { value: "add" } });
    fireEvent.change(screen.getByPlaceholderText('{ "amount": 1 }'), {
      target: { value: '{"sku":"a1"}' },
    });
    fireEvent.click(screen.getByText("Emit Event"));

    expect(onEmit).toHaveBeenCalledWith("cart", "add", { sku: "a1" });
    // The composer closes once it has emitted.
    expect(screen.getByText("+ Emit")).toBeTruthy();
  });
});

describe("EventTimeline", () => {
  it("expands the selected entry", () => {
    render(<EventTimeline entries={[entry("e1", true)]} />);

    fireEvent.click(screen.getByText("add"));
    expect(document.body.textContent).toContain("/cart/total");
  });

  it("filters by status", () => {
    render(<EventTimeline entries={[entry("e1", true), entry("e2", false)]} />);

    fireEvent.click(screen.getByText("Committed"));
    expect(screen.queryByText("add")).toBeNull();
    fireEvent.click(screen.getByText("Uncommitted"));
    expect(screen.queryByText("remove")).toBeNull();
  });
});

describe("MetricsDashboard", () => {
  it("shows the live numbers and the registered consumers", () => {
    render(
      <MetricsDashboard
        loading={false}
        subscriptions={subscriptions}
        metrics={{
          eventCount: 12,
          eventsPerSecond: 1.5,
          avgProcessingTimeMs: 0.25,
          reducerCount: 1,
          effectCount: 1,
          middlewareCount: 4,
          subscriberCount: 2,
          connectorCount: 1,
          dedupHits: 0,
          middlewareRejections: 1,
          queueDepth: 0,
        }}
      />,
    );

    expect(screen.getByText("Events/sec")).toBeTruthy();
    expect(document.body.textContent).toContain("cart.total");
  });
});

describe("StateTreeExplorer", () => {
  it("filters the tree by key and collapses a node", () => {
    render(
      <StateTreeExplorer
        loading={false}
        state={{ cart: { total: 3, items: ["a1"] }, profile: { name: "Ana" } }}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Search state..."), { target: { value: "total" } });
    expect(document.body.textContent).not.toContain("profile");

    // The arrow beside an object collapses it.
    const toggles = document.querySelectorAll("[class*='toggle']");
    expect(toggles.length).toBeGreaterThan(0);
    fireEvent.click(toggles[0]!);
  });

  it("collapses an array", () => {
    render(<StateTreeExplorer loading={false} state={{ items: ["a1", "b2"] }} />);

    expect(document.body.textContent).toContain("a1");
    const toggles = document.querySelectorAll("[class*='toggle']");
    fireEvent.click(toggles[toggles.length - 1]!);
    expect(document.body.textContent).toContain("Array(2)");
  });
});

describe("SubscriptionsPanel", () => {
  it("says how each middleware is matched", () => {
    render(<SubscriptionsPanel loading={false} data={subscriptions} />);

    const text = document.body.textContent ?? "";
    expect(text).toContain("cart.total");
    expect(text).toContain("any");
  });
});
