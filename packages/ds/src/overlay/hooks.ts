"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * What counts as focusable, for the purpose of trapping focus.
 *
 * @remarks
 * Deliberately not filtered by visibility. The obvious tests — `offsetParent`, `getClientRects()`
 * — both depend on layout, and jsdom performs none, so a visibility filter would reject every
 * candidate in a test run and quietly turn the trap into a no-op exactly where it is being
 * verified. Explicit opt-outs (`disabled`, `hidden`, `aria-hidden`, `tabindex="-1"`) are
 * declarative, so they are honoured in both environments.
 *
 * @internal
 */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "audio[controls]",
  "video[controls]",
  "details > summary:first-of-type",
  "iframe",
].join(",");

/** @internal */
export function focusableWithin(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.hasAttribute("hidden") && el.getAttribute("aria-hidden") !== "true",
  );
}

/**
 * One entry per open overlay, innermost last.
 *
 * @remarks
 * A stack rather than a set, because "dismiss" is only ever meant for the layer on top. Without
 * one, Escape inside a menu that sits inside a dialog closes both — the dialog was listening too,
 * and had no way to know something was above it.
 *
 * @internal
 */
interface DismissEntry {
  onDismiss: () => void;
  closeOnEscape: boolean;
  closeOnOutsideClick: boolean;
  /** Whether a pointer event landed inside this layer (its panel, its trigger, …). */
  ownsTarget: (target: Node) => boolean;
}

/** @internal */
const stack: DismissEntry[] = [];

/** @internal */
function topEntry(): DismissEntry | undefined {
  return stack[stack.length - 1];
}

/** @internal */
function onKeyDown(event: KeyboardEvent): void {
  if (event.key !== "Escape") return;
  const top = topEntry();
  if (top === undefined) return;
  // Consumed by the top layer whether or not that layer closes on it. Letting it through would
  // dismiss whatever is underneath, which from the user's side reads as one keystroke closing
  // two things.
  event.stopPropagation();
  if (!top.closeOnEscape) return;
  event.preventDefault();
  top.onDismiss();
}

/** @internal */
function onPointerDown(event: Event): void {
  const top = topEntry();
  if (top === undefined || !top.closeOnOutsideClick) return;
  const target = event.target;
  // `pointerdown` rather than `click`: a selection dragged from inside the panel to outside it
  // ends in a click on the outside, and closing there loses the user's work mid-gesture.
  if (target instanceof Node && top.ownsTarget(target)) return;
  top.onDismiss();
}

/** @internal */
function setListening(on: boolean): void {
  const method = on ? "addEventListener" : "removeEventListener";
  // Capture, so a child that stops propagation cannot make an overlay undismissable.
  document[method]("keydown", onKeyDown as EventListener, true);
  document[method]("pointerdown", onPointerDown, true);
}

export interface DismissOptions {
  /** Whether this layer is currently open. */
  active: boolean;
  onDismiss: () => void;
  /** Elements that count as "inside": the panel, and for an anchored layer its trigger. */
  refs: Array<RefObject<HTMLElement | null>>;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
}

/**
 * Closes the topmost overlay on Escape or on a pointer press outside it.
 *
 * @remarks
 * Registers into a module-level stack shared by every overlay in the package, so exactly one
 * layer — the innermost — responds to a given dismissal. See {@link DismissEntry}.
 *
 * @internal
 */
export function useDismiss({
  active,
  onDismiss,
  refs,
  closeOnEscape = true,
  closeOnOutsideClick = true,
}: DismissOptions): void {
  // Read through refs so a caller passing an inline arrow does not re-register the layer on
  // every render — which would briefly leave the stack empty, and reorder it.
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const refsRef = useRef(refs);
  refsRef.current = refs;

  useEffect(() => {
    if (!active) return;

    const entry: DismissEntry = {
      onDismiss: () => onDismissRef.current(),
      closeOnEscape,
      closeOnOutsideClick,
      ownsTarget: (target) =>
        refsRef.current.some((ref) => ref.current?.contains(target) === true),
    };
    stack.push(entry);
    if (stack.length === 1) setListening(true);

    return () => {
      const at = stack.indexOf(entry);
      if (at !== -1) stack.splice(at, 1);
      if (stack.length === 0) setListening(false);
    };
  }, [active, closeOnEscape, closeOnOutsideClick]);
}

/**
 * Remembers what had focus when `active` turned on, and gives it back when it turns off.
 *
 * @remarks
 * The half of focus management that gets forgotten. Without it, closing an overlay drops focus
 * onto `<body>` and the next Tab starts from the top of the document — so a keyboard user who
 * opened something from halfway down a page is returned to the beginning of it.
 *
 * Separate from {@link useFocusTrap} because the anchored overlays want this and *not* the
 * trapping: a popover is non-modal, and Tab is supposed to be able to leave it.
 *
 * @internal
 */
export function useReturnFocus(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    return () => {
      // Only if it is still in the document: an overlay opened from a row it then deleted has
      // nowhere to go back to, and focusing a detached node lands on `<body>` anyway.
      if (previous !== null && previous.isConnected) previous.focus();
    };
  }, [active]);
}

/**
 * Holds keyboard focus inside `container` while `active`, and gives it back afterwards.
 *
 * @remarks
 * Restoring focus afterwards is delegated to {@link useReturnFocus}, so the two overlay tiers
 * cannot drift apart on it.
 *
 * @internal
 */
export function useFocusTrap(
  container: HTMLElement | null,
  active: boolean,
  initialFocus?: RefObject<HTMLElement | null>,
): void {
  const initialFocusRef = useRef(initialFocus);
  initialFocusRef.current = initialFocus;

  useReturnFocus(active);

  useEffect(() => {
    if (!active || container === null) return;

    const target =
      initialFocusRef.current?.current ?? focusableWithin(container)[0] ?? container;
    target.focus();

    const onTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = focusableWithin(container);
      if (focusable.length === 0) {
        // Nothing to move between, so the only correct destination is the panel itself.
        event.preventDefault();
        container.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const activeEl = document.activeElement;
      if (event.shiftKey && (activeEl === first || activeEl === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", onTab);
    return () => container.removeEventListener("keydown", onTab);
    // Keyed on the element, not on a ref object. The panel is portalled, and a portal renders
    // nothing until its own effect has run — so on the render that opens an overlay the ref is
    // still null when this effect fires, and a ref identity never changes to bring it back.
  }, [container, active]);
}

/**
 * How many layers currently want the page not to scroll.
 * @internal
 */
let scrollLocks = 0;
/** @internal */
let restoreScroll: (() => void) | null = null;

/**
 * Freezes page scrolling while `active`.
 *
 * @remarks
 * Reference-counted, because two overlays can want it at once and the second one closing must
 * not hand scrolling back while the first is still open.
 *
 * The scrollbar is replaced by equivalent padding. Removing it without compensating changes the
 * viewport width, and the page visibly jumps sideways as the dialog opens.
 *
 * @internal
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    if (++scrollLocks === 1) {
      const { body } = document;
      const previousOverflow = body.style.overflow;
      const previousPadding = body.style.paddingRight;
      const gap = window.innerWidth - document.documentElement.clientWidth;
      body.style.overflow = "hidden";
      if (gap > 0) body.style.paddingRight = `${gap}px`;
      restoreScroll = () => {
        body.style.overflow = previousOverflow;
        body.style.paddingRight = previousPadding;
      };
    }

    return () => {
      if (--scrollLocks === 0) {
        restoreScroll?.();
        restoreScroll = null;
      }
    };
  }, [active]);
}
