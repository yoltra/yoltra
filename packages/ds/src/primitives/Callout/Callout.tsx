import type { ReactNode } from "react";

/** What a callout is telling you. @public */
export type CalloutKind = "info" | "success" | "warning" | "error";

const ICON: Record<CalloutKind, string> = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "⛔",
};

export interface CalloutProps {
  kind?: CalloutKind;
  children: ReactNode;
}

/**
 * An aside that draws attention: a note, a warning, a consequence worth stating.
 *
 * @remarks
 * Rendered as `role="note"` with a decorative icon. The `kind` changes colour and glyph, so
 * the text has to carry the meaning on its own — a reader who cannot see the red will only
 * have the words.
 *
 * @example
 * ```tsx
 * <Callout kind="warning">
 *   A gateway with no authenticator admits nobody. Set one before deploying.
 * </Callout>
 * ```
 *
 * @public
 */
export function Callout({ kind = "info", children }: CalloutProps) {
  const cls = ["yl-callout", kind !== "info" && `yl-callout--${kind}`].filter(Boolean).join(" ");
  return (
    <div className={cls} role="note">
      <span className="yl-callout__icon" aria-hidden>
        {ICON[kind]}
      </span>
      <div className="yl-callout__body">{children}</div>
    </div>
  );
}
