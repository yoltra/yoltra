import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Input, Label, Table, TableScroll, TBody, TD, TH, THead, TR } from "../src/index";
import { Tooltip } from "../src/client";

/**
 * Contracts that are accessibility decisions rather than appearance.
 *
 * @remarks
 * Each of these was added because a consuming project had to work around its absence, and each is
 * the kind of thing that looks finished on screen while being unusable by keyboard or screen
 * reader. Asserted here rather than left to a snapshot, because a snapshot records what the markup
 * is and not what it has to be.
 */

afterEach(cleanup);

describe("a tooltip trigger is reachable by keyboard", () => {
  it("supplies tabIndex, so a non-focusable trigger still opens it", () => {
    render(
      <Tooltip content="Deploy">
        {/* A span is the case that matters: a button is focusable already. */}
        {(props) => <span {...props}>info</span>}
      </Tooltip>,
    );
    expect(screen.getByText("info").getAttribute("tabindex")).toBe("0");
  });

  it("describes rather than labels, and only while the tooltip exists", () => {
    render(
      <Tooltip content="Deploy the solar array">
        {(props) => <button {...props}>Deploy</button>}
      </Tooltip>,
    );
    const trigger = screen.getByRole("button", { name: "Deploy" });

    // Labelling with a tooltip would leave the control nameless the moment the tooltip closed.
    expect(trigger.hasAttribute("aria-label")).toBe(false);
    // And pointing at an element that is not in the document is worse than pointing at nothing,
    // so the attribute appears with the tooltip and goes with it.
    expect(trigger.hasAttribute("aria-describedby")).toBe(false);

    fireEvent.focus(trigger);
    expect(trigger.getAttribute("aria-describedby")).toBe(screen.getByRole("tooltip").id);
  });
});

describe("a scrollable table is a named region", () => {
  it("is focusable and labelled, so it can be scrolled from the keyboard", () => {
    render(
      <TableScroll label="Published packages">
        <Table>
          <TBody>
            <TR>
              <TD>core</TD>
            </TR>
          </TBody>
        </Table>
      </TableScroll>,
    );
    const region = screen.getByRole("region", { name: "Published packages" });
    // Focusable without a name would be a tab stop that announces nothing, which is why `label`
    // is required rather than optional.
    expect(region.getAttribute("tabindex")).toBe("0");
  });
});

describe("numeric cells", () => {
  it("marks both header and body cells, so the column aligns as one", () => {
    render(
      <Table>
        <THead>
          <TR>
            <TH scope="col" numeric>
              Size
            </TH>
          </TR>
        </THead>
        <TBody>
          <TR>
            <TD numeric>12.5</TD>
          </TR>
        </TBody>
      </Table>,
    );
    expect(screen.getByRole("columnheader").className).toContain("yl-th--numeric");
    expect(screen.getByRole("cell").className).toContain("yl-td--numeric");
  });

  it("leaves a prose cell without a class attribute at all", () => {
    render(
      <Table>
        <TBody>
          <TR>
            <TD>core</TD>
          </TR>
        </TBody>
      </Table>,
    );
    // An empty `class=""` is noise in the inspector and in every snapshot that records it.
    expect(screen.getByRole("cell").hasAttribute("class")).toBe(false);
  });
});

describe("Label", () => {
  it("associates with its control through htmlFor", () => {
    render(
      <>
        <Label htmlFor="host">Hub host</Label>
        <Input id="host" />
      </>,
    );
    // The association is what makes clicking the label focus the field, and what lets a screen
    // reader announce the field's name.
    expect(screen.getByLabelText("Hub host")).toBe(screen.getByRole("textbox"));
  });

  it("keeps a caller's class alongside its own", () => {
    render(
      <Label htmlFor="host" className="mine">
        Hub host
      </Label>,
    );
    const label = screen.getByText("Hub host");
    expect(label.className).toContain("yl-label");
    expect(label.className).toContain("mine");
  });
});
