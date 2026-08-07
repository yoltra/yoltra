"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import { Portal } from "./Portal";
import { focusableWithin, useDismiss, useReturnFocus } from "./hooks";
import { useAnchoredPosition, type Point } from "./useAnchoredPosition";
import type { Placement } from "./placement";

/**
 * What a trigger has to carry for the overlay to be announced correctly.
 *
 * @remarks
 * Handed to the caller's `trigger` render prop rather than left to them to remember. Wiring
 * `aria-expanded` and `aria-controls` by hand is the step that gets skipped, and a screen reader
 * then describes a button that does nothing observable.
 *
 * @public
 */
export interface AnchoredTriggerProps {
  ref: (node: HTMLElement | null) => void;
  "aria-expanded": boolean;
  "aria-haspopup": "dialog" | "menu";
  "aria-controls": string | undefined;
}

/** Props shared by the anchored surfaces. */
export interface AnchoredSurfaceProps {
  /** Whether the surface is on screen. Controlled, like the modal tier. */
  open: boolean;
  onClose: () => void;
  /** The accessible name of the surface. Not rendered; these have no header to name them. */
  label: string;
  children: ReactNode;
  /** Preferred side and alignment. Flipped only if that side does not fit. */
  placement?: Placement;
  /** Gap between anchor and surface, in px. */
  offset?: number;
  container?: HTMLElement | null;
  className?: string;
}

export interface PopoverProps extends AnchoredSurfaceProps {
  /** Renders the trigger, spreading the props that wire it to the surface. */
  trigger: (props: AnchoredTriggerProps) => ReactNode;
}

/** @internal */
interface SurfaceShellProps extends AnchoredSurfaceProps {
  anchor: HTMLElement | Point | null;
  triggerRef: React.RefObject<HTMLElement | null>;
  role: "dialog" | "menu";
  id: string;
  variantClass: string;
  /** What to focus when it opens. `"none"` leaves focus where it was. */
  autoFocus: "first" | "surface" | "none";
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * The portal, the positioning, the dismissal and the focus handling that every anchored surface
 * shares. Not exported; `Popover`, `Menu` and `ContextMenu` are its three shapes.
 *
 * @internal
 */
function SurfaceShell({
  open,
  onClose,
  label,
  children,
  placement = "bottom-start",
  offset = 8,
  container,
  className,
  anchor,
  triggerRef,
  role,
  id,
  variantClass,
  autoFocus,
  onKeyDown,
}: SurfaceShellProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const attachPanel = useCallback((node: HTMLDivElement | null) => {
    panelRef.current = node;
    setPanel(node);
  }, []);

  const position = useAnchoredPosition(anchor, panel, { placement, offset, active: open });

  useReturnFocus(open);
  useDismiss({
    active: open,
    onDismiss: onClose,
    // The trigger counts as inside, so pressing it while open reads as a toggle rather than as a
    // dismissal immediately followed by a re-open.
    refs: [panelRef, triggerRef],
  });

  useEffect(() => {
    if (!open || panel === null || autoFocus === "none") return;
    const first = focusableWithin(panel)[0];
    (autoFocus === "first" && first !== undefined ? first : panel).focus();
  }, [open, panel, autoFocus]);

  /**
   * Closes when focus leaves for something that is neither the surface nor the trigger.
   *
   * These are non-modal, so Tab is allowed to walk out of them — but a panel tethered to a
   * trigger the user has now Tabbed past is visual debris, and it would still be sitting there
   * over unrelated content.
   */
  const onBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node) {
      if (panelRef.current?.contains(next) === true) return;
      if (triggerRef.current?.contains(next) === true) return;
    }
    onClose();
  };

  if (!open) return null;

  return (
    <Portal container={container}>
      <div
        ref={attachPanel}
        id={id}
        role={role}
        aria-label={label}
        tabIndex={-1}
        data-placement={position.placement}
        className={[variantClass, className].filter(Boolean).join(" ")}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          // Hidden rather than unmounted for the frame before measurement: it has to be in the
          // DOM to have a size, and `visibility` reserves layout while `display: none` would not.
          visibility: position.positioned ? undefined : "hidden",
        }}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        {children}
      </div>
    </Portal>
  );
}

