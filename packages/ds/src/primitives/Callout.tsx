import type { ReactNode } from "react";

type Kind = "info" | "success" | "warning" | "error";

const ICON: Record<Kind, string> = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "⛔",
};

export interface CalloutProps {
  kind?: Kind;
  children: ReactNode;
}

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
