import type { HTMLAttributes, ReactNode } from "react";

/** Chip kinds. @public */
export type ChipVariant = "neutral" | "brand";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
  children: ReactNode;
}

/**
 * A compact tag for a value: a format, a filter, a keyword.
 *
 * @remarks
 * Distinct from {@link Badge}, which is a pill and says something about *state*. A chip has a
 * small radius and reads as a piece of data, and the difference is worth keeping: a row of pills
 * all claiming to be statuses is noise. A consuming project drew the same line and used both.
 *
 * Not interactive. A removable or selectable chip is a button, and this is a `span`.
 *
 * @example
 * ```tsx
 * <Inline gap={1}>
 *   <Chip>gguf</Chip>
 *   <Chip variant="brand">q4_k_m</Chip>
 * </Inline>
 * ```
 *
 * @public
 */
export function Chip({ variant = "neutral", className, children, ...rest }: ChipProps) {
  return (
    <span className={["yl-chip", `yl-chip--${variant}`, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </span>
  );
}
