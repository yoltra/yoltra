"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Portal } from "./Portal";
import { useAnchoredPosition } from "./useAnchoredPosition";
import type { Placement } from "./placement";

/**
 * What the described element has to carry.
 *
 * @remarks
 * `aria-describedby` rather than `aria-label`: a tooltip supplements a control's name, it does
 * not replace it. Labelling with one leaves an icon button whose name disappears the moment the
 * tooltip is not showing.
 *
 * @public
 */
export interface TooltipTriggerProps {
  ref: (node: HTMLElement | null) => void;
  "aria-describedby": string | undefined;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

export interface TooltipProps {
  /** The text shown. Kept to a phrase; a tooltip is not a place for interactive content. */
  content: ReactNode;
  /** Renders the described element, spreading the props that wire and open it. */
  children: (props: TooltipTriggerProps) => ReactNode;
  placement?: Placement;
  offset?: number;
  /** How long the pointer must rest before it appears, in ms. Keyboard focus shows it at once. */
  delayMs?: number;
  container?: HTMLElement | null;
  className?: string;
}

/**
 * A short description that appears on hover or focus.
 *
 * @remarks
 * Uncontrolled, unlike the rest of the overlay tier: a tooltip's visibility belongs to the
 * pointer and the focus ring, not to application state.
 *
 * It never takes focus. Moving focus into a tooltip would strand a keyboard user inside a thing
 * that exists only while they are somewhere else — which is also why it is wired with
 * `aria-describedby` rather than being focusable content. Escape hides it, per the tooltip
 * pattern, for a reader who wants it out of the way without moving the pointer.
 *
 * The pointer delay exists so that a cursor crossing a row of icon buttons does not flash a
 * tooltip on every one of them. Focus skips the delay, because arriving by keyboard is
 * deliberate in a way that passing over with a mouse is not.
 *
 * Ships from `@yoltra/ds/client`. Styles come from `@yoltra/ds/styles/tooltip.css`.
 *
 * @example
 * ```tsx
 * <Tooltip content="Deploy the solar array">
 *   {(props) => <IconButton {...props} label="Deploy" icon={<SunIcon />} />}
 * </Tooltip>
 * ```
 *
 * @public
 */
export function Tooltip({
  content,
  children,
  placement = "top",
  offset = 8,
  delayMs = 400,
  container,
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [bubble, setBubble] = useState<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const position = useAnchoredPosition(anchor, bubble, { placement, offset, active: open });

  const cancel = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const show = useCallback(
    (immediately: boolean) => {
      cancel();
      if (immediately || delayMs <= 0) {
        setOpen(true);
        return;
      }
      timer.current = setTimeout(() => setOpen(true), delayMs);
    },
    [cancel, delayMs],
  );

  const hide = useCallback(() => {
    cancel();
    setOpen(false);
  }, [cancel]);

  // A pending timer outliving the component would fire into an unmounted tree.
  useEffect(() => cancel, [cancel]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    // Not routed through the shared dismissal stack. A tooltip is not a layer — it can be
    // showing over an open dialog, and putting it on the stack would make it swallow the Escape
    // that was meant for the dialog.
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, hide]);

  return (
    <>
      {children({
        ref: setAnchor,
        "aria-describedby": open ? id : undefined,
        onPointerEnter: () => show(false),
        onPointerLeave: hide,
        onFocus: () => show(true),
        onBlur: hide,
      })}
      {open && (
        <Portal container={container}>
          <div
            ref={setBubble}
            id={id}
            role="tooltip"
            data-placement={position.placement}
            className={["yl-tooltip", className].filter(Boolean).join(" ")}
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              visibility: position.positioned ? undefined : "hidden",
            }}
          >
            {content}
          </div>
        </Portal>
      )}
    </>
  );
}
