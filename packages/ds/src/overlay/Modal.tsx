"use client";

import { useCallback, useId, useRef, useState, type ReactNode, type RefObject } from "react";

import { Portal } from "./Portal";
import { useDismiss, useFocusTrap, useScrollLock } from "./hooks";

export type DialogSize = "sm" | "md" | "lg" | "full";
export type DrawerSide = "left" | "right" | "top" | "bottom";

/** Props shared by the two modal surfaces. */
export interface ModalSurfaceProps {
  /** Whether the surface is on screen. These are controlled components; there is no internal open state. */
  open: boolean;
  /** Called when the user asks to close — Escape, the scrim, or the close button. */
  onClose: () => void;
  /**
   * The accessible name, rendered in the header.
   *
   * @remarks
   * Required rather than optional. A modal with no name is announced as "dialog" and nothing
   * else, which is the single most common accessibility failure in this component. Wrap it in
   * `VisuallyHidden` if the design calls for no visible heading.
   */
  title: ReactNode;
  /** Optional supporting line, wired up as `aria-describedby`. */
  description?: ReactNode;
  children: ReactNode;
  /** Pinned to the bottom of the surface — actions, usually. */
  footer?: ReactNode;
  /** Whether a press on the scrim closes it. Default `true`. */
  dismissOnOutsideClick?: boolean;
  /** Whether Escape closes it. Default `true`. */
  dismissOnEscape?: boolean;
  /** Whether to render the close button in the header. Default `true`. */
  showCloseButton?: boolean;
  /** Accessible name for the close button. Default `"Close"`. */
  closeLabel?: string;
  /**
   * What to focus on open. Defaults to the first focusable element in the surface.
   *
   * @remarks
   * Worth setting for a destructive confirmation, where the first focusable element is usually
   * the button you least want a stray Enter to press.
   */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Where to portal to. Defaults to `document.body`. */
  container?: HTMLElement | null;
  className?: string;
}

export interface DialogProps extends ModalSurfaceProps {
  /** Width step. `full` fills the viewport minus a margin. */
  size?: DialogSize;
}

export interface DrawerProps extends ModalSurfaceProps {
  /** Which edge it slides from. Default `"right"`. */
  side?: DrawerSide;
  /** Width (left/right) or height (top/bottom). Any CSS length. */
  size?: string;
}

/** @internal */
function ModalSurface({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  dismissOnOutsideClick = true,
  dismissOnEscape = true,
  showCloseButton = true,
  closeLabel = "Close",
  initialFocusRef,
  container,
  className,
  variantClass,
  style,
}: ModalSurfaceProps & { variantClass: string; style?: React.CSSProperties }) {
  // The node in state *and* in a ref: the focus trap has to re-run once the portal has actually
  // mounted the panel, which only a state change can express, while the dismissal listeners read
  // theirs lazily and want the cheaper ref.
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const attachPanel = useCallback((node: HTMLDivElement | null) => {
    panelRef.current = node;
    setPanel(node);
  }, []);
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  useFocusTrap(panel, open, initialFocusRef);
  useScrollLock(open);
  useDismiss({
    active: open,
    onDismiss: onClose,
    // The panel only. The scrim is deliberately *not* listed, so a press on it reads as outside.
    refs: [panelRef],
    closeOnEscape: dismissOnEscape,
    closeOnOutsideClick: dismissOnOutsideClick,
  });

  if (!open) return null;

  return (
    <Portal container={container}>
      <div className="yl-modal">
        {/* Presentational: the dismissal is handled by the pointer listener, and a click target
            that is not a control has no business in the accessibility tree. */}
        <div className="yl-modal__scrim" aria-hidden="true" />
        <div
          ref={attachPanel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description === undefined ? undefined : descriptionId}
          // Focusable as a fallback destination when the surface holds no focusable element,
          // and so Shift+Tab from the first one has somewhere to wrap from.
          tabIndex={-1}
          className={[variantClass, className].filter(Boolean).join(" ")}
          style={style}
        >
          <header className="yl-modal__head">
            <div className="yl-modal__heading">
              <h2 className="yl-modal__title" id={titleId}>
                {title}
              </h2>
              {description !== undefined && (
                <p className="yl-modal__description" id={descriptionId}>
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                className="yl-modal__close"
                onClick={onClose}
                aria-label={closeLabel}
              >
                <span aria-hidden="true">×</span>
              </button>
            )}
          </header>
          <div className="yl-modal__body">{children}</div>
          {footer !== undefined && <footer className="yl-modal__foot">{footer}</footer>}
        </div>
      </div>
    </Portal>
  );
}

/**
 * A modal dialog, centred over a scrim.
 *
 * @remarks
 * Controlled: `open` and `onClose` are the whole state contract, so the surface never disagrees
 * with the application about whether it is showing.
 *
 * While it is open, focus is trapped inside it and returned to whatever had focus before on
 * close, the page behind it does not scroll, and Escape and a press on the scrim both close it.
 * Nested overlays are handled by a shared stack — Escape inside a menu opened from a dialog
 * closes the menu, not both.
 *
 * Ships from `@yoltra/ds/client`: it renders through a portal, manages focus, and listens on
 * the document. Styles come from `@yoltra/ds/styles/modal.css`.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <Dialog
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="Decommission satellite"
 *   description="This cannot be undone."
 *   footer={
 *     <>
 *       <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
 *       <Button onClick={confirm}>Decommission</Button>
 *     </>
 *   }
 * >
 *   <Text>SAT-04 will stop reporting telemetry immediately.</Text>
 * </Dialog>
 * ```
 *
 * @public
 */
export function Dialog({ size = "md", ...props }: DialogProps) {
  return <ModalSurface {...props} variantClass={`yl-dialog yl-dialog--${size}`} />;
}

/**
 * A modal panel anchored to one edge of the viewport.
 *
 * @remarks
 * The same machinery as {@link Dialog} — trapped focus, locked scroll, Escape and scrim
 * dismissal — with the surface pinned to an edge instead of centred. Use it when the content is
 * a list or a form long enough that a centred box would need its own scrollbar anyway.
 *
 * Ships from `@yoltra/ds/client`. Styles come from `@yoltra/ds/styles/modal.css`.
 *
 * @example
 * ```tsx
 * <Drawer open={open} onClose={close} side="right" size="42rem" title="Filters">
 *   <FilterForm />
 * </Drawer>
 * ```
 *
 * @public
 */
export function Drawer({ side = "right", size, ...props }: DrawerProps) {
  return (
    <ModalSurface
      {...props}
      variantClass={`yl-drawer yl-drawer--${side}`}
      style={size === undefined ? undefined : { "--yl-drawer-size": size } as React.CSSProperties}
    />
  );
}
