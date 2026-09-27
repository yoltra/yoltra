import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ReactElement } from "react";

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
  Label,
  Link,
  Radio,
  RadioGroup,
  Select,
  Skeleton,
  Slider,
  Spinner,
  Stack,
  Switch,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  TableScroll,
  Text,
  Textarea,
  VisuallyHidden,
} from "../../src/index";

/**
 * The markup every server-safe component renders, recorded per variant.
 *
 * @remarks
 * These guard the half of the contract that assertions keep missing. The behavioural suites ask
 * whether a role is right or a class is present, which is the correct question and a narrow one:
 * it passes just as happily when a wrapper element appears, an `aria-describedby` stops being
 * emitted, or a modifier class is renamed. A snapshot fails on all three.
 *
 * Paired with `css.test.ts` on purpose. jsdom applies no stylesheet, so a DOM snapshot can only
 * prove which classes were asked for; whether those classes carry the right declarations is what
 * the CSS snapshots answer. Neither half is sufficient, and the gap between them is where the
 * styling bugs in this package have actually lived.
 *
 * The overlay and client tier is covered separately in `client-dom.test.tsx`, because those
 * components render through a portal and need an open state before there is anything to record.
 */

// Auto-cleanup only runs when the framework exposes globals; without this each render stacks
// into the same document and a snapshot records the wreckage of every case before it.
afterEach(cleanup);

/** A named case. A thunk rather than an element, so nothing renders at collection time. */
type Case = readonly [name: string, element: () => ReactElement];

/**
 * Snapshots each case as its own test.
 *
 * @remarks
 * One `it` per case rather than one per component, so a failure names the exact variant. The
 * snapshot is keyed off the test name, which is why those names have to stay stable: renaming a
 * case orphans its snapshot rather than failing it.
 */
function snapshotAll(cases: readonly Case[]): void {
  for (const [name, element] of cases) {
    it(name, () => {
      const { container } = render(element());
      expect(container.firstChild).toMatchSnapshot();
    });
  }
}

const VARIANTS = ["primary", "ghost"] as const;
const SIZES = ["md", "sm"] as const;

describe("Button", () => {
  snapshotAll([
    ...VARIANTS.flatMap((variant) =>
      SIZES.map((size): Case => [
        `${variant} ${size}`,
        () => (
          <Button variant={variant} size={size}>
            Save
          </Button>
        ),
      ]),
    ),
    ["disabled", () => <Button disabled>Save</Button>],
    ["submit", () => <Button type="submit">Save</Button>],
    ["danger", () => <Button variant="danger">Delete</Button>],
    ["touch size", () => <Button size="lg">Sell</Button>],
    ["loading", () => <Button loading>Save</Button>],
    ["pressed", () => <Button pressed>Bold</Button>],
    ["not pressed", () => <Button pressed={false}>Bold</Button>],
  ]);
});

describe("ButtonLink", () => {
  snapshotAll([
    ...VARIANTS.map((variant): Case => [
      variant,
      () => (
        <ButtonLink href="/docs" variant={variant}>
          Docs
        </ButtonLink>
      ),
    ]),
    [
      "small",
      () => (
        <ButtonLink href="/docs" size="sm">
          Docs
        </ButtonLink>
      ),
    ],
  ]);
});

describe("IconButton", () => {
  snapshotAll([
    ...VARIANTS.map((variant): Case => [
      variant,
      () => (
        <IconButton label="Close" variant={variant}>
          x
        </IconButton>
      ),
    ]),
    [
      "small",
      () => (
        <IconButton label="Close" size="sm">
          x
        </IconButton>
      ),
    ],
  ]);
});

describe("ButtonGroup", () => {
  snapshotAll([
    [
      "wraps its buttons with a label",
      () => (
        <ButtonGroup label="Text style">
          <Button>Bold</Button>
          <Button>Italic</Button>
        </ButtonGroup>
      ),
    ],
  ]);
});

