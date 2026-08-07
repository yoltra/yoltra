import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { VisuallyHidden } from "./VisuallyHidden";

/** Visual weight of a button. @public */
export type ButtonVariant = "primary" | "ghost";
/** Button scale. @public */
export type ButtonSize = "md" | "sm";

function classes(variant: ButtonVariant, size: ButtonSize, className?: string): string {
  return ["yl-btn", `yl-btn--${variant}`, size === "sm" && "yl-btn--sm", className].filter(Boolean).join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

/**
 * A button.
 *
 * @remarks
 * `primary` for the one action a view is about; `ghost` for everything beside it. A screen
 * with two primary buttons has told the reader nothing about which one to press.
 *
 * @example
 * ```tsx
 * <Button onClick={connect}>Connect</Button>
 * <Button variant="ghost" size="sm" onClick={cancel}>Cancel</Button>
 * ```
 *
 * @public
 */
export function Button({ variant = "primary", size = "md", className, children, ...rest }: ButtonProps) {
  return (
    <button className={classes(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

/** Anchor styled as a button — for links that should look like actions. */
/**
 * An anchor that looks like a button.
 *
 * @remarks
 * For navigation that should read as an action. It stays an `<a>`, so it keeps the things
 * links have and buttons do not — opening in a new tab, copying the address, being followed by
 * a crawler. Use {@link Button} when the thing does not go anywhere.
 *
 * @example
 * ```tsx
 * <ButtonLink href="/docs/quick-start">Read the guide</ButtonLink>
 * ```
 *
 * @public
 */
export function ButtonLink({ variant = "primary", size = "md", className, children, ...rest }: ButtonLinkProps) {
  return (
    <a className={classes(variant, size, className)} {...rest}>
      {children}
    </a>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * What the button does, in words.
   *
   * @remarks
   * Required, and rendered visually hidden. An icon button with no accessible name is
   * announced as "button" and nothing else, which is among the most common failures in any
   * interface — so this component does not offer the option of omitting it.
   */
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** The glyph. Hidden from assistive technology, since `label` carries the meaning. */
  children: ReactNode;
}

/**
 * A button showing only an icon.
 *
 * @example
 * ```tsx
 * <IconButton label="Copy to clipboard" variant="ghost" onClick={copy}>⧉</IconButton>
 * ```
 *
 * @public
 */
export function IconButton({
  label,
  variant = "ghost",
  size = "md",
  className,
  children,
  ...rest
}: IconButtonProps) {
  const cls = ["yl-icon-btn", classes(variant, size), className].filter(Boolean).join(" ");
  return (
    <button className={cls} {...rest}>
      <span aria-hidden="true">{children}</span>
      <VisuallyHidden>{label}</VisuallyHidden>
    </button>
  );
}

export interface ButtonGroupProps {
  /**
   * Names the group.
   *
   * @remarks
   * Required because a bare `role="group"` announces a boundary without saying what it
   * contains, which is noise rather than information.
   */
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * Related buttons, joined into one control.
 *
 * @example
 * ```tsx
 * <ButtonGroup label="Timeline controls">
 *   <Button variant="ghost" size="sm">Back</Button>
 *   <Button variant="ghost" size="sm">Forward</Button>
 * </ButtonGroup>
 * ```
 *
 * @public
 */
export function ButtonGroup({ label, children, className }: ButtonGroupProps) {
  return (
    <div className={["yl-btn-group", className].filter(Boolean).join(" ")} role="group" aria-label={label}>
      {children}
    </div>
  );
}
