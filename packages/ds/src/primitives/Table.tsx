import type { HTMLAttributes, ReactNode } from "react";

/** Themed table primitives. The API-reference PropsTable composes these. */
export function Table({ children, className, ...rest }: HTMLAttributes<HTMLTableElement> & { children: ReactNode }) {
  return (
    <table className={["yl-table", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </table>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TR({ children }: { children: ReactNode }) {
  return <tr>{children}</tr>;
}

export function TH({ children }: { children: ReactNode }) {
  return <th>{children}</th>;
}

export function TD({ children }: { children: ReactNode }) {
  return <td>{children}</td>;
}
