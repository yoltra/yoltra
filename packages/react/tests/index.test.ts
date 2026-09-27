import { describe, expect, it } from "vitest";
import * as ReactPkg from "../src";

describe("@yoltra/react public API", () => {
  it("exposes expected runtime exports", () => {
    // Asserted both ways. A `toHaveProperty` loop only catches a *removal*, so the list had
    // drifted: `createYoltra` and the entity hooks were exported and absent from it, which
    // is exactly the gap a one-way check leaves open.
    const expectedValueKeys = [
      "StoreProvider",
      "StoreContext",
      "useStore",
      "useEmit",
      "useSelector",
      "useEvent",
      "shallowEqual",
      "invalidateAtomicProp",
      "invalidateAtomicPropsByReducer",
      "clearSuspenseCache",
      "suspenseCache",
      "createHooks",
      "createYoltra",
      "withSlice",
      "withMiddleware",
      "withEffect",
      "useEntity",
      "useEntityField",
      "useEntityIds",
    ];

    for (const key of expectedValueKeys) {
      expect(ReactPkg).toHaveProperty(key);
    }

    // And nothing beyond it: a new export reaches consumers whether or not anyone meant it to.
    expect(Object.keys(ReactPkg).sort()).toEqual([...expectedValueKeys].sort());
  });
});
