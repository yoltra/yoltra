import type { HTMLAttributes, ReactNode } from "react";

/** Scale of a stat. @public */
export type StatSize = "md" | "sm";

export interface StatProps extends HTMLAttributes<HTMLDivElement> {
  /** What the figure is. */
  label: ReactNode;
  /**
   * The figure.
   *
   * @remarks
   * A `ReactNode` rather than a number, and deliberately not formatted here: a count, a byte size
   * and a currency amount want different formatting, and a design system that picked one would be
   * wrong for the other two.
   *
   * **Pass a real zero.** Rendering a dash for nought tells a reader the figure is *unavailable*
   * when it is simply none, and the two are different facts. A consuming project wrote that rule
   * down after getting it wrong.
   */
  value: ReactNode;
  /** A qualifier under the figure: a period, a comparison, a unit. */
  hint?: ReactNode;
  size?: StatSize;
}

/**
 * A single figure with its label.
 *
 * @remarks
 * The highest usage-to-complexity ratio found in any consuming project: twenty-four uses across
 * four screens in one, five in a single file in another, and under forty lines in both.
 *
 * The label comes before the value in the DOM as well as on screen, so a screen reader reads "open
 * downloads, twelve" rather than a number with no subject.
 *
 * @example
 * ```tsx
 * <StatGrid>
 *   <Stat label="Open downloads" value={12} />
 *   <Stat label="Disk used" value="4.2 GB" hint="of 20 GB" />
 *   <Stat label="Failed" value={0} size="sm" />
 * </StatGrid>
 * ```
 *
 * @public
 */
export function Stat({ label, value, hint, size = "md", className, ...rest }: StatProps) {
  return (
    <div
      className={["yl-stat", size !== "md" && `yl-stat--${size}`, className].filter(Boolean).join(" ")}
      {...rest}
    >
      <span className="yl-stat__label">{label}</span>
      <span className="yl-stat__value">{value}</span>
      {hint !== undefined && <span className="yl-stat__hint">{hint}</span>}
    </div>
  );
}

export interface StatGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * A responsive row of stats.
 *
 * @remarks
 * Fills by available width rather than by a column count, so the same markup works in a sidebar and
 * across a dashboard. Use {@link Grid} when the number of columns is the thing that matters.
 *
 * @public
 */
export function StatGrid({ className, children, ...rest }: StatGridProps) {
  return (
    <div className={["yl-stat-grid", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}
