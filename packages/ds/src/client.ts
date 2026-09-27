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
