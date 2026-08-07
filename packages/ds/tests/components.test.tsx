import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  Badge,
  Button,
  ButtonGroup,
  ButtonLink,
  Callout,
  Card,
  Checkbox,
  Container,
  Divider,
  EmptyState,
  Fieldset,
  FormField,
  Grid,
  Heading,
  IconButton,
  Inline,
  InlineCode,
  Input,
  Kbd,
  Link,
  Radio,
  RadioGroup,
  Select,
  Skeleton,
  Slider,
  Spinner,
  Stack,
  Switch,
  Table,
  TBody,
  TD,
  Text,
  Textarea,
  TH,
  THead,
  TR,
  VisuallyHidden,
} from "../src/index";

// Auto-cleanup only runs when the framework exposes globals; without this each render stacks
// in the same document and every query matches twice.
afterEach(cleanup);

describe("each primitive renders the element it claims", () => {
  const cases: Array<[string, React.ReactElement, string]> = [
    ["Stack", <Stack key="a">x</Stack>, "yl-stack"],
    ["Inline", <Inline key="a">x</Inline>, "yl-inline"],
    ["Grid", <Grid key="a">x</Grid>, "yl-grid"],
    ["Container", <Container key="a">x</Container>, "yl-container"],
    ["Card", <Card key="a">x</Card>, "yl-card"],
    ["Heading", <Heading key="a">x</Heading>, "yl-heading"],
    ["Text", <Text key="a">x</Text>, "yl-text"],
    ["InlineCode", <InlineCode key="a">x</InlineCode>, "yl-inline-code"],
    ["Kbd", <Kbd key="a">x</Kbd>, "yl-kbd"],
    ["Badge", <Badge key="a">x</Badge>, "yl-badge"],
    ["Button", <Button key="a">x</Button>, "yl-btn"],
    ["VisuallyHidden", <VisuallyHidden key="a">x</VisuallyHidden>, "yl-visually-hidden"],
  ];

  for (const [name, element, expected] of cases) {
    it(name, () => {
      const { container } = render(element);
      expect(container.firstElementChild).toHaveProperty("className");
      expect((container.firstElementChild as HTMLElement).className).toContain(expected);
    });
  }

  it("keeps a caller's className alongside its own", () => {
    // Losing it is the classic wrapper bug: the component looks right in isolation and cannot
    // be adjusted anywhere it is used.
    const { container } = render(<Card className="mine">x</Card>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain("yl-card");
    expect(el.className).toContain("mine");
  });

  it("renders the element `as` asks for", () => {
    const { container } = render(<Stack as="ul">x</Stack>);
    expect(container.firstElementChild?.tagName).toBe("UL");
  });
});

describe("headings keep the outline separate from the appearance", () => {
  it("renders the level it is given", () => {
    render(<Heading level={3}>Routes</Heading>);
    expect(screen.getByRole("heading", { level: 3 })).toBeDefined();
  });

  it("lets the size differ without demoting the level", () => {
    // The point: a section that should look small stays the heading it structurally is,
    // instead of leaving a hole in the outline that a reader navigates by.
    render(
      <Heading level={2} size="xs">
        Small but second
      </Heading>,
    );
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.className).toContain("yl-heading--xs");
  });
});

