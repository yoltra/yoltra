import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";
type Size = "md" | "sm";

function classes(variant: Variant, size: Size, className?: string): string {
  return ["yl-btn", `yl-btn--${variant}`, size === "sm" && "yl-btn--sm", className].filter(Boolean).join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", className, children, ...rest }: ButtonProps) {
  return (
    <button className={classes(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

/** Anchor styled as a button — for links that should look like actions. */
export function ButtonLink({ variant = "primary", size = "md", className, children, ...rest }: ButtonLinkProps) {
  return (
    <a className={classes(variant, size, className)} {...rest}>
      {children}
    </a>
  );
}
