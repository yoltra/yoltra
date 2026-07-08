import { describe, expect, it } from "vitest";

import { RingBuffer } from "../src/ring-buffer";

describe("RingBuffer", () => {
  it("rejects a capacity below 1", () => {
    expect(() => new RingBuffer(0)).toThrow(/capacity/i);
    expect(() => new RingBuffer(-3)).toThrow(/capacity/i);
  });

  it("retains items in insertion order below capacity", () => {
    const buf = new RingBuffer<number>(5);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    expect(buf.size).toBe(3);
    expect(buf.toArray()).toEqual([1, 2, 3]);
  });

  it("overwrites the oldest items once at capacity, oldest-first", () => {
    const buf = new RingBuffer<number>(3);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    buf.push(4); // evicts 1
    buf.push(5); // evicts 2
    expect(buf.size).toBe(3);
    expect(buf.toArray()).toEqual([3, 4, 5]);
  });

  it("caps size at capacity no matter how many are pushed", () => {
    const buf = new RingBuffer<number>(2);
    for (let i = 0; i < 100; i++) buf.push(i);
    expect(buf.size).toBe(2);
    expect(buf.toArray()).toEqual([98, 99]);
  });

  it("clears back to empty", () => {
    const buf = new RingBuffer<string>(3);
    buf.push("a");
    buf.push("b");
    buf.clear();
    expect(buf.size).toBe(0);
    expect(buf.toArray()).toEqual([]);
    // Still usable after clearing.
    buf.push("c");
    expect(buf.toArray()).toEqual(["c"]);
  });

  it("returns a fresh array from toArray (no aliasing of internal state)", () => {
    const buf = new RingBuffer<number>(3);
    buf.push(1);
    const a = buf.toArray();
    a.push(999);
    expect(buf.toArray()).toEqual([1]);
  });
});
