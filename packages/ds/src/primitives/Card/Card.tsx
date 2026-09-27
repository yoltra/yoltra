import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";

import type { SpaceToken } from "../Layout/Layout";

/**
 * A card's surface.
 *
 * @remarks
 * `subtle` is a tinted panel, for a card that groups something secondary. A consuming project
 * added a tinted variant of its own locally, and two of its screens gave up on `Card` and
 * inlined a border instead, which is a clear enough signal.
 *
 * @public
 */
export type CardTone = "default" | "subtle";

/** How much a card lifts off the page. @public */
export type CardElevation = "none" | "xs" | "sm" | "md" | "lg" | "xl";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Inner spacing, as a step on the spacing scale. Defaults to `5` (20px). */
  padding?: SpaceToken;
  /** Shadow depth, from the elevation tokens. Defaults to `xs`. */
  elevation?: CardElevation;
  /** Draw a border. On by default; turn it off when the card sits on a tinted surface. */
  bordered?: boolean;
  /** Surface treatment. `subtle` tints it, for content that is secondary to what surrounds it. */
  tone?: CardTone;
  /**
   * Element to render.
   *
   * @remarks
   * A card that is itself a link or a button should say so — `as="a"` or `as="article"` —
   * rather than nesting an interactive element that covers the whole surface, which is how a
   * card ends up unreachable by keyboard.
   */
  as?: ElementType;
  children?: ReactNode;
}

/**
 * A surface that groups related content.
 *
 * @example
 * ```tsx
 * <Card padding={6} elevation="sm">
 *   <Stack gap={2}>
 *     <Heading level={3}>orders</Heading>
 *     <Text tone="secondary">Publishing 3 routes.</Text>
 *   </Stack>
 * </Card>
 * ```
 *
 * @public
 */
export function Card({
  padding,
  elevation = "xs",
  bordered = true,
  tone = "default",
  as: Tag = "div",
  className,
  style,
  children,
  ...rest
}: CardProps) {
  const vars: CSSProperties = {
    ...(padding !== undefined ? ({ "--yl-card-padding": `var(--yl-space-${padding})` } as CSSProperties) : {}),
    "--yl-card-shadow": `var(--yl-elevation-${elevation})`,
  } as CSSProperties;

  return (
    <Tag
      className={[
        "yl-card",
        !bordered && "yl-card--borderless",
        tone !== "default" && `yl-card--${tone}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style === undefined ? vars : { ...vars, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
