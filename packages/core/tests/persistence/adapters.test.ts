/**
 * The storage adapters: thin by design — each takes its storage object rather than reaching
 * for a global, so the tests hand them one and watch the delegation.
 */

import { describe, expect, it, vi } from "vitest";

import { createMemoryAdapter, createWebStorageAdapter } from "../../src/index";

describe("createWebStorageAdapter", () => {
  it("delegates read, write and remove to the storage it was given", () => {
    const storage = {
      getItem: vi.fn(() => "stored"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    const adapter = createWebStorageAdapter(storage);

    expect(adapter.read("k")).toBe("stored");
    adapter.write("k", "v");
    adapter.remove("k");

    expect(storage.getItem).toHaveBeenCalledWith("k");
    expect(storage.setItem).toHaveBeenCalledWith("k", "v");
    expect(storage.removeItem).toHaveBeenCalledWith("k");
  });
});

describe("createMemoryAdapter", () => {
  it("starts from the seed, answers null for a miss, and forgets on remove", () => {
    const adapter = createMemoryAdapter({ seeded: "yes" });

    expect(adapter.read("seeded")).toBe("yes");
    expect(adapter.read("absent")).toBeNull();

    adapter.write("k", "v");
    expect(adapter.read("k")).toBe("v");

    adapter.remove("k");
    expect(adapter.read("k")).toBeNull();
  });

  it("starts empty with no seed", () => {
    expect(createMemoryAdapter().read("anything")).toBeNull();
  });
});
