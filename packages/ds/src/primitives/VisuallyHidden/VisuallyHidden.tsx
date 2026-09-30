import type { ElementType, HTMLAttributes, ReactNode } from "react";

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children?: ReactNode;
}

/**
 * Text for assistive technology, invisible on screen.
 *
 * @remarks
 * Not `display: none` and not `hidden` — both remove the content from the accessibility tree
 * as well as from view, which is the opposite of what this is for. The style clips the element
 * to a single pixel while leaving it rendered, so a screen reader still reaches it.
 *
 * The style itself has shipped in `base.css` as `.yl-visually-hidden` for some time; this is
 * the component that was missing.
 *
 * @example
 * ```tsx
 * <button onClick={close}>
 *   <span aria-hidden="true">×</span>
 *   <VisuallyHidden>Close the inspector</VisuallyHidden>
 * </button>
 * ```
 *
 * @public
 */
export function VisuallyHidden({
  as: Tag = "span",
  className,
  children,
  ...rest
}: VisuallyHiddenProps) {
  return (
    <Tag className={["yl-visually-hidden", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </Tag>
  );
}
