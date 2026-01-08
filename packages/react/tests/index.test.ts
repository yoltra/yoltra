import { describe, it, expect } from "vitest";
import * as ReactPkg from "../src";

describe("@quojs/react public API", () => {
  it("exposes expected runtime exports", () => {
    const expectedValueKeys = [
      "StoreProvider",
      "StoreContext",
      "useStore",
      "useEmit",
      "useSelector",
      "useAtomicProp",
      "useAtomicProps",
      "shallowEqual",
      "useDispatch",
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