import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ReactElement } from "react";

import {
  CodeBlock,
  ContextMenu,
  Dialog,
  Drawer,
  Menu,
  MenuItem,
  MenuSeparator,
  Popover,
  Portal,
  Tabs,
  ThemeProvider,
  Tooltip,
} from "../../src/client";
import { Button } from "../../src/index";

/**
 * The markup the client and overlay tier renders, recorded per variant.
 *
 * @remarks
 * Separate from `dom.test.tsx` because this tier cannot be rendered the same way. An overlay
 * portals out of the tree it is written in, so the interesting markup is not under the render
 * container at all, and most of these components show nothing until they are open. Keeping the
 * two files apart means neither needs a conditional for the other's shape.
 *
 * Portalled output is snapshotted through the `data-yl-portal` marker that `Portal` sets on its
 * root, rather than through `document.body`. The body also holds the testing library's own
 * container, so snapshotting it would record the harness alongside the subject and churn the
 * moment the harness changed.
 *
 * The placement maths reads `getBoundingClientRect`, which jsdom answers with zeroes. The
 * positions recorded here are therefore the degenerate case, and deliberately so: what is being
 * guarded is the element structure and the attribute contract, with `placement.test.ts` already
 * covering the arithmetic properly against synthetic rectangles.
 */

afterEach(cleanup);

/** The portal root, which is where an overlay's markup actually lands. */
function portal(): Element {
  const node = document.querySelector("[data-yl-portal]");
  if (node === null) throw new Error("no portal root was created");
  return node;
}

type Case = readonly [name: string, element: () => ReactElement];

/** Snapshots each case's in-place output, for the components that do not portal. */
function snapshotInPlace(cases: readonly Case[]): void {
  for (const [name, element] of cases) {
    it(name, () => {
      const { container } = render(element());
      expect(container.firstChild).toMatchSnapshot();
    });
  }
}

/** Snapshots each case's portalled output. */
function snapshotPortalled(cases: readonly Case[]): void {
  for (const [name, element] of cases) {
    it(name, () => {
      render(element());
      expect(portal()).toMatchSnapshot();
    });
  }
}

describe("CodeBlock", () => {
  snapshotInPlace([
    ["plain code", () => <CodeBlock code="npm i @yoltra/ds" />],
    ["with a language", () => <CodeBlock code="npm i @yoltra/ds" language="bash" />],
    ["with a title", () => <CodeBlock code="npm i @yoltra/ds" title="Install" />],
    [
      "with pre-highlighted markup",
      () => (
        <CodeBlock language="ts">
          <span className="tok">const</span>
        </CodeBlock>
      ),
    ],
  ]);
});

describe("Tabs", () => {
  const items = [
    { id: "one", label: "One", content: <p>First</p> },
    { id: "two", label: "Two", content: <p>Second</p> },
  ];
  snapshotInPlace([
    ["defaults to the first tab", () => <Tabs items={items} />],
    ["honours defaultId", () => <Tabs items={items} defaultId="two" />],
  ]);
});

describe("ThemeProvider", () => {
  snapshotInPlace([["renders its children untouched", () => <ThemeProvider><p>Body</p></ThemeProvider>]]);
});

describe("Portal", () => {
  snapshotPortalled([["renders its children into a marked root", () => <Portal><p>Body</p></Portal>]]);
});

describe("Dialog", () => {
  const base = {
    open: true,
    onClose: () => {},
    title: "Confirm",
    children: <p>Body</p>,
  } as const;
  snapshotPortalled([
    ...(["sm", "md", "lg", "full"] as const).map((size): Case => [
      `size ${size}`,
      () => <Dialog {...base} size={size} />,
    ]),
    ["with a description", () => <Dialog {...base} description="This cannot be undone." />],
    ["with a footer", () => <Dialog {...base} footer={<Button>Confirm</Button>} />],
    ["without a close button", () => <Dialog {...base} showCloseButton={false} />],
    ["with a custom close label", () => <Dialog {...base} closeLabel="Dismiss" />],
  ]);
});

describe("Drawer", () => {
  const base = {
    open: true,
    onClose: () => {},
    title: "Filters",
    children: <p>Body</p>,
  } as const;
  snapshotPortalled([
    ...(["left", "right", "top", "bottom"] as const).map((side): Case => [
      `side ${side}`,
      () => <Drawer {...base} side={side} />,
    ]),
    ["with an explicit size", () => <Drawer {...base} size="32rem" />],
  ]);
});

describe("Popover", () => {
  snapshotPortalled([
    [
      "open against its trigger",
      () => (
        <Popover
          open
          onClose={() => {}}
          label="Details"
          trigger={(props) => <button {...props}>Open</button>}
        >
          <p>Body</p>
        </Popover>
      ),
    ],
  ]);
});

describe("Menu", () => {
  snapshotPortalled([
    [
      "open with items and a separator",
      () => (
        <Menu open onClose={() => {}} label="Actions" trigger={(props) => <button {...props}>Open</button>}>
          <MenuItem onSelect={() => {}}>Rename</MenuItem>
          <MenuSeparator />
          <MenuItem disabled>Delete</MenuItem>
        </Menu>
      ),
    ],
  ]);
});

describe("ContextMenu", () => {
  snapshotPortalled([
    [
      "open at a point",
      () => (
        <ContextMenu at={{ x: 10, y: 20 }} onClose={() => {}} label="Actions">
          <MenuItem onSelect={() => {}}>Rename</MenuItem>
        </ContextMenu>
      ),
    ],
  ]);
});

describe("Tooltip", () => {
  it("records its surface once the trigger has focus", () => {
    // Focus rather than hover: `delayMs` defaults to 400 and focus deliberately skips it, so
    // this needs no fake timers to reach an open surface.
    render(
      <Tooltip content="Deploy the solar array">
        {(props) => <button {...props}>Deploy</button>}
      </Tooltip>,
    );
    fireEvent.focus(screen.getByRole("button"));
    expect(portal()).toMatchSnapshot();
  });

  it("records the trigger it wires up", () => {
    const { container } = render(
      <Tooltip content="Deploy the solar array">
        {(props) => <button {...props}>Deploy</button>}
      </Tooltip>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
