"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface PortalProps {
  children: ReactNode;
  /**
   * Where to mount. Defaults to `document.body`.
   *
   * @remarks
   * Worth overriding for a page rendered inside a shadow root or a modal-in-a-modal host, and
   * for tests that want the mounted node scoped to the fixture rather than the document.
   */
  container?: HTMLElement | null;
}

/**
 * Renders its children into a detached node under `document.body`.
 *
 * @remarks
 * Every overlay in this package goes through here, because the alternative — rendering in
 * place — loses to CSS in ways no amount of `z-index` fixes. An ancestor with `overflow:
 * hidden` clips the panel, an ancestor with `transform`, `filter` or `will-change` becomes the
 * containing block for `position: fixed`, and an ancestor that established a stacking context
 * traps the overlay beneath whatever sits above *that* ancestor. Portalling to the body sidesteps
 * all three: the overlay's only competition is the document's own stacking order, which is what
 * the `--yl-z-*` tokens describe.
 *
 * Nothing renders until the effect runs, on the server and on the first client render alike, so
 * hydration sees the same empty output on both sides.
 *
 * @example
 * ```tsx
 * <Portal>
 *   <div className="yl-toast">Saved</div>
 * </Portal>
 * ```
 *
 * @public
 */
export function Portal({ children, container }: PortalProps) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const parent = container ?? document.body;
    const el = document.createElement("div");
    // A marker rather than a class: it carries no styling, and it is what a test (or a
    // developer in the inspector) uses to tell a portal root from application markup.
    el.setAttribute("data-yl-portal", "");
    parent.appendChild(el);
    setHost(el);
    return () => el.remove();
  }, [container]);

  return host === null ? null : createPortal(children, host);
}