describe("Badge", () => {
  snapshotAll([
    ["neutral", () => <Badge>Draft</Badge>],
    ["brand", () => <Badge variant="brand">New</Badge>],
    ...(["info", "success", "warning", "error"] as const).map((variant): Case => [
      variant,
      () => <Badge variant={variant}>{variant}</Badge>,
    ]),
  ]);
});

describe("Callout", () => {
  snapshotAll(
    (["info", "success", "warning", "error"] as const).map((kind): Case => [
      kind,
      () => <Callout kind={kind}>Something happened.</Callout>,
    ]),
  );
});

describe("Card", () => {
  snapshotAll([
    ["default", () => <Card>Body</Card>],
    ["bordered", () => <Card bordered>Body</Card>],
    ["padded", () => <Card padding={4}>Body</Card>],
    ...(["none", "xs", "sm", "md", "lg", "xl"] as const).map((elevation): Case => [
      `elevation ${elevation}`,
      () => <Card elevation={elevation}>Body</Card>,
    ]),
    ["as a section", () => <Card as="section">Body</Card>],
    ["subtle tone", () => <Card tone="subtle">Body</Card>],
  ]);
});

describe("Typography", () => {
  snapshotAll([
    ...([1, 2, 3, 4, 5, 6] as const).map((level): Case => [
      `Heading level ${level}`,
      () => <Heading level={level}>Title</Heading>,
    ]),
    ["Heading with an explicit size", () => <Heading level={2} size="xs">Title</Heading>],
    ...(["xs", "sm", "md", "lg"] as const).map((size): Case => [
      `Text size ${size}`,
      () => <Text size={size}>Body copy</Text>,
    ]),
    ...(["default", "secondary", "muted", "brand", "danger"] as const).map((tone): Case => [
      `Text tone ${tone}`,
      () => <Text tone={tone}>Body copy</Text>,
    ]),
    ...(["regular", "medium", "bold"] as const).map((weight): Case => [
      `Text weight ${weight}`,
      () => <Text weight={weight}>Body copy</Text>,
    ]),
    ["Text as a span", () => <Text as="span">Body copy</Text>],
    ["Link", () => <Link href="/docs">Docs</Link>],
    ["Link external", () => <Link href="https://example.com" external>Example</Link>],
    ["InlineCode", () => <InlineCode>npm i</InlineCode>],
    ["Kbd", () => <Kbd>Esc</Kbd>],
  ]);
});

describe("Layout", () => {
  snapshotAll([
    ["Stack default", () => <Stack>child</Stack>],
    ["Stack with a gap", () => <Stack gap={4}>child</Stack>],
    ...(["start", "center", "end", "stretch", "baseline"] as const).map((align): Case => [
      `Stack align ${align}`,
      () => <Stack align={align}>child</Stack>,
    ]),
    ...(["start", "center", "end", "between", "around"] as const).map((justify): Case => [
      `Inline justify ${justify}`,
      () => <Inline justify={justify}>child</Inline>,
    ]),
    ["Inline wrapping", () => <Inline wrap>child</Inline>],
    ["Inline as a nav", () => <Inline as="nav">child</Inline>],
    ["Grid with columns", () => <Grid columns={3}>child</Grid>],
    ["Grid with a minimum item width", () => <Grid minItemWidth="20rem">child</Grid>],
    ["Container", () => <Container>child</Container>],
    ["Divider horizontal", () => <Divider />],
    ["Divider vertical", () => <Divider orientation="vertical" />],
  ]);
});

describe("Fields", () => {
  snapshotAll([
    ...SIZES.flatMap((size) => [
      [`Input ${size}`, () => <Input size={size} defaultValue="host" />] as Case,
      [`Select ${size}`, () => (
        <Select size={size} defaultValue="a">
          <option value="a">A</option>
        </Select>
      )] as Case,
      [`Textarea ${size}`, () => <Textarea size={size} defaultValue="text" />] as Case,
    ]),
    ["Input block", () => <Input block />],
    ["Input disabled", () => <Input disabled />],
    ["Select block", () => <Select block><option value="a">A</option></Select>],
    ["Textarea block", () => <Textarea block />],
  ]);
});

