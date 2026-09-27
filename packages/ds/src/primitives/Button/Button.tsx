import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden";

/** Visual weight of a button. @public */
export type ButtonVariant = "primary" | "ghost" | "danger";
/**
 * Button scale.
 *
 * @remarks
 * `md` is 36px tall, which is comfortable with a pointer. `lg` is 44px, the size a finger needs,
 * and is what a control used standing up at a counter should be. `sm` is for dense chrome.
 *
 * @public
 */
export type ButtonSize = "md" | "sm" | "lg";

function classes(variant: ButtonVariant, size: ButtonSize, className?: string): string {
  return ["yl-btn", `yl-btn--${variant}`, size !== "md" && `yl-btn--${size}`, className]
    .filter(Boolean)
    .join(" ");
}

/**
 * The shared shape of a button's state props.
 *
 * @remarks
 * `loading` and `pressed` are deliberately separate from `disabled`. A loading button is still
 * the control you just pressed and should keep its focus; a pressed one is a toggle and has to
 * say so.
 */
interface ButtonStateProps {
  /**
   * Work is in flight.
   *
   * @remarks
   * Sets `aria-busy` and `aria-disabled` rather than `disabled`, so the control keeps its place in
   * the tab order and a reader is not thrown out of it mid-action. Clicks are swallowed while it
   * is set.
   *
   * The label stays in the layout at zero opacity rather than being hidden, which keeps the
   * button exactly as wide as it was and keeps its accessible name: `visibility: hidden` and
   * `display: none` both remove the text from the accessibility tree, leaving a busy button with
   * no name.
   */
  loading?: boolean;
  /**
   * Whether a toggle button is on.
   *
   * @remarks
   * Becomes `aria-pressed`. Set it only when the button really is a toggle: on a button that
   * performs an action, `aria-pressed` reports a state that does not exist.
   */
  pressed?: boolean;
}

/** The label and the spinner, or just the children when nothing is in flight. */
function content(loading: boolean | undefined, children: ReactNode): ReactNode {
  if (loading !== true) return children;
  return (
    <>
      <span className="yl-btn__label">{children}</span>
      <span className="yl-btn__spinner" aria-hidden="true" />
    </>
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStateProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

/**
 * A button.
 *
 * @remarks
 * `primary` for the one action a view is about; `ghost` for everything beside it. A screen
 * with two primary buttons has told the reader nothing about which one to press. `danger` for
 * something that destroys, and only for that: a warning colour used for emphasis stops reading
 * as a warning.
 *
 * @example
 * ```tsx
 * <Button onClick={connect}>Connect</Button>
 * <Button variant="ghost" size="sm" onClick={cancel}>Cancel</Button>
 * <Button variant="danger" onClick={remove}>Delete</Button>
 * <Button size="lg" loading={saving} onClick={save}>Save</Button>
 * <Button pressed={bold} onClick={toggleBold}>Bold</Button>
 * ```
 *
 * @public
 */
export function Button({
  variant = "primary",
  size = "md",
  loading,
  pressed,
  className,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={classes(variant, size, className)}
      aria-busy={loading === true ? true : undefined}
      aria-disabled={loading === true ? true : undefined}
      aria-pressed={pressed}
      onClick={loading === true ? undefined : onClick}
      {...rest}
    >
      {content(loading, children)}
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

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStateProps {
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
  loading,
  pressed,
  className,
  children,
  onClick,
  ...rest
}: IconButtonProps) {
  const cls = ["yl-icon-btn", classes(variant, size), className].filter(Boolean).join(" ");
  return (
    <button
      className={cls}
      aria-busy={loading === true ? true : undefined}
      aria-disabled={loading === true ? true : undefined}
      aria-pressed={pressed}
      onClick={loading === true ? undefined : onClick}
      {...rest}
    >
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
