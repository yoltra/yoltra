import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  Badge,
  Button,
  Card,
  Checkbox,
  Grid,
  Inline,
  Input,
  Radio,
  RadioGroup,
  Select,
  Skeleton,
  Spinner,
  Stack,
  Switch,
  Text,
  Textarea,
} from "../src/index";

afterEach(cleanup);

/** Reads the inline style attribute a component composed. */
const styleOf = (el: Element | null): string => el?.getAttribute("style") ?? "";

describe("layout props reach the element", () => {
  it("Stack turns a spacing token into the gap variable", () => {
    // The mechanism the whole layout tier rests on: one CSS rule reading a per-instance
    // property, rather than a modifier class for every step on the scale.
    const { container } = render(<Stack gap={6}>x</Stack>);
    expect(styleOf(container.firstElementChild)).toContain("--yl-stack-gap: var(--yl-space-6)");
  });

  it("Stack maps alignment names to flexbox values", () => {
    const { container } = render(
      <Stack align="center" justify="between">
        x
      </Stack>,
    );
    const style = styleOf(container.firstElementChild);
    expect(style).toContain("align-items: center");
    expect(style).toContain("justify-content: space-between");
  });

  it("Stack keeps a caller's own style alongside its variables", () => {
    const { container } = render(
      <Stack gap={2} style={{ padding: "1rem" }}>
        x
      </Stack>,
    );
    const style = styleOf(container.firstElementChild);
    expect(style).toContain("--yl-stack-gap");
    expect(style).toContain("padding: 1rem");
  });

  it("Inline wraps by default and stops when told to", () => {
    const { container: wrapping } = render(<Inline>x</Inline>);
    expect((wrapping.firstElementChild as HTMLElement).className).not.toContain("nowrap");

    const { container: fixed } = render(<Inline wrap={false}>x</Inline>);
    expect((fixed.firstElementChild as HTMLElement).className).toContain("yl-inline--nowrap");
  });

  it("Grid takes a fixed column count", () => {
    const { container } = render(<Grid columns={3}>x</Grid>);
    expect(styleOf(container.firstElementChild)).toContain("repeat(3, minmax(0, 1fr))");
  });

  it("Grid prefers a fluid track when given a minimum width", () => {
    // Responsive without naming a breakpoint, which is why it wins over `columns`.
    const { container } = render(
      <Grid columns={3} minItemWidth="24rem">
        x
      </Grid>,
    );
    const style = styleOf(container.firstElementChild);
    expect(style).toContain("repeat(auto-fit, minmax(24rem, 1fr))");
    expect(style).not.toContain("repeat(3");
  });

  it("Grid without either prop sets no template", () => {
    const { container } = render(<Grid>x</Grid>);
    expect(styleOf(container.firstElementChild)).not.toContain("grid-template-columns");
  });
});

describe("Card", () => {
  it("resolves elevation to the token", () => {
    const { container } = render(<Card elevation="lg">x</Card>);
    expect(styleOf(container.firstElementChild)).toContain("--yl-card-shadow: var(--yl-elevation-lg)");
  });

  it("takes padding from the scale", () => {
    const { container } = render(<Card padding={8}>x</Card>);
    expect(styleOf(container.firstElementChild)).toContain("--yl-card-padding: var(--yl-space-8)");
  });

  it("can drop its border", () => {
    const { container } = render(<Card bordered={false}>x</Card>);
    expect((container.firstElementChild as HTMLElement).className).toContain("yl-card--borderless");
  });

  it("renders as another element when asked", () => {
    const { container } = render(<Card as="article">x</Card>);
    expect(container.firstElementChild?.tagName).toBe("ARTICLE");
  });
});

describe("variant classes", () => {
  it("Badge", () => {
    const { container } = render(<Badge variant="brand">x</Badge>);
    expect((container.firstElementChild as HTMLElement).className).toContain("yl-badge--brand");
  });

  it("Button", () => {
    const { container } = render(
      <Button variant="ghost" size="sm">
        x
      </Button>,
    );
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("yl-btn--ghost");
    expect(cls).toContain("yl-btn--sm");
  });

  it("Text tone and weight", () => {
    const { container } = render(
      <Text tone="muted" weight="bold" size="lg">
        x
      </Text>,
    );
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("yl-text--muted");
    expect(cls).toContain("yl-text--bold");
    expect(cls).toContain("yl-text--lg");
  });

  it("Text at its defaults adds no modifier for tone or weight", () => {
    const { container } = render(<Text>x</Text>);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).not.toContain("--default");
    expect(cls).not.toContain("--regular");
  });

  it("Spinner sizes", () => {
    const { container } = render(<Spinner size="lg" />);
    expect((container.firstElementChild as HTMLElement).className).toContain("yl-spinner--lg");
  });

  it("Skeleton dimensions and circle", () => {
    const { container } = render(<Skeleton width="10rem" height="2rem" circle />);
    const el = container.firstElementChild as HTMLElement;
    expect(styleOf(el)).toContain("width: 10rem");
    expect(styleOf(el)).toContain("height: 2rem");
    expect(el.className).toContain("yl-skeleton--circle");
  });

  it("field sizes and block", () => {
    const { container } = render(<Input size="sm" block aria-label="x" />);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("yl-input--sm");
    expect(cls).toContain("yl-input--block");
  });

  it("Select and Textarea take the same modifiers", () => {
    const { container: sel } = render(
      <Select size="sm" block aria-label="s">
        <option value="1">One</option>
      </Select>,
    );
    expect((sel.firstElementChild as HTMLElement).className).toContain("yl-select--sm");

    const { container: ta } = render(<Textarea block aria-label="t" />);
    expect((ta.firstElementChild as HTMLElement).className).toContain("yl-textarea--block");
  });
});

describe("hints are optional everywhere they appear", () => {
  it("a boxed control without a hint describes nothing", () => {
    render(<Checkbox id="a" label="A" />);
    expect(screen.getByLabelText("A").getAttribute("aria-describedby")).toBeNull();
  });

  it("a boxed control with no id cannot point at a hint, and does not pretend to", () => {
    // The hint still renders; what it must not do is claim an association that resolves to
    // nothing, which is worse than none because it reads as wired.
    render(<Switch label="B" hint="explanation" />);
    expect(screen.getByLabelText("B").getAttribute("aria-describedby")).toBeNull();
    expect(screen.getByText("explanation")).toBeDefined();
  });

  it("a radio group lays out inline when asked", () => {
    const { container } = render(
      <RadioGroup legend="L" inline hint="pick one">
        <Radio name="r" value="1" label="One" />
      </RadioGroup>,
    );
    expect(container.querySelector(".yl-fieldset__body--inline")).not.toBeNull();
  });

  it("a required field marks itself for sighted readers only", () => {
    // The asterisk is decoration; `required` on the control is what assistive technology uses.
    const { container } = render(
      <RadioGroup legend="L">
        <Radio name="r" value="1" label="One" required />
      </RadioGroup>,
    );
    expect(screen.getByLabelText("One").hasAttribute("required")).toBe(true);
    expect(container.querySelector(".yl-field__required")).toBeNull();
  });
});