describe("Form", () => {
  snapshotAll([
    [
      "FormField with a label only",
      () => (
        <FormField id="host" label="Hub host">
          {(control) => <Input {...control} />}
        </FormField>
      ),
    ],
    [
      "FormField with a hint",
      () => (
        <FormField id="host" label="Hub host" hint="Where the hub listens.">
          {(control) => <Input {...control} />}
        </FormField>
      ),
    ],
    [
      "FormField with an error",
      () => (
        <FormField id="host" label="Hub host" error="That host is unreachable.">
          {(control) => <Input {...control} />}
        </FormField>
      ),
    ],
    [
      "FormField required",
      () => (
        <FormField id="host" label="Hub host" required>
          {(control) => <Input {...control} />}
        </FormField>
      ),
    ],
    [
      "Fieldset",
      () => (
        <Fieldset legend="Connection" hint="How to reach it.">
          <Input />
        </Fieldset>
      ),
    ],
    ["Label", () => <Label htmlFor="host">Hub host</Label>],
    ["Checkbox", () => <Checkbox id="a" label="Remember me" />],
    ["Checkbox with a hint", () => <Checkbox id="a" label="Remember me" hint="On this device." />],
    ["Radio", () => <Radio id="b" name="r" label="Daily" />],
    [
      "RadioGroup",
      () => (
        <RadioGroup legend="Cadence">
          <Radio id="b" name="r" label="Daily" />
        </RadioGroup>
      ),
    ],
    [
      "RadioGroup inline",
      () => (
        <RadioGroup legend="Cadence" inline>
          <Radio id="b" name="r" label="Daily" />
        </RadioGroup>
      ),
    ],
    ["Switch", () => <Switch id="c" label="Dark mode" />],
    ["Slider", () => <Slider id="d" min={0} max={10} defaultValue={5} />],
    ["Slider with value text", () => <Slider id="d" defaultValue={5} valueText="5 of 10" />],
  ]);
});

describe("Table", () => {
  snapshotAll([
    [
      "numeric cells",
      () => (
        <Table>
          <THead>
            <TR>
              <TH scope="col">Package</TH>
              <TH scope="col" numeric>
                Size
              </TH>
            </TR>
          </THead>
          <TBody>
            <TR>
              <TD>core</TD>
              <TD numeric>12.5</TD>
            </TR>
          </TBody>
        </Table>
      ),
    ],
    [
      "inside a scroll region",
      () => (
        <TableScroll label="Published packages">
          <Table>
            <TBody>
              <TR>
                <TD>core</TD>
              </TR>
            </TBody>
          </Table>
        </TableScroll>
      ),
    ],
    [
      "a full composition",
      () => (
        <Table>
          <THead>
            <TR>
              <TH scope="col">Name</TH>
              <TH scope="col">Size</TH>
            </TR>
          </THead>
          <TBody>
            <TR>
              <TD>core</TD>
              <TD>12 KB</TD>
            </TR>
          </TBody>
        </Table>
      ),
    ],
  ]);
});

describe("Feedback", () => {
  snapshotAll([
    ...(["sm", "md", "lg"] as const).map((size): Case => [
      `Spinner ${size}`,
      () => <Spinner size={size} />,
    ]),
    ["Spinner with a label", () => <Spinner label="Loading" />],
    ["Skeleton", () => <Skeleton />],
    ["Skeleton sized", () => <Skeleton width="20rem" height="2rem" />],
    ["Skeleton circle", () => <Skeleton circle />],
    ["EmptyState with a title only", () => <EmptyState title="Nothing here" />],
    [
      "EmptyState fully populated",
      () => (
        <EmptyState
          icon="empty"
          title="Nothing here"
          description="Add something to get started."
          action={<Button>Add</Button>}
        />
      ),
    ],
    [
      "EmptyState at another heading level",
      () => <EmptyState title="Nothing here" headingLevel={3} />,
    ],
  ]);
});

describe("VisuallyHidden", () => {
  snapshotAll([
    ["default", () => <VisuallyHidden>Skip to content</VisuallyHidden>],
    ["as a div", () => <VisuallyHidden as="div">Skip to content</VisuallyHidden>],
  ]);
});
