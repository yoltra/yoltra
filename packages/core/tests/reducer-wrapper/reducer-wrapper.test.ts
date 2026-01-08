import { describe, it, expect } from "vitest";
import { Reducer } from "../../src/reducer/Reducer";
import type { EventUnion, EventMapBase } from "../../src/types";

type EM = {
  math: { add: number; set: number };
};

type State = { value: number };

describe("Reducer wrapper", () => {
  it("calls the underlying reducer and returns its result", () => {
    const calls: Array<{ state: State; event: EventUnion<EM> }> = [];

    const rf = (state: State, event: EventUnion<EM>): State => {
      calls.push({ state, event });
      if (event.channel === "math" && event.type === "add") {
        return { value: state.value + event.payload as number };
      }
      if (event.channel === "math" && event.type === "set") {
        return { value: event.payload as number };
      }
      return state;
    };

    const reducer = new Reducer<State, EM>(rf);
    const s0: State = { value: 0 };

    const addEvent: EventUnion<EM> = {
      channel: "math",
      type: "add",
      payload: 2,
      id: Symbol("evt"),
    } as any;

    const s1 = reducer.reduce(s0, addEvent);
    expect(s1).toEqual({ value: 2 });
    expect(calls).toHaveLength(1);
    expect(calls[0].state).toBe(s0);
    expect(calls[0].event).toBe(addEvent);
  });

  it("returns the same reference when the inner reducer does so", () => {
    const rf = (state: State, _event: EventUnion<EM>): State => state;
    const reducer = new Reducer<State, EM>(rf);
    const s0: State = { value: 10 };

    const evt: EventUnion<EM> = {
      channel: "math",
      type: "add",
      payload: 5,
      id: Symbol("evt"),
    } as any;

    const s1 = reducer.reduce(s0, evt);
    expect(s1).toBe(s0);
  });
});
