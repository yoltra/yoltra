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

export { ThemeProvider, useTheme, applyTheme } from "./theme/ThemeProvider";
export { CodeBlock } from "./primitives/CodeBlock";
export type { CodeBlockProps } from "./primitives/CodeBlock";
export { Tabs } from "./primitives/Tabs";
export type { TabsProps, TabItem } from "./primitives/Tabs";
