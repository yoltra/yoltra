import { describe, expect, it } from "vitest";

import { duplicateStoreIdError } from "../src/handshake";

describe("duplicateStoreIdError", () => {
  it("names the id and says how to resolve it", () => {
    const message = duplicateStoreIdError("Cart");

    expect(message).toContain('Store id "Cart" is already connected');
    expect(message).toContain("distinct storeId");
  });
});
