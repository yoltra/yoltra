"use client";

import { useCallback, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultId?: string;
  /**
   * How arrow keys behave.
   *
   * @remarks
   * `"automatic"`, the default, moves the selection with the focus, which is what the ARIA
   * practices recommend when a panel is cheap to render: one key press, one result.
   *
   * `"manual"` moves focus only, and selection waits for Enter, Space or a click. It exists for
   * the case the recommendation carves out, a panel expensive enough that arrowing past three of
   * them to reach the fourth would fetch three things nobody asked for.
   */
  activation?: "automatic" | "manual";
}

/**
 * Tabbed panels, implementing the ARIA tabs pattern.
 *
 * @remarks
 * Holds the selected tab in React state, which is why it ships from `@yoltra/ds/client` rather
 * than the server-safe entry.
 *
 * The keyboard contract, which is the part that used to be missing. Earlier versions set the four
 * roles and `aria-selected` and nothing else: every tab was its own tab stop, arrow keys did
 * nothing, and no attribute connected a tab to the panel it controlled. Everything was reachable
 * and operable, so it was a gap rather than a defect, and it was not the pattern anybody using a
 * screen reader expects.
 *
 * Now:
 *
 * - **One tab stop.** The selected tab is the only one with `tabIndex={0}`, so Tab moves past the
 *   whole set rather than through it. Arrow keys move within.
 * - **Arrows follow the writing direction.** `ArrowRight` advances in a left-to-right container
 *   and retreats in a right-to-left one, read from the computed direction rather than assumed.
 *   `Home` and `End` jump to the ends, and the ends wrap.
 * - **`aria-controls` and `aria-labelledby`** tie each tab to its panel and back, so a reader can
 *   move between them and know what it is looking at.
 * - **The panel is focusable.** `tabIndex={0}` means Tab from the selected tab lands in the
 *   content it selected, which matters most when that content holds nothing focusable of its own.
 *
 * @example
 * ```tsx
 * <Tabs
 *   items={[
 *     { id: "npm", label: "npm", content: <CodeBlock code="npm i @yoltra/core" /> },
 *     { id: "pnpm", label: "pnpm", content: <CodeBlock code="pnpm add @yoltra/core" /> },
 *   ]}
 * />
 * ```
 *
 * @public
 */
export function Tabs({ items, defaultId, activation = "automatic" }: TabsProps) {
  const uid = useId();
  const [active, setActive] = useState(defaultId ?? items[0]?.id);
  const current = items.find((i) => i.id === active) ?? items[0];
  // Keyed by item id rather than index: an id survives the list being reordered, an index does not.
  const tabs = useRef(new Map<string, HTMLButtonElement | null>());

  const tabId = (id: string) => `${uid}-tab-${id}`;
  const panelId = (id: string) => `${uid}-panel-${id}`;

  const move = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const from = items.findIndex((item) => item.id === current?.id);
      if (from < 0) return;
      const last = items.length - 1;

      // Read the direction rather than assume it. In a right-to-left container `ArrowRight` moves
      // towards the start, and hard-coding the other way would make the control feel backwards.
      const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
      const forward = rtl ? "ArrowLeft" : "ArrowRight";
      const backward = rtl ? "ArrowRight" : "ArrowLeft";

      let to: number;
      if (event.key === forward) to = from === last ? 0 : from + 1;
      else if (event.key === backward) to = from === 0 ? last : from - 1;
      else if (event.key === "Home") to = 0;
      else if (event.key === "End") to = last;
      else return;

      event.preventDefault();
      const target = items[to];
      if (!target) return;
      // Focus always moves. Selection follows it only under automatic activation, which is the
      // whole difference between the two modes.
      if (activation === "automatic") setActive(target.id);
      tabs.current.get(target.id)?.focus();
    },
    [activation, current?.id, items],
  );

  return (
    <div className="yl-tabs">
      {/* The handler sits on the list rather than each tab: the keys move between siblings, so
          the set is what owns the behaviour. */}
      <div className="yl-tabs__list" role="tablist" onKeyDown={move}>
        {items.map((item) => {
          const selected = item.id === current?.id;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabs.current.set(item.id, node);
              }}
              type="button"
              role="tab"
              id={tabId(item.id)}
              className="yl-tabs__tab"
              data-active={selected}
              aria-selected={selected}
              aria-controls={panelId(item.id)}
              // Roving: the selected tab is the set's single tab stop.
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {current === undefined ? null : (
        <div
          className="yl-tabs__panel"
          role="tabpanel"
          id={panelId(current.id)}
          aria-labelledby={tabId(current.id)}
          tabIndex={0}
        >
          {current.content}
        </div>
      )}
    </div>
  );
}
