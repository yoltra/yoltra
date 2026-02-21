import { describe, expect, it } from "vitest";
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
      "createHooks",
    ];

    for (const key of expectedValueKeys) {
      expect(ReactPkg).toHaveProperty(key);
    }
  });
});
