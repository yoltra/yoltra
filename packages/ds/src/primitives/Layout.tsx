import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";

import type { FoundationTokens } from "../tokens/tokens";

/**
 * A step on the spacing scale.
 *
 * @remarks
 * Derived from {@link FoundationTokens} rather than restated, so a step added to the scale is
 * immediately spendable here and a step removed stops type-checking at the call sites that
 * used it.
 *
 * @public
 */
export type SpaceToken = keyof FoundationTokens["spacing"];

/**
 * Renders a spacing token as the custom property a layout rule reads.
 *
 * @remarks
 * Passed per instance rather than baked into modifier classes. Fourteen scale steps across
 * five layout components would be seventy rules in the stylesheet, and every one of them
 * would ship to every consumer; one declaration reading a variable costs a single rule and
 * still loses to a class the caller writes themselves.
 *
 * @internal
 */
function spaceVar(name: string, token: SpaceToken | undefined): CSSProperties | undefined {
  return token === undefined ? undefined : ({ [name]: `var(--yl-space-${token})` } as CSSProperties);
}

/** @internal */
function merge(
  base: CSSProperties | undefined,
  extra: CSSProperties | undefined,
): CSSProperties | undefined {
  if (base === undefined) return extra;
  return extra === undefined ? base : { ...base, ...extra };
}

/** Cross-axis alignment. @public */
export type Align = "start" | "center" | "end" | "stretch" | "baseline";
/** Main-axis distribution. @public */
export type Justify = "start" | "center" | "end" | "between" | "around";

/** @internal */
const ALIGN: Record<Align, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
};

/** @internal */
const JUSTIFY: Record<Justify, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
};

export interface FlowProps extends HTMLAttributes<HTMLElement> {
  /** Space between children, as a step on the spacing scale. Defaults to `4` (16px). */
  gap?: SpaceToken;
  align?: Align;
  justify?: Justify;
  /** Element to render. Use it to keep the document outline honest — `as="ul"`, `as="nav"`. */
  as?: ElementType;
  children?: ReactNode;
}

export type StackProps = FlowProps;

/** Shared by the flex layouts. */
/**
 * Stacks its children vertically.
 *
 * @remarks
 * The most-reached-for layout in any interface, and the reason a design system has one: a
 * column of things separated by a value from the scale, rather than a margin invented at each
 * call site and drifting from its neighbours.
 *
 * @example
 * ```tsx
 * <Stack gap={3}>
 *   <Heading level={2}>Peers</Heading>
 *   <Text tone="secondary">Every node this gateway can reach.</Text>
 * </Stack>
 * ```
 *
 * @public
 */
export function Stack({
  gap,
  align,
  justify,
  as: Tag = "div",
  className,
  style,
  children,
  ...rest
}: StackProps) {
  return (
    <Tag
      className={["yl-stack", className].filter(Boolean).join(" ")}
      style={merge(
        merge(spaceVar("--yl-stack-gap", gap), {
          ...(align !== undefined ? { alignItems: ALIGN[align] } : {}),
          ...(justify !== undefined ? { justifyContent: JUSTIFY[justify] } : {}),
        }),
        style,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export interface InlineProps extends FlowProps {
  /** Allow children to wrap onto another line. On by default. */
  wrap?: boolean;
}

/**
 * Lays its children out in a row, wrapping when they run out of room.
 *
 * @remarks
 * Wraps by default. A row of tags or buttons that refuses to wrap is a row that overflows its
 * container on a narrow screen, and a design system defaulting to that is a design system
 * whose users write `flex-wrap` everywhere.
 *
 * @example
 * ```tsx
 * <Inline gap={2} align="center">
 *   <Badge>open</Badge>
 *   <Text size="sm" tone="muted">last seen 3s ago</Text>
 * </Inline>
 * ```
 *
 * @public
 */
export function Inline({
  gap,
  align = "center",
  justify,
  wrap = true,
  as: Tag = "div",
  className,
  style,
  children,
  ...rest
}: InlineProps) {
  return (
    <Tag
      className={["yl-inline", !wrap && "yl-inline--nowrap", className].filter(Boolean).join(" ")}
      style={merge(
        merge(spaceVar("--yl-inline-gap", gap), {
          alignItems: ALIGN[align],
          ...(justify !== undefined ? { justifyContent: JUSTIFY[justify] } : {}),
        }),
        style,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export interface GridProps extends HTMLAttributes<HTMLElement> {
  gap?: SpaceToken;
  /** Fixed column count. Ignored when `minItemWidth` is given. */
  columns?: number;
  /** Narrowest a column may be before the grid drops one, e.g. `"24rem"`. */
  minItemWidth?: string;
  as?: ElementType;
  children?: ReactNode;
}

/**
 * A grid that reflows without media queries.
 *
 * @remarks
 * Give it `minItemWidth` and it fits as many columns as will hold that width, which is
 * responsive without any breakpoint being named. Give it `columns` for a fixed count when the
 * layout genuinely is fixed.
 *
 * @example
 * ```tsx
 * <Grid minItemWidth="24rem" gap={4}>
 *   {peers.map((p) => <PeerCard key={p.id} peer={p} />)}
 * </Grid>
 * ```
 *
 * @public
 */
export function Grid({
  gap,
  columns,
  minItemWidth,
  as: Tag = "div",
  className,
  style,
  children,
  ...rest
}: GridProps) {
  const template =
    minItemWidth !== undefined
      ? `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`
      : columns !== undefined
        ? `repeat(${columns}, minmax(0, 1fr))`
        : undefined;

  return (
    <Tag
      className={["yl-grid", className].filter(Boolean).join(" ")}
      style={merge(
        merge(spaceVar("--yl-grid-gap", gap), {
          ...(template !== undefined ? { gridTemplateColumns: template } : {}),
        }),
        style,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children?: ReactNode;
}

/**
 * Centres page content and steps its width up at each breakpoint.
 *
 * @remarks
 * The styles already existed as `.yl-container`; this is the component that was missing.
 *
 * @example
 * ```tsx
 * <Container as="main">
 *   <Heading level={1}>Mission control</Heading>
 * </Container>
 * ```
 *
 * @public
 */
export function Container({ as: Tag = "div", className, children, ...rest }: ContainerProps) {
  return (
    <Tag className={["yl-container", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </Tag>
  );
}

export interface DividerProps extends HTMLAttributes<HTMLElement> {
  orientation?: "horizontal" | "vertical";
}

/**
 * A rule between sections.
 *
 * @remarks
 * Renders an `<hr>` when horizontal, which carries the separator semantics for free. A
 * vertical one is a `<div role="separator">` with `aria-orientation`, because `<hr>` is
 * defined as a thematic break in the flow of content and turning it on its side does not make
 * that true.
 *
 * @example
 * ```tsx
 * <Divider />
 * <Inline gap={3}>
 *   <Text>Left</Text>
 *   <Divider orientation="vertical" />
 *   <Text>Right</Text>
 * </Inline>
 * ```
 *
 * @public
 */
export function Divider({ orientation = "horizontal", className, ...rest }: DividerProps) {
  const cls = ["yl-divider", orientation === "vertical" && "yl-divider--vertical", className]
    .filter(Boolean)
    .join(" ");

  if (orientation === "vertical") {
    return <div className={cls} role="separator" aria-orientation="vertical" {...rest} />;
  }
  return <hr className={cls} {...(rest as HTMLAttributes<HTMLHRElement>)} />;
}
