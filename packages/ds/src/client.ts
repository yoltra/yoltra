"use client";

/**
 * @yoltra/ds/client — interactive DS primitives.
 *
 * Components that need React state / browser APIs (theme controller, copy
 * button, tabs) live behind this dedicated entry so that the bundle carries a
 * real `"use client"` directive. Importing `@yoltra/ds` (the default entry)
 * stays server-safe; RSC consumers import interactive pieces from
 * `@yoltra/ds/client`.
 *
 * @module @yoltra/ds/client
 */

export { ThemeProvider, useTheme, applyTheme } from "./theme/ThemeProvider/ThemeProvider";
export type { ThemeContextValue } from "./theme/ThemeProvider/ThemeProvider";
// Also on the default entry, where it sits beside `noFlashScript`. Re-exported here because
// `ThemeProvider` is the thing that writes this key, and a consumer clearing the preference on
// sign-out or wiring their own restore should not have to import a second entry to learn its
// name. Both entries re-export the same binding, so the two cannot drift.
export { THEME_STORAGE_KEY } from "./theme/noFlashScript";
export { CodeBlock } from "./primitives/CodeBlock/CodeBlock";
export type { CodeBlockProps } from "./primitives/CodeBlock/CodeBlock";
export { Tabs } from "./primitives/Tabs/Tabs";
export type { TabsProps, TabItem } from "./primitives/Tabs/Tabs";

// Overlays. Every one of these renders through a portal, so they are client-only by
// construction — there is no `document.body` to mount into during a server render.
export { Portal } from "./overlay/Portal/Portal";
export type { PortalProps } from "./overlay/Portal/Portal";
export { Dialog, Drawer } from "./overlay/Modal/Modal";
export type {
  DialogProps,
  DialogSize,
  DrawerProps,
  DrawerSide,
  ModalSurfaceProps,
} from "./overlay/Modal/Modal";
export { ContextMenu, Menu, MenuItem, MenuSeparator, Popover } from "./overlay/Popover/Popover";
export type {
  AnchoredSurfaceProps,
  AnchoredTriggerProps,
  ContextMenuProps,
  MenuItemProps,
  MenuProps,
  PopoverProps,
} from "./overlay/Popover/Popover";
export { Tooltip } from "./overlay/Tooltip/Tooltip";
export type { TooltipProps, TooltipTriggerProps } from "./overlay/Tooltip/Tooltip";

// The placement maths is deliberately public: it is pure, it is the piece most worth testing,
// and an application positioning something of its own against these tokens should not have to
// reimplement flipping and clamping.
export { resolvePlacement } from "./overlay/placement";
export type {
  Alignment,
  Placement,
  PlacementInput,
  PlacementResult,
  Rect,
  Side,
} from "./overlay/placement";
export type { Point } from "./overlay/useAnchoredPosition";

/**
 * The overlay behaviours, on their own.
 *
 * @remarks
 * These were implemented, shipped inside the bundle and exported by neither entry point, so no
 * consumer could reach them. One consequence is on the record: a consuming project hand-rolled a
 * `role="dialog"` overlay with no focus trap, no Escape handling, no scroll lock and no focus
 * restore, which is exactly the set of things `useFocusTrap`, `useDismiss`, `useScrollLock` and
 * `useReturnFocus` already did.
 *
 * Reach for {@link Dialog}, {@link Drawer}, {@link Popover} or {@link Menu} first. These are for
 * the surface those four do not cover.
 */
export { focusableWithin, useDismiss, useFocusTrap, useReturnFocus, useScrollLock } from "./overlay/hooks";
export type { DismissOptions } from "./overlay/hooks";

/**
 * State a component owns until its caller decides to.
 *
 * @remarks
 * On the client entry because it is a hook. It is the building block the behavioural components
 * are made from, and it is here rather than inlined in each of them because it was found solved
 * three different ways across two consuming projects.
 */
export { useControllableState } from "./hooks/useControllableState";
export type { ControllableStateOptions } from "./hooks/useControllableState";
