import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

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
export function TH({ children, ...rest }: ThHTMLAttributes<HTMLTableCellElement> & { children: ReactNode }) {
  return <th {...rest}>{children}</th>;
}

/** A table cell. Accepts `colSpan`, `rowSpan` and the other native attributes. See {@link Table}. @public */
export function TD({ children, ...rest }: TdHTMLAttributes<HTMLTableCellElement> & { children: ReactNode }) {
  return <td {...rest}>{children}</td>;
}
