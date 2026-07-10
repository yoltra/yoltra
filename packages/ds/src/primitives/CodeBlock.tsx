"use client";

import { useCallback, useState, type ReactNode } from "react";

export interface CodeBlockProps {
  /** Raw code as a string. When provided it is used verbatim for copying. */
  code?: string;
  /** Optional language label shown in the header. */
  language?: string;
  /** Optional filename/title shown in the header. */
  title?: string;
  /**
   * Pre-highlighted markup (e.g. Shiki output) to render instead of `code`.
   * When set, `code` is still used as the copy source.
   */
  children?: ReactNode;
}

/**
 * Prettified code block with a copy-to-clipboard affordance. Highlighting is
 * delegated to the consumer (pass `children` as highlighted HTML); the DS owns
 * the chrome, copy behavior, and theming.
 */
export function CodeBlock({ code, language, title, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(() => {
    const text = code ?? "";
    if (!text || typeof navigator === "undefined" || !navigator.clipboard) return;
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [code]);

  return (
    <div className="yl-code">
      <div className="yl-code__head">
        <span>{title ?? language ?? "code"}</span>
        <button type="button" className="yl-code__copy" onClick={onCopy} aria-label="Copy code">
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      {children ?? (
        <pre>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
