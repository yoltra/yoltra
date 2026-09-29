import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

/**
 * A cell holding figures rather than prose.
 *
 * @remarks
 * Exported because `TH` and `TD` both accept it, so it is part of their signature whether it has a
 * name in the reference or not.
 *
 * @public
 */
export interface NumericCellProps {
  /**
   * Right-align and use tabular figures.
   *
   * @remarks
   * Tabular figures give every digit the same width, so a column of numbers does not shuffle
   * sideways as it updates. Written out by hand six times across three consuming projects before
   * it existed here.
   */
  numeric?: boolean;
}

export interface TableScrollProps {
  /**
   * Names the scrollable region.
   *
   * @remarks
   * Required, and not decoration. A scrollable box is focusable so it can be scrolled from the
   * keyboard, and a focusable region with no name is a stop that announces nothing.
   */
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * A horizontal scroll container for a table too wide for its column.
 *
 * @remarks
 * Separate from {@link Table} rather than built into it, because wrapping every table in a scroll
 * region would change the layout of every table that did not need one, and because the label has
 * to come from the caller.
 *
 * A consuming project carried a wrapper of its own at eight call sites, injected through a
 * runtime `<style>` tag, which is a clear enough signal that it belongs here.
 *
 * @example
 * ```tsx
 * <TableScroll label="Published packages">
 *   <Table>{rows}</Table>
 * </TableScroll>
 * ```
 *
 * @public
 */
export function TableScroll({ label, children, className }: TableScrollProps) {
  return (
    <div
      className={["yl-table-scroll", className].filter(Boolean).join(" ")}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

/** Themed table primitives. The API-reference PropsTable composes these. */
/**
 * A data table.
 *
 * @remarks
 * A real `<table>`, with the pieces exported separately so the markup stays semantic — a grid
 * of `<div>`s is announced as a wall of unrelated text, and a screen-reader user navigating by
 * column has nothing to navigate. Give it a `<caption>` when the surrounding heading does not
 * already say what the table holds.
 *
 * @example
 * ```tsx
 * <Table>
 *   <THead><TR><TH scope="col">Peer</TH><TH scope="col">State</TH></TR></THead>
 *   <TBody>
 *     {peers.map((p) => <TR key={p.id}><TD>{p.id}</TD><TD>{p.state}</TD></TR>)}
 *   </TBody>
 * </Table>
 * ```
 *
 * @public
 */
export function Table({ children, className, ...rest }: HTMLAttributes<HTMLTableElement> & { children: ReactNode }) {
  return (
    <table className={["yl-table", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </table>
  );
}

/** A table header. See {@link Table}. @public */
export function THead({ children, ...rest }: HTMLAttributes<HTMLTableSectionElement> & { children: ReactNode }) {
  return <thead {...rest}>{children}</thead>;
}

/** A table body. See {@link Table}. @public */
export function TBody({ children, ...rest }: HTMLAttributes<HTMLTableSectionElement> & { children: ReactNode }) {
  return <tbody {...rest}>{children}</tbody>;
}

/** A table row. See {@link Table}. @public */
export function TR({ children, ...rest }: HTMLAttributes<HTMLTableRowElement> & { children: ReactNode }) {
  return <tr {...rest}>{children}</tr>;
}

/**
 * A table header cell. See {@link Table}.
 *
 * @remarks
 * Pass `scope="col"` or `scope="row"`: it is what lets assistive technology associate each
 * data cell with its header, and it cannot be inferred reliably from position. The attribute
 * reaches the `<th>` untouched, as do `colSpan`, `rowSpan` and the rest.
 *
 * @public
 */
export function TH({
  numeric,
  className,
  children,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & NumericCellProps & { children: ReactNode }) {
  return (
    <th className={[numeric === true && "yl-th--numeric", className].filter(Boolean).join(" ") || undefined} {...rest}>
      {children}
    </th>
  );
}

/** A table cell. Accepts `colSpan`, `rowSpan` and the other native attributes. See {@link Table}. @public */
export function TD({
  numeric,
  className,
  children,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & NumericCellProps & { children: ReactNode }) {
  return (
    <td className={[numeric === true && "yl-td--numeric", className].filter(Boolean).join(" ") || undefined} {...rest}>
      {children}
    </td>
  );
}
