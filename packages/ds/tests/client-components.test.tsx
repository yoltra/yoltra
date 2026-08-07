import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CodeBlock, Tabs } from "../src/client";

afterEach(cleanup);

describe("Tabs", () => {
  const items = [
    { id: "npm", label: "npm", content: <p>npm install</p> },
    { id: "pnpm", label: "pnpm", content: <p>pnpm add</p> },
  ];

  it("shows the first panel by default", () => {
    render(<Tabs items={items} />);
    expect(screen.getByRole("tabpanel").textContent).toBe("npm install");
  });

  it("honours defaultId", () => {
    render(<Tabs items={items} defaultId="pnpm" />);
    expect(screen.getByRole("tabpanel").textContent).toBe("pnpm add");
  });

  it("switches panel on click, and says which tab is selected", () => {
    render(<Tabs items={items} />);
    fireEvent.click(screen.getByRole("tab", { name: "pnpm" }));

    expect(screen.getByRole("tabpanel").textContent).toBe("pnpm add");
    expect(screen.getByRole("tab", { name: "pnpm" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "npm" }).getAttribute("aria-selected")).toBe("false");
  });

  it("falls back to the first tab when defaultId names one that is not there", () => {
    render(<Tabs items={items} defaultId="yarn" />);
    expect(screen.getByRole("tabpanel").textContent).toBe("npm install");
  });

  it("renders nothing rather than throwing on an empty list", () => {
    render(<Tabs items={[]} />);
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
  });
});

describe("CodeBlock", () => {
  it("shows the code and a named copy button", () => {
    render(<CodeBlock code="npm i @yoltra/core" />);
    expect(screen.getByText("npm i @yoltra/core")).toBeDefined();
    expect(screen.getByRole("button", { name: "Copy code" })).toBeDefined();
  });

  it("labels the header with the title, then the language, then a fallback", () => {
    const { rerender, container } = render(<CodeBlock code="x" title="store.ts" language="ts" />);
    const head = () => container.querySelector(".yl-code__head span")?.textContent;
    expect(head()).toBe("store.ts");

    rerender(<CodeBlock code="x" language="ts" />);
    expect(head()).toBe("ts");

    rerender(<CodeBlock code="x" />);
    expect(head()).toBe("code");
  });

  it("copies, and says so", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    render(<CodeBlock code="npm i @yoltra/core" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));

    expect(writeText).toHaveBeenCalledWith("npm i @yoltra/core");
    await waitFor(() => expect(screen.getByRole("button").textContent).toContain("Copied"));
    vi.unstubAllGlobals();
  });

  it("does nothing when there is no clipboard to write to", () => {
    // A browser without the API, or an insecure context. Reaching for it unguarded throws
    // during a click handler, which React reports as an unhandled error.
    vi.stubGlobal("navigator", {});
    render(<CodeBlock code="x" />);
    expect(() => fireEvent.click(screen.getByRole("button"))).not.toThrow();
    vi.unstubAllGlobals();
  });

  it("does nothing when there is no code to copy", () => {
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<CodeBlock />);
    fireEvent.click(screen.getByRole("button"));
    expect(writeText).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("renders pre-highlighted markup instead of the raw code when given it", () => {
    render(
      <CodeBlock code="const a = 1;">
        <pre data-testid="highlighted">
          <code>highlighted</code>
        </pre>
      </CodeBlock>,
    );
    expect(screen.getByTestId("highlighted")).toBeDefined();
    expect(screen.queryByText("const a = 1;")).toBeNull();
  });
});
