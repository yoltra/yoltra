/**
 * @module @yoltra/devtools-storeview
 */

import { useState, type ReactNode } from "react";
import styles from "../../styles/panels/StateTree.module.css";

/**
 * Recursive JSON tree viewer with expand/collapse.
 *
 * Renders any JavaScript value as a navigable tree with collapsible
 * object and array nodes. Nodes at depth < 2 are expanded by default
 * when `defaultExpanded` is set.
 *
 * @param props.data - The value to visualize.
 * @param props.name - Optional root key label.
 * @param props.defaultExpanded - Whether shallow nodes start expanded.
 * @public
 */
export function JsonTree({
  data,
  name,
  defaultExpanded = false,
}: {
  data: unknown;
  name?: string;
  defaultExpanded?: boolean;
}) {
  return (
    <div className={styles.tree}>
      <JsonNode value={data} keyName={name} depth={0} defaultExpanded={defaultExpanded} />
    </div>
  );
}

function JsonNode({
  value,
  keyName,
  depth,
  defaultExpanded,
}: {
  value: unknown;
  keyName?: string;
  depth: number;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded && depth < 2);

  if (value === null) {
    return (
      <div className={styles.nodeRow}>
        {keyName != null && <KeyLabel name={keyName} />}
        <span className={styles.valueNull}>null</span>
      </div>
    );
  }

  if (value === undefined) {
    return (
      <div className={styles.nodeRow}>
        {keyName != null && <KeyLabel name={keyName} />}
        <span className={styles.valueNull}>undefined</span>
      </div>
    );
  }

  if (typeof value === "string") {
    return (
      <div className={styles.nodeRow}>
        {keyName != null && <KeyLabel name={keyName} />}
        <span className={styles.valueString}>&quot;{value}&quot;</span>
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div className={styles.nodeRow}>
        {keyName != null && <KeyLabel name={keyName} />}
        <span className={styles.valueNumber}>{String(value)}</span>
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <div className={styles.nodeRow}>
        {keyName != null && <KeyLabel name={keyName} />}
        <span className={styles.valueBoolean}>{String(value)}</span>
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <ExpandableNode
        keyName={keyName}
        preview={`Array(${value.length})`}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      >
        {value.map((item, i) => (
          <div key={i} className={styles.node}>
            <JsonNode
              value={item}
              keyName={String(i)}
              depth={depth + 1}
              defaultExpanded={defaultExpanded}
            />
          </div>
        ))}
      </ExpandableNode>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <ExpandableNode
        keyName={keyName}
        preview={`{${entries.length}}`}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      >
        {entries.map(([k, v]) => (
          <div key={k} className={styles.node}>
            <JsonNode
              value={v}
              keyName={k}
              depth={depth + 1}
              defaultExpanded={defaultExpanded}
            />
          </div>
        ))}
      </ExpandableNode>
    );
  }

  return (
    <div className={styles.nodeRow}>
      {keyName != null && <KeyLabel name={keyName} />}
      <span>{String(value)}</span>
    </div>
  );
}

function KeyLabel({ name }: { name: string }) {
  return (
    <>
      <span className={styles.key}>{name}</span>
      <span className={styles.colon}>:</span>
    </>
  );
}

function ExpandableNode({
  keyName,
  preview,
  expanded,
  onToggle,
  children,
}: {
  keyName?: string;
  preview: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <div className={styles.nodeRow}>
        <span className={styles.toggle} onClick={onToggle}>
          {expanded ? "\u25BC" : "\u25B6"}
        </span>
        {keyName != null && <KeyLabel name={keyName} />}
        {!expanded && <span className={styles.preview}>{preview}</span>}
      </div>
      {expanded && children}
    </div>
  );
}