describe("links that leave the site", () => {
  it("adds noopener with a blank target", () => {
    render(
      <Link href="https://example.com" external>
        out
      </Link>,
    );
    const anchor = screen.getByRole("link");
    expect(anchor.getAttribute("target")).toBe("_blank");
    expect(anchor.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("leaves an internal link alone", () => {
    render(<Link href="/docs">in</Link>);
    expect(screen.getByRole("link").getAttribute("target")).toBeNull();
  });

  it("ButtonLink stays an anchor", () => {
    render(<ButtonLink href="/x">go</ButtonLink>);
    expect(screen.getByRole("link").className).toContain("yl-btn");
  });
});

describe("feedback announces itself correctly", () => {
  it("Spinner is a status region with a name", () => {
    render(<Spinner label="Connecting" />);
    expect(screen.getByRole("status")).toHaveProperty("textContent", "Connecting");
  });

  it("Spinner names itself even when the caller does not", () => {
    // A spinner nobody can perceive is worse than none; leaving the label optional-and-absent
    // is how that happens.
    render(<Spinner />);
    expect(screen.getByRole("status").textContent).toBe("Loading");
  });

  it("Skeleton is hidden from assistive technology", () => {
    const { container } = render(<Skeleton width="10rem" />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });

  it("EmptyState heads at the level it is told to", () => {
    render(<EmptyState title="Nothing here" headingLevel={4} />);
    expect(screen.getByRole("heading", { level: 4 })).toBeDefined();
  });

  it("EmptyState renders its description and action when given them", () => {
    render(
      <EmptyState
        title="No peers"
        description="Start a node."
        action={<Button>Retry</Button>}
      />,
    );
    expect(screen.getByText("Start a node.")).toBeDefined();
    expect(screen.getByRole("button", { name: "Retry" })).toBeDefined();
  });

  it("EmptyState omits description and action when it has none", () => {
    const { container } = render(<EmptyState title="No peers" />);
    expect(container.querySelector(".yl-empty__body")).toBeNull();
    expect(container.querySelector(".yl-empty__action")).toBeNull();
  });

  it("Skeleton keeps a caller's style alongside its dimensions", () => {
    const { container } = render(<Skeleton width="8rem" style={{ opacity: 0.5 }} />);
    const style = container.firstElementChild?.getAttribute("style") ?? "";
    expect(style).toContain("width: 8rem");
    expect(style).toContain("opacity: 0.5");
  });

  it("EmptyState hides a decorative icon", () => {
    const { container } = render(<EmptyState icon="🛰" title="None" />);
    expect(container.querySelector(".yl-empty__icon")?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("Callout", () => {
  it("is a note, and carries its kind", () => {
    const { container } = render(<Callout kind="warning">careful</Callout>);
    expect(screen.getByRole("note")).toBeDefined();
    expect((container.firstElementChild as HTMLElement).className).toContain("yl-callout--warning");
  });
});

describe("Divider", () => {
  it("is an hr when horizontal", () => {
    const { container } = render(<Divider />);
    expect(container.firstElementChild?.tagName).toBe("HR");
  });

  it("is a separator with an orientation when vertical", () => {
    // An hr is a thematic break in the flow of content; turning it sideways does not make
    // that true, so the vertical form says what it is instead.
    render(<Divider orientation="vertical" />);
    const separator = screen.getByRole("separator");
    expect(separator.getAttribute("aria-orientation")).toBe("vertical");
    expect(separator.tagName).toBe("DIV");
  });
});

describe("Table stays a table", () => {
  it("renders real table semantics", () => {
    render(
      <Table>
        <THead>
          <TR>
            <TH>Peer</TH>
          </TR>
        </THead>
        <TBody>
          <TR>
            <TD>orders</TD>
          </TR>
        </TBody>
      </Table>,
    );
    expect(screen.getByRole("table")).toBeDefined();
    expect(screen.getByRole("columnheader")).toHaveProperty("textContent", "Peer");
    expect(screen.getByRole("cell")).toHaveProperty("textContent", "orders");
  });

  it("passes scope, span and the other native attributes through to the cells", () => {
    render(
      <Table>
        <THead data-testid="head">
          <TR data-testid="row">
            <TH scope="col" abbr="pr">
              Peer
            </TH>
            <TH scope="col">State</TH>
          </TR>
        </THead>
        <TBody data-testid="body">
          <TR>
            <TH scope="row">orders</TH>
            <TD colSpan={2} className="wide" data-testid="span-cell">
              open
            </TD>
          </TR>
        </TBody>
      </Table>,
    );

    // `scope` is what lets assistive technology associate a data cell with its header; it
    // cannot be inferred reliably from position, so it must survive the trip to the element.
    const headers = screen.getAllByRole("columnheader");
    expect(headers[0]?.getAttribute("scope")).toBe("col");
    expect(headers[0]?.getAttribute("abbr")).toBe("pr");
    expect(screen.getByRole("rowheader").getAttribute("scope")).toBe("row");

    const cell = screen.getByTestId("span-cell");
    expect(cell.getAttribute("colspan")).toBe("2");
    expect(cell.className).toBe("wide");

    // The section and row elements pass attributes through too.
    expect(screen.getByTestId("head").tagName).toBe("THEAD");
    expect(screen.getByTestId("body").tagName).toBe("TBODY");
    expect(screen.getByTestId("row").tagName).toBe("TR");
  });
});

describe("FormField wires the control to its label, hint and error", () => {
  it("associates the label", () => {
    render(
      <FormField id="host" label="Hub host">
        {(control) => <Input {...control} />}
      </FormField>,
    );
    expect(screen.getByLabelText("Hub host")).toBeDefined();
  });

  it("points aria-describedby at the hint", () => {
    render(
      <FormField id="host" label="Hub host" hint="Usually 127.0.0.1">
        {(control) => <Input {...control} />}
      </FormField>,
    );
    const input = screen.getByLabelText("Hub host");
    const described = input.getAttribute("aria-describedby");
    expect(described).toContain("host-hint");
    expect(document.getElementById("host-hint")?.textContent).toBe("Usually 127.0.0.1");
  });

  it("marks the field invalid and points at the error", () => {
    render(
      <FormField id="host" label="Hub host" hint="A host name" error="Cannot be empty">
        {(control) => <Input {...control} />}
      </FormField>,
    );
    const input = screen.getByLabelText("Hub host");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    // Both, in order: the guidance still applies while the error is showing.
    expect(input.getAttribute("aria-describedby")).toBe("host-hint host-error");
  });

  it("keeps the error region present so a later message is an update", () => {
    // Rendering the region only when there is an error means a reader is never told about a
    // node that appears after they have moved past the field.
    const { container, rerender } = render(
      <FormField id="host" label="Hub host">
        {(control) => <Input {...control} />}
      </FormField>,
    );
    const region = container.querySelector('[role="alert"]');
    expect(region).not.toBeNull();
    expect(region?.textContent).toBe("");

    rerender(
      <FormField id="host" label="Hub host" error="Cannot be empty">
        {(control) => <Input {...control} />}
      </FormField>,
    );
    expect(container.querySelector('[role="alert"]')?.textContent).toBe("Cannot be empty");
  });

  it("marks a required field for sight and for assistive technology separately", () => {
    // The asterisk is decoration and is hidden; `required` on the control is what is
    // announced. Marking only the label would leave the control claiming to be optional.
    const { container } = render(
      <FormField id="host" label="Hub host" required>
        {(control) => <Input {...control} required />}
      </FormField>,
    );
    const marker = container.querySelector(".yl-field__required");
    expect(marker?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByLabelText(/Hub host/).hasAttribute("required")).toBe(true);
  });

  it("says nothing about validity when there is no error", () => {
    render(
      <FormField id="host" label="Hub host">
        {(control) => <Input {...control} />}
      </FormField>,
    );
    expect(screen.getByLabelText("Hub host").getAttribute("aria-invalid")).toBeNull();
  });
});

describe("the boxed controls are native", () => {
  it("Checkbox is a checkbox with a clickable label", () => {
    render(<Checkbox name="tls" label="Require TLS" />);
    const box = screen.getByLabelText("Require TLS");
    expect(box.tagName).toBe("INPUT");
    expect(box.getAttribute("type")).toBe("checkbox");
  });

  it("Switch is a checkbox that reports as a switch", () => {
    // role=switch is what makes a reader hear on and off rather than checked and unchecked.
    render(<Switch name="verbose" label="Verbose" />);
    const control = screen.getByRole("switch");
    expect(control.getAttribute("type")).toBe("checkbox");
    expect(screen.getByLabelText("Verbose")).toBe(control);
  });

  it("Radio is a radio", () => {
    render(<Radio name="theme" value="dark" label="Dark" />);
    expect(screen.getByLabelText("Dark").getAttribute("type")).toBe("radio");
  });

  it("RadioGroup names the group and reports as one", () => {
    render(
      <RadioGroup legend="Theme">
        <Radio name="theme" value="light" label="Light" />
        <Radio name="theme" value="dark" label="Dark" />
      </RadioGroup>,
    );
    expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeDefined();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("Fieldset names its group", () => {
    render(
      <Fieldset legend="Transport security">
        <Checkbox name="tls" label="Require TLS" />
      </Fieldset>,
    );
    expect(screen.getByRole("group", { name: "Transport security" })).toBeDefined();
  });

  it("Slider is a range that can speak its value", () => {
    render(<Slider aria-label="Depth" min={0} max={4} defaultValue={2} valueText="high" />);
    const slider = screen.getByRole("slider");
    expect(slider.getAttribute("type")).toBe("range");
    expect(slider.getAttribute("aria-valuetext")).toBe("high");
  });

  it("hints on a boxed control are announced with it", () => {
    render(<Checkbox id="tls" name="tls" label="Require TLS" hint="Off loopback only" />);
    expect(screen.getByLabelText("Require TLS").getAttribute("aria-describedby")).toBe("tls-hint");
  });
});

describe("the action primitives carry a name", () => {
  it("IconButton is announced by its label, not its glyph", () => {
    // An icon button with no accessible name is announced as "button" and nothing else.
    render(<IconButton label="Copy to clipboard">⧉</IconButton>);
    expect(screen.getByRole("button", { name: "Copy to clipboard" })).toBeDefined();
  });

  it("IconButton hides the glyph from assistive technology", () => {
    const { container } = render(<IconButton label="Copy">⧉</IconButton>);
    expect(container.querySelector("[aria-hidden='true']")?.textContent).toBe("⧉");
  });

  it("ButtonGroup is a named group", () => {
    render(
      <ButtonGroup label="Timeline controls">
        <Button>Back</Button>
        <Button>Forward</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole("group", { name: "Timeline controls" })).toBeDefined();
  });
});

describe("the field controls", () => {
  it("Select renders its options", () => {
    render(
      <Select aria-label="Theme" defaultValue="light">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </Select>,
    );
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("Textarea is a textarea", () => {
    render(<Textarea aria-label="Payload" />);
    expect(screen.getByLabelText("Payload").tagName).toBe("TEXTAREA");
  });
});
