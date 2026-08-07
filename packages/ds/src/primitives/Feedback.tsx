import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Diameter. Defaults to `md`. */
  size?: "sm" | "md" | "lg";
  /**
   * What is being waited for.
   *
   * @remarks
   * Rendered visually hidden inside a `role="status"` region, so the wait is announced rather
   * than being a silent spinning shape. It defaults to "Loading" — a spinner nobody can
   * perceive is worse than no spinner, and leaving the label optional-and-absent is how that
   * happens.
   */
  label?: string;
}

/**
 * An indeterminate loading indicator.
 *
 * @example
 * ```tsx
 * <Spinner label="Connecting to the hub" />
 * ```
 *
 * @public
 */
export function Spinner({ size = "md", label = "Loading", className, ...rest }: SpinnerProps) {
  return (
    <span
      className={["yl-spinner", `yl-spinner--${size}`, className].filter(Boolean).join(" ")}
      role="status"
      {...rest}
    >
      <span className="yl-spinner__ring" aria-hidden="true" />
      <span className="yl-visually-hidden">{label}</span>
    </span>
  );
}

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  /** CSS width, e.g. `"12rem"` or `"100%"`. */
  width?: string;
  /** CSS height. Defaults to one line of text. */
  height?: string;
  /** Round it fully, for an avatar placeholder. */
  circle?: boolean;
}

/**
 * A placeholder for content that has not arrived.
 *
 * @remarks
 * Hidden from assistive technology. A screen reader announcing a row of grey boxes tells its
 * user nothing they can act on; the live region that announces the *arrival* is what carries
 * meaning, and that belongs to whatever is loading rather than to its placeholder.
 *
 * @example
 * ```tsx
 * {peers === undefined ? <Skeleton width="18rem" /> : <PeerList peers={peers} />}
 * ```
 *
 * @public
 */
export function Skeleton({ width, height, circle = false, className, style, ...rest }: SkeletonProps) {
  const vars: CSSProperties = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };
  return (
    <span
      className={["yl-skeleton", circle && "yl-skeleton--circle", className].filter(Boolean).join(" ")}
      style={style === undefined ? vars : { ...vars, ...style }}
      aria-hidden="true"
      {...rest}
    />
  );
}

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** A glyph or small illustration. Decorative — it is hidden from assistive technology. */
  icon?: ReactNode;
  /**
   * The headline.
   *
   * @remarks
   * Shadows the HTML `title` attribute, which is deliberately omitted from this interface: a
   * tooltip and a heading are different things, and accepting a `ReactNode` here is worth more
   * than passing through an attribute that browsers render inconsistently and touch users
   * cannot reach at all.
   */
  title: ReactNode;
  description?: ReactNode;
  /** A way out: usually a button that creates the missing thing. */
  action?: ReactNode;
  /**
   * Outline level for the title.
   *
   * @remarks
   * Configurable because an empty state can sit anywhere in a page, and a fixed `h2` inside a
   * card nested under an `h3` leaves a hole in the outline that a screen-reader user navigates
   * by.
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

/**
 * What to show where there is nothing to show.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="🛰"
 *   title="No peers connected"
 *   description="Start a node, or check the gateway is reachable."
 *   action={<Button onClick={retry}>Retry</Button>}
 * />
 * ```
 *
 * @public
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  headingLevel = 3,
  className,
  ...rest
}: EmptyStateProps) {
  const Title = `h${headingLevel}` as "h3";
  return (
    <div className={["yl-empty", className].filter(Boolean).join(" ")} {...rest}>
      {icon !== undefined && (
        <div className="yl-empty__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <Title className="yl-empty__title">{title}</Title>
      {description !== undefined && <p className="yl-empty__body">{description}</p>}
      {action !== undefined && <div className="yl-empty__action">{action}</div>}
    </div>
  );
}
