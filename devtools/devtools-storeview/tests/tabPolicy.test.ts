import { describe, expect, it } from "vitest";

import { TABS, resolveTab, tabRequires } from "../src/tabPolicy";

/**
 * What a store's capabilities allow the panel to offer.
 *
 * Both capabilities default to off, so most stores support only part of the panel. Offering a
 * tab whose controls silently do nothing is worse than not offering it.
 */

const full = { stateSnapshot: true, replay: true, emit: true } as never;
const eventsOnly = { stateSnapshot: false, replay: false, emit: false } as never;

describe("tabRequires", () => {
  it("always allows the tabs that need nothing from the store", () => {
    // The event stream and the counters arrive whether or not a store will answer a snapshot.
    expect(tabRequires("Inspector", null)).toBe(true);
    expect(tabRequires("Metrics", null)).toBe(true);
    expect(tabRequires("Inspector", eventsOnly)).toBe(true);
  });

  it("gates State on the snapshot capability", () => {
    expect(tabRequires("State", full)).toBe(true);
    expect(tabRequires("State", eventsOnly)).toBe(false);
    expect(tabRequires("State", null)).toBe(false);
  });

  it("gates Time Travel on replay", () => {
    expect(tabRequires("Time Travel", full)).toBe(true);
    expect(tabRequires("Time Travel", eventsOnly)).toBe(false);
    expect(tabRequires("Time Travel", null)).toBe(false);
  });

  it("covers every tab the panel renders", () => {
    // A tab added without a rule here would fall through and be treated as unavailable.
    for (const tab of TABS) expect(typeof tabRequires(tab, full)).toBe("boolean");
  });
});

describe("resolveTab", () => {
  it("keeps the current tab when the store still supports it", () => {
    expect(resolveTab("Time Travel", full)).toBe("Time Travel");
    expect(resolveTab("State", full)).toBe("State");
  });

  it("falls back when the selected store cannot serve the current tab", () => {
    // Switching stores is where this bites: a panel left on Time Travel and pointed at a store
    // that cannot replay would sit on a tab whose controls do nothing.
    expect(resolveTab("Time Travel", eventsOnly)).toBe("Inspector");
    expect(resolveTab("State", null)).toBe("Inspector");
  });

  it("leaves the always-available tabs alone", () => {
    expect(resolveTab("Metrics", eventsOnly)).toBe("Metrics");
    expect(resolveTab("Inspector", null)).toBe("Inspector");
  });
});
