import type { HTMLAttributes, ReactNode } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "brand";
  children: ReactNode;
}

export function Badge({ variant = "neutral", className, children, ...rest }: BadgeProps) {
  const cls = ["yl-badge", variant === "brand" && "yl-badge--brand", className].filter(Boolean).join(" ");
  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  );
}
