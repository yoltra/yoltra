import { describe, it, expect } from "vitest";
import * as ReactPkg from "../src";

describe("@yoltra/react public API", () => {
  it("exposes expected runtime exports", () => {
    const expectedValueKeys = [
      "StoreProvider",
      "StoreContext",
      "useStore",
      "useEmit",
      "useSelector",
      "useAtomicProp",
      "useAtomicProps",
      "useEvent",
      "shallowEqual",
      "useSuspenseAtomicProp",
      "useSuspenseAtomicProps",
      "invalidateAtomicProp",
      "invalidateAtomicPropsByReducer",
      "clearSuspenseCache",
      "suspenseCache",
      "createQuoHooks",
    ];

    for (const key of expectedValueKeys) {
      expect(ReactPkg).toHaveProperty(key);
    }
  });
});