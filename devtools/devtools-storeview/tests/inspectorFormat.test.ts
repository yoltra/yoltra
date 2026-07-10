import { describe, it, expect } from "vitest";

import { formatPointer, formatValue } from "../src/components/panels/inspectorFormat";

describe("formatPointer", () => {
  it("converts a JSON Pointer to a dotted leaf path", () => {
    expect(formatPointer("/fleet/satellites/0/battery")).toBe(
      "fleet.satellites.0.battery",
    );
  });

  it("treats the empty pointer and '/' as the document root", () => {
    expect(formatPointer("")).toBe("(root)");
    expect(formatPointer("/")).toBe("(root)");
  });

  it("unescapes ~1 to '/' and ~0 to '~'", () => {
    expect(formatPointer("/a~1b/c~0d")).toBe("a/b.c~d");
  });

  it("handles a single top-level segment", () => {
    expect(formatPointer("/tick")).toBe("tick");
  });
});

describe("formatValue", () => {
  it("stringifies JSON values", () => {
    expect(formatValue({ id: "s1", n: 3 })).toBe('{"id":"s1","n":3}');
    expect(formatValue([1, 2])).toBe("[1,2]");
    expect(formatValue("hi")).toBe('"hi"');
  });

  it("reports undefined explicitly", () => {
    expect(formatValue(undefined)).toBe("undefined");
  });

  it("truncates long values with an ellipsis", () => {
    const out = formatValue("x".repeat(200), 80);
    expect(out.endsWith("…")).toBe(true);
    // 80 chars of content + the ellipsis.
    expect(out.length).toBe(81);
  });
});
