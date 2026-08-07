import type { HTMLAttributes, ReactNode } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "brand";
  children: ReactNode;
}

/**
 * A small label for status or category.
 *
 * @remarks
 * Decorative by default. A badge carrying meaning no other text carries — a connection state,
 * a count — should be announced, so give it a `role` and a label rather than trusting colour
 * and position to convey it.
 *
 * @example
 * ```tsx
 * <Badge variant="brand">0.2.0</Badge>
 * <Badge role="status" aria-label="Link open">open</Badge>
 * ```
 *
 * @public
 */
export function Badge({ variant = "neutral", className, children, ...rest }: BadgeProps) {
  const cls = ["yl-badge", variant === "brand" && "yl-badge--brand", className].filter(Boolean).join(" ");
  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  );
}
