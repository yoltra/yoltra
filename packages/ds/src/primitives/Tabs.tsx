"use client";

import { useState, type ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultId?: string;
}

export function Tabs({ items, defaultId }: TabsProps) {
  const [active, setActive] = useState(defaultId ?? items[0]?.id);
  const current = items.find((i) => i.id === active) ?? items[0];

  return (
    <div className="yl-tabs">
      <div className="yl-tabs__list" role="tablist">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            className="yl-tabs__tab"
            data-active={item.id === current?.id}
            aria-selected={item.id === current?.id}
            onClick={() => setActive(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="yl-tabs__panel" role="tabpanel">
        {current?.content}
      </div>
    </div>
  );
}
