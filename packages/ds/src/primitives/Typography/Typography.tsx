import type { AnchorHTMLAttributes, ElementType, HTMLAttributes, ReactNode } from "react";

/** Text scale. */
export type TextSize = "xs" | "sm" | "md" | "lg";
/** How much a piece of text should recede. */
export type TextTone = "default" | "secondary" | "muted" | "brand" | "danger";

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Outline level, 1–6. Rendered as the matching `h` element. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Visual size, when it should differ from the level.
   *
   * @remarks
   * The escape hatch that keeps the outline honest. A section that is structurally an `h3` but
   * should look small stays an `h3` and takes `size="sm"`, rather than being demoted to an
   * `h5` for appearance and leaving a hole in the document outline that screen-reader users
   * navigate by.
   */
  size?: TextSize;
  children?: ReactNode;
}

/**
 * A section heading.
 *
 * @example
 * ```tsx
 * <Heading level={2}>Connected peers</Heading>
 * <Heading level={3} size="sm">Routes</Heading>
 * ```
 *
 * @public
 */
export function Heading({ level = 2, size, className, children, ...rest }: HeadingProps) {
  const Tag = `h${level}` as ElementType;
  const cls = ["yl-heading", `yl-heading--${size ?? `h${level}`}`, className]
    .filter(Boolean)
    .join(" ");
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}

export interface TextProps extends HTMLAttributes<HTMLElement> {
  size?: TextSize;
  tone?: TextTone;
  weight?: "regular" | "medium" | "bold";
  /** Element to render. Defaults to `p`; use `span` for text inside a line. */
  as?: ElementType;
  children?: ReactNode;
}

/**
 * Body text.
 *
 * @example
 * ```tsx
 * <Text tone="secondary" size="sm">No peers are connected.</Text>
 * ```
 *
 * @public
 */
export function Text({
  size = "md",
  tone = "default",
  weight = "regular",
  as: Tag = "p",
  className,
  children,
  ...rest
}: TextProps) {
  const cls = [
    "yl-text",
    `yl-text--${size}`,
    tone !== "default" && `yl-text--${tone}`,
    weight !== "regular" && `yl-text--${weight}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Marks the link as leaving the site.
   *
   * @remarks
   * Adds `rel="noopener noreferrer"` alongside `target="_blank"`. Without `noopener` the opened
   * page can reach back through `window.opener`, which is a real hole rather than a lint
   * preference — so it is applied here instead of being left to each call site to remember.
   */
  external?: boolean;
  children?: ReactNode;
}

/**
 * A hyperlink.
 *
 * @example
 * ```tsx
 * <Link href="https://example.com" external>the specification</Link>
 * ```
 *
 * @public
 */
export function Link({ external = false, className, children, ...rest }: LinkProps) {
  const externalProps = external
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
  return (
    <a className={["yl-link", className].filter(Boolean).join(" ")} {...externalProps} {...rest}>
      {children}
    </a>
  );
}

/**
 * Code inside a line of prose.
 *
 * @remarks
 * For a whole block, use `CodeBlock` from `@yoltra/ds/client` — it has a copy button and needs
 * browser APIs.
 *
 * @example
 * ```tsx
 * <Text>Call <InlineCode>createStore(spec)</InlineCode> once, at start-up.</Text>
 * ```
 *
 * @public
 */
export function InlineCode({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLElement> & { children?: ReactNode }) {
  return (
    <code className={["yl-inline-code", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </code>
  );
}

/**
 * A key on a keyboard.
 *
 * @example
 * ```tsx
 * Press <Kbd>Esc</Kbd> to close.
 * ```
 *
 * @public
 */
export function Kbd({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLElement> & { children?: ReactNode }) {
  return (
    <kbd className={["yl-kbd", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </kbd>
  );
}
