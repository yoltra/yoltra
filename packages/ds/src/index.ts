/**
 * @yoltra/ds — Yoltra Design System.
 *
 * Foundation tokens, semantic themes, a CSS-variable stylesheet generator, and
 * server-safe primitive React components shared across the Yoltra website,
 * docs, and examples. Theming is driven entirely by a `data-theme` attribute on
 * the document root, so these primitives render on the server.
 *
 * Interactive controls (theme controller, tabs, copy button) that need React
 * state or browser APIs are published from the `@yoltra/ds/client`
 * entry (`@yoltra/ds/client`), which ships a real `"use client"` directive.
 *
 * @module @yoltra/ds
 */

// Tokens & themes
export { foundationTokens } from "./tokens/tokens";
export type {
  FoundationTokens,
  FontTokens,
  FontStyleToken,
  PaletteTokens,
  ColorScale,
  CSSLength,
} from "./tokens/tokens";

export { lightTheme, darkTheme, themes } from "./tokens/themes";
export type { ThemeTokens, SemanticColorTokens, ThemeId } from "./tokens/themes";

export { themeCss } from "./tokens/css";

// Server-safe primitives. Interactive primitives (CodeBlock, Tabs) and the
// theme controller (ThemeProvider/useTheme/applyTheme) live in ./client.
export { Button, ButtonLink } from "./primitives/Button";
export { ButtonGroup, IconButton } from "./primitives/Button";
export type {
  ButtonGroupProps,
  ButtonLinkProps,
  ButtonProps,
  ButtonSize,
  ButtonVariant,
  IconButtonProps,
} from "./primitives/Button";
export { Badge } from "./primitives/Badge";
export type { BadgeProps } from "./primitives/Badge";
export { Callout } from "./primitives/Callout";
export type { CalloutProps, CalloutKind } from "./primitives/Callout";
export { Input, Select, Textarea } from "./primitives/Field";
export type { InputProps, SelectProps, TextareaProps, FieldSize } from "./primitives/Field";
export { Table, THead, TBody, TR, TH, TD } from "./primitives/Table";

// Layout
export { Container, Divider, Grid, Inline, Stack } from "./primitives/Layout";
export type {
  Align,
  ContainerProps,
  DividerProps,
  FlowProps,
  GridProps,
  InlineProps,
  Justify,
  SpaceToken,
  StackProps,
} from "./primitives/Layout";
export { Card } from "./primitives/Card";
export type { CardProps, CardElevation } from "./primitives/Card";

// Typography
export { Heading, InlineCode, Kbd, Link, Text } from "./primitives/Typography";
export type {
  HeadingProps,
  LinkProps,
  TextProps,
  TextSize,
  TextTone,
} from "./primitives/Typography";

// Feedback
export { EmptyState, Skeleton, Spinner } from "./primitives/Feedback";
export type { EmptyStateProps, SkeletonProps, SpinnerProps } from "./primitives/Feedback";

// Utility
export { VisuallyHidden } from "./primitives/VisuallyHidden";
export type { VisuallyHiddenProps } from "./primitives/VisuallyHidden";

// Forms
export {
  Checkbox,
  Fieldset,
  FormField,
  Radio,
  RadioGroup,
  Slider,
  Switch,
} from "./primitives/Form";
export type {
  CheckboxProps,
  FieldControlProps,
  FieldsetProps,
  FormFieldProps,
  RadioGroupProps,
  RadioProps,
  SliderProps,
  SwitchProps,
  ToggleProps,
} from "./primitives/Form";