/**
 * A non-modal panel anchored to a trigger.
 *
 * @remarks
 * Unlike {@link Dialog}, this does not trap focus or lock scrolling — a popover sits beside the
 * page rather than over it. It closes on Escape, on a press outside it, and when focus leaves for
 * something that is neither it nor its trigger.
 *
 * The `trigger` render prop receives the ARIA wiring (`aria-expanded`, `aria-haspopup`,
 * `aria-controls`) and the ref used to position against. Spread it; the open state stays yours.
 *
 * Ships from `@yoltra/ds/client`. Styles come from `@yoltra/ds/styles/popover.css`.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <Popover
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   label="Telemetry settings"
 *   trigger={(props) => (
 *     <Button {...props} onClick={() => setOpen((v) => !v)}>Settings</Button>
 *   )}
 * >
 *   <Stack gap={3}>…</Stack>
 * </Popover>
 * ```
 *
 * @public
 */
export function Popover({ trigger, ...props }: PopoverProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const id = useId();

  const attachTrigger = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node;
    // In state as well, so the positioning hook re-measures once the trigger exists rather than
    // holding a ref whose identity never changes to tell it.
    setAnchor(node);
  }, []);

  return (
    <>
      {trigger({
        ref: attachTrigger,
        "aria-expanded": props.open,
        "aria-haspopup": "dialog",
        "aria-controls": props.open ? id : undefined,
      })}
      <SurfaceShell
        {...props}
        anchor={anchor}
        triggerRef={triggerRef}
        role="dialog"
        id={id}
        variantClass="yl-popover"
        autoFocus="first"
      />
    </>
  );
}

export interface MenuItemProps {
  /** Runs when the item is chosen, by click or by Enter/Space. */
  onSelect?: () => void;
  /**
   * Announced and skipped on activation, but still reachable with the arrow keys.
   *
   * @remarks
   * `aria-disabled` rather than the `disabled` attribute, deliberately. A `disabled` item is
   * removed from the tab order entirely, so a keyboard user cannot find out that the action
   * exists at all — which is worse than being told it is unavailable.
   */
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * One command in a {@link Menu} or {@link ContextMenu}.
 *
 * @public
 */
export function MenuItem({ onSelect, disabled = false, children, className }: MenuItemProps) {
  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onSelect?.();
  };

