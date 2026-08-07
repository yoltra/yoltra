/**
 * The diff is on the hot path of every commit, so its cost is the store's cost.
 *
 * @remarks
 * The array cases are the interesting ones. Updating one element of a thousand is cheap;
 * `unshift` on the same array moves every element into a different slot and the diff honestly
 * reports nearly every index as changed. The normalised case beside it is what
 * `createEntityAdapter` exists to make available, and the gap between them is the argument for
 * it stated in numbers rather than prose.
 */

import { bench, describe } from "vitest";

import { createEntityAdapter } from "../src/entity/entityAdapter";
import { detectChangedProps } from "../src/utils/detectChangedProps";

const wide = (n: number, bump = -1): Record<string, number> =>
  Object.fromEntries(Array.from({ length: n }, (_, i) => [`k${i}`, i === bump ? i + 1 : i]));

function deep(levels: number, leaf: number): unknown {
  let node: unknown = { leaf };
  for (let i = 0; i < levels; i++) node = { nested: node };
  return node;
}

interface Row {
  id: string;
  title: string;
  done: boolean;
}

const rows = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({ id: `e${i}`, title: `t${i}`, done: false }));

describe("objects", () => {
  const a = wide(200);
  const b = wide(200, 100);
  bench("wide object, 200 keys, one changed", () => {
    detectChangedProps(a, b);
  });

  const deepA = deep(10, 1);
  const deepB = deep(10, 2);
  bench("deep object, 10 levels, leaf changed", () => {
    detectChangedProps(deepA, deepB);
  });
});

describe("1000 rows: positional array against normalised", () => {
  // One group on purpose, so the comparison the entity adapter exists to make is reported
  // rather than left for a reader to compute across two tables.
  const array = rows(1000);
  const arrayUpdated = array.map((r, i) => (i === 500 ? { ...r, done: true } : r));
  const arrayShifted = [{ id: "new", title: "new", done: false }, ...array];

  const adapter = createEntityAdapter<Row>();
  const normalised = adapter.setAll(adapter.getInitialState(), rows(1000));
  const normalisedUpdated = adapter.updateOne(normalised, { id: "e500", changes: { done: true } });
  const normalisedAdded = adapter.addOne(normalised, { id: "new", title: "new", done: false });

  bench("array: update one", () => {
    detectChangedProps(array, arrayUpdated);
  });

  bench("array: insert at front", () => {
    // Every index now holds a different value, so the diff reports nearly all of them.
    // Honest, and expensive — which is the case the adapter answers.
    detectChangedProps(array, arrayShifted);
  });

  bench("normalised: update one", () => {
    detectChangedProps(normalised, normalisedUpdated);
  });

  bench("normalised: insert", () => {
    detectChangedProps(normalised, normalisedAdded);
  });
});