  return (
    <button
      type="button"
      role="menuitem"
      // Roving focus: the menu moves focus with the arrow keys, so items are not tab stops.
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      className={["yl-menu__item", className].filter(Boolean).join(" ")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/**
 * A rule between groups of menu items.
 *
 * @public
 */
export function MenuSeparator() {
  return <div role="separator" className="yl-menu__separator" />;
}

/** @internal */
function useMenuKeyboard(onClose: () => void) {
  return useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const surface = event.currentTarget;
      // Disabled items are included on purpose: the arrow keys are how a user discovers that an
      // action exists but is unavailable.
      const items = [...surface.querySelectorAll<HTMLElement>('[role="menuitem"]')];
      if (items.length === 0) return;
      const at = items.indexOf(document.activeElement as HTMLElement);

      const focusAt = (index: number) => {
        event.preventDefault();
        items[(index + items.length) % items.length]!.focus();
      };

      switch (event.key) {
        case "ArrowDown":
          return focusAt(at + 1);
        case "ArrowUp":
          return focusAt(at - 1);
        case "Home":
          return focusAt(0);
        case "End":
          return focusAt(items.length - 1);
        case "Tab":
          // Per the menu pattern, Tab closes and lets focus continue past the trigger rather
          // than cycling inside — a menu is a momentary mode, not a region.
          onClose();
          return;
        default:
          return;
      }
    },
    [onClose],
  );
}

export interface MenuProps extends AnchoredSurfaceProps {
  trigger: (props: AnchoredTriggerProps) => ReactNode;
}

/**
 * A command menu anchored to a trigger, with arrow-key navigation.
 *
 * @remarks
 * Focus moves to the first item on open and roves with ArrowUp/ArrowDown, Home and End, wrapping
 * at both ends. Enter and Space activate — natively, because items are real buttons. Escape and
 * an outside press close it, and so does Tab, which then continues past the trigger.
 *
 * Typeahead (jumping to an item by typing its first letters) is not implemented; for menus of
 * the length a UI menu should be, the arrow keys are enough.
 *
 * Ships from `@yoltra/ds/client`. Styles come from `@yoltra/ds/styles/popover.css`.
 *
 * @example
 * ```tsx
 * <Menu
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   label="Satellite actions"
 *   trigger={(props) => <IconButton {...props} onClick={() => setOpen((v) => !v)} label="Actions" />}
 * >
 *   <MenuItem onSelect={deploy}>Deploy panels</MenuItem>
 *   <MenuItem onSelect={boost} disabled>Boost orbit</MenuItem>
 *   <MenuSeparator />
 *   <MenuItem onSelect={decommission}>Decommission</MenuItem>
 * </Menu>
 * ```
 *
 * @public
 */
export function Menu({ trigger, ...props }: MenuProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const id = useId();
  const onKeyDown = useMenuKeyboard(props.onClose);

  const attachTrigger = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node;
    setAnchor(node);
  }, []);

  return (
    <>
      {trigger({
        ref: attachTrigger,
        "aria-expanded": props.open,
        "aria-haspopup": "menu",
        "aria-controls": props.open ? id : undefined,
      })}
      <SurfaceShell
        {...props}
        anchor={anchor}
        triggerRef={triggerRef}
        role="menu"
        id={id}
        variantClass="yl-menu"
        autoFocus="first"
        onKeyDown={onKeyDown}
      />
    </>
  );
}

export interface ContextMenuProps extends Omit<AnchoredSurfaceProps, "open"> {
  /**
   * Where the menu opens, in viewport coordinates, or `null` when it is closed.
   *
   * @remarks
   * A point rather than an element, because a context menu belongs to the pointer rather than to
   * anything on the page. Take it from a `contextmenu` event's `clientX`/`clientY`.
   */
  at: Point | null;
}

/**
 * A command menu opened at a pointer position.
 *
 * @remarks
 * The same navigation and dismissal as {@link Menu}, anchored to a point instead of an element —
 * the placement maths treats a point as a zero-sized rectangle, so it flips near the bottom of
 * the window and clamps near the right edge exactly as an element-anchored menu does.
 *
 * Ships from `@yoltra/ds/client`. Styles come from `@yoltra/ds/styles/popover.css`.
 *
 * @example
 * ```tsx
 * const [at, setAt] = useState<{ x: number; y: number } | null>(null);
 *
 * <tr onContextMenu={(e) => { e.preventDefault(); setAt({ x: e.clientX, y: e.clientY }); }}>…</tr>
 *
 * <ContextMenu at={at} onClose={() => setAt(null)} label="Row actions">
 *   <MenuItem onSelect={rename}>Rename</MenuItem>
 * </ContextMenu>
 * ```
 *
 * @public
 */
export function ContextMenu({ at, ...props }: ContextMenuProps) {
  // No trigger element to exclude from outside-press detection, and nothing to return focus to
  // beyond whatever the user was on when they opened it.
  const triggerRef = useRef<HTMLElement | null>(null);
  const id = useId();
  const onKeyDown = useMenuKeyboard(props.onClose);

  return (
    <SurfaceShell
      {...props}
      open={at !== null}
      anchor={at}
      triggerRef={triggerRef}
      role="menu"
      id={id}
      variantClass="yl-menu"
      autoFocus="first"
      // A pointer position has no size, so the gap that keeps a panel clear of its trigger would
      // only push the menu away from the cursor that summoned it.
      offset={props.offset ?? 0}
      onKeyDown={onKeyDown}
    />
  );
}
