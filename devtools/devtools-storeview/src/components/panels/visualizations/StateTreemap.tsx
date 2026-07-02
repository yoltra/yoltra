/**
 * @module @yoltra/devtools-storeview
 */

import { ResponsiveTreeMap } from "@nivo/treemap";
import type { EventLogEntry } from "@yoltra/devtools-ui";
import { useCallback, useMemo, useState } from "react";
import { useNivoTheme } from "../../../hooks/useNivoTheme";
import styles from "./StateTreemap.module.css";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * A node in the logical tree derived from the store state.
 *
 * @remarks
 * Built recursively by {@link buildTree} from any arbitrary state value.
 * Each node's `size` approximates the byte-length of its serialised JSON
 * subtree, used to compute treemap cell proportions.
 */
interface TreemapNode {
  /** The object key or array index this node represents. */
  key: string;
  /**
   * Dot-separated path from the state root (e.g. `"todos.items.0.title"`).
   * Empty string for the synthetic root.
   */
  path: string;
  /**
   * Approximate byte-size of this subtree's serialised JSON.
   *
   * @remarks
   * Leaf nodes use `JSON.stringify(value).length ?? 1`.
   * Parent nodes sum their children's sizes, floored at 1.
   */
  size: number;
  /** Raw value at this node (primarily meaningful for leaf nodes). */
  value: unknown;
  /** Child nodes for objects and arrays. Empty for primitive leaves. */
  children: TreemapNode[];
}

/**
 * Shape passed to the Nivo `<ResponsiveTreeMap>`.
 *
 * @remarks
 * Uses `id` (dot-path, globally unique) as identity and `value` (JSON size)
 * for the leaf node area. `rawValue` is threaded through for tooltip preview.
 * Non-leaf nodes omit `value`; Nivo computes their total from children.
 */
interface NivoTreeDatum {
  /** Unique dot-path identifier (e.g. `"todos"`, `"todos.items"`). */
  id: string;
  /** Display key shown as the node label (e.g. `"todos"`). */
  name: string;
  /** JSON byte-size — used by Nivo for leaf area. Omitted on non-leaves. */
  value?: number;
  /** Original JS value, used for the hover tooltip value preview. */
  rawValue?: unknown;
  /** Children for non-leaf nodes. */
  children?: NivoTreeDatum[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * How long (ms) a cell remains "hot" (tinted accent) after its slice was
 * last patched.
 */
const HOT_THRESHOLD_MS = 3_000;

/**
 * Maximum recursion depth when building the logical tree.
 * Prevents call-stack exhaustion on deeply nested or circular state.
 */
const MAX_DEPTH = 6;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Recursively builds a {@link TreemapNode} tree from a state value.
 *
 * @remarks
 * - Objects produce a node whose children are its `Object.entries`.
 * - Arrays produce a node whose children are index-keyed entries.
 * - Primitives, `null`, and nodes at `MAX_DEPTH` produce leaf nodes.
 *
 * @param value      - Any store state value.
 * @param key        - The key this value is stored under in its parent.
 * @param parentPath - Dot-separated path of the parent (empty for root).
 * @param depth      - Current recursion depth (starts at 0).
 */
function buildTree(value: unknown, key: string, parentPath: string, depth = 0): TreemapNode {
  const path = parentPath ? `${parentPath}.${key}` : key;

  if (depth >= MAX_DEPTH || value === null || typeof value !== "object") {
    const size = JSON.stringify(value)?.length ?? 1;
    return { key, path, size: Math.max(size, 1), value, children: [] };
  }

  const entries: [string, unknown][] = Array.isArray(value)
    ? (value as unknown[]).map((v, i) => [String(i), v])
    : Object.entries(value as Record<string, unknown>);

  const children = entries.map(([k, v]) => buildTree(v, k, path, depth + 1));
  const size = Math.max(
    children.reduce((s, c) => s + c.size, 0),
    1,
  );

  return { key, path, size, value, children };
}

/**
 * Converts a {@link TreemapNode} to the Nivo {@link NivoTreeDatum} shape.
 *
 * @remarks
 * Non-leaf nodes omit `value`; Nivo sums children recursively. Leaf nodes
 * carry `value = node.size` and `rawValue = node.value` for the tooltip.
 *
 * @param node - A node from the logical tree produced by `buildTree`.
 */
function toNivoTree(node: TreemapNode): NivoTreeDatum {
  const id = node.path || node.key;
  if (node.children.length === 0) {
    return { id, name: node.key, value: node.size, rawValue: node.value };
  }
  return {
    id,
    name: node.key,
    children: node.children.map(toNivoTree),
  };
}

/**
 * Collects the set of top-level reducer slice keys that were patched in the
 * last {@link HOT_THRESHOLD_MS} milliseconds.
 *
 * @remarks
 * JSON Pointer paths from the Yoltra devtools agent always begin with
 * `/${reducerName}/...`, so the first path segment identifies the reducer.
 *
 * @param entries - Full event log from `useEventLog`.
 */
function recentlyChangedKeys(entries: EventLogEntry[]): Set<string> {
  const cutoff = Date.now() - HOT_THRESHOLD_MS;
  const changed = new Set<string>();

  // Walk backwards — stop as soon as we exit the hot window.
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i]!;
    if (new Date(entry.timestamp).getTime() < cutoff) break;

    for (const patch of entry.patches) {
      const segment = patch.path.slice(1).split("/")[0];
      if (segment) changed.add(segment);
    }
  }

  return changed;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Visualises the store state as a zoomable, size-proportional treemap using Nivo.
 *
 * ## What it shows
 * Each rectangle represents a node in the state tree. **Area** is proportional
 * to the approximate serialised JSON byte-size of that subtree. Cells whose
 * top-level reducer slice was patched in the last 3 seconds are tinted with
 * `--devtools-accent` (blue).
 *
 * ## Drill-down
 * Clicking a parent cell navigates into its children, updating `rootPath`.
 * The breadcrumb shows the current navigation path; clicking any crumb
 * navigates back to that level. Stale path segments (deleted state keys)
 * automatically reset to the root.
 *
 * ## Nivo
 * Replaced the original hand-rolled slice-and-dice SVG with `<ResponsiveTreeMap>`
 * for accessibility, hover animations, and built-in label management.
 * The `buildTree` → `toNivoTree` pipeline keeps all data derivation logic
 * intact; only the rendering layer changed.
 *
 * @param props.state   - Current store state from {@link useStoreState}.
 * @param props.loading - Whether a state fetch is in progress.
 * @param props.entries - Event log for recent-change highlighting.
 *
 * @public
 */
export function StateTreemap({
  state,
  loading,
  entries,
}: {
  state: unknown;
  loading: boolean;
  entries: EventLogEntry[];
}) {
  const theme = useNivoTheme();

  /**
   * Navigation path — key segments drilled into from the root.
   *
   * @example
   * `[]`                 → showing state root children
   * `["todos"]`          → inside the `todos` slice
   * `["todos", "items"]` → inside `todos.items`
   */
  const [rootPath, setRootPath] = useState<string[]>([]);

  // Build the full logical tree from the state object.
  const rootTree = useMemo<TreemapNode | null>(() => {
    if (state == null || typeof state !== "object") return null;

    const children = Object.entries(state as Record<string, unknown>).map(([k, v]) =>
      buildTree(v, k, "", 0),
    );
    const size = Math.max(
      children.reduce((s, c) => s + c.size, 0),
      1,
    );
    return { key: "state", path: "", size, value: state, children };
  }, [state]);

  // Traverse the tree to the node at `rootPath`.
  // Falls back to rootTree when a path segment becomes stale (key deleted).
  const currentNode = useMemo<TreemapNode | null>(() => {
    if (!rootTree) return null;
    let node: TreemapNode = rootTree;
    for (const segment of rootPath) {
      const child = node.children.find((c) => c.key === segment);
      if (!child) {
        // Path is stale — reset to root.
        setRootPath([]);
        return rootTree;
      }
      node = child;
    }
    return node;
  }, [rootTree, rootPath]);

  // Convert the current subtree to Nivo format.
  const nivoRoot = useMemo<NivoTreeDatum>(() => {
    if (!currentNode || currentNode.children.length === 0) {
      // Leaf or empty — provide a minimal placeholder so Nivo renders nothing.
      return { id: "root", name: "state", value: 1 };
    }
    return {
      id: "root",
      name: "state",
      children: currentNode.children.map(toNivoTree),
    };
  }, [currentNode]);

  // Collect top-level keys patched in the last HOT_THRESHOLD_MS milliseconds.
  const hotKeys = useMemo(() => recentlyChangedKeys(entries), [entries]);

  const navigateTo = useCallback((segments: string[]) => {
    setRootPath(segments);
  }, []);

  if (loading && state == null) {
    return <div className={styles.loading}>Loading state...</div>;
  }

  if (state == null) {
    return <div className={styles.empty}>No state available</div>;
  }

  const crumbs = ["state", ...rootPath];
  const isLeafView = currentNode != null && currentNode.children.length === 0;

  return (
    <div className={styles.container}>
      {/* ── Breadcrumb ────────────────────────────────────────────────── */}
      <div className={styles.breadcrumb}>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={i} className={styles.crumbSegment}>
              {i > 0 && <span className={styles.crumbSep}>›</span>}
              <button
                className={`${styles.crumbBtn} ${isLast ? styles.crumbBtnActive : ""}`}
                onClick={() => navigateTo(rootPath.slice(0, i))}
                disabled={isLast}
              >
                {crumb}
              </button>
            </span>
          );
        })}
      </div>

      {/* ── Treemap chart ─────────────────────────────────────────────── */}
      {isLeafView ? (
        <div className={styles.empty}>Leaf node — no children to display</div>
      ) : (
        <div className={styles.chartContainer} style={{ height: "100%" }}>
          <ResponsiveTreeMap
            data={nivoRoot}
            identity='id'
            value='value'
            valueFormat='>-.0f'
            theme={theme}
            margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
            innerPadding={3}
            outerPadding={3}
            /*
             * Hot cells (top-level reducer patched < 3s ago) get an accent
             * tint. The top-level key of a node is the first segment of its
             * dot-path id (e.g. "todos" for both "todos" and "todos.items").
             */
            colors={(node) => {
              const topKey = node.id.split(".")[0] ?? "";
              return hotKeys.has(topKey) ? "rgba(0, 122, 204, 0.35)" : "#2d2d30";
            }}
            borderColor='#3c3c3c'
            borderWidth={1}
            enableLabel={true}
            label={(node) => node.data.name}
            labelSkipSize={20}
            labelTextColor='#cccccc'
            enableParentLabel={true}
            parentLabel={(node) => node.data.name}
            parentLabelSize={14}
            parentLabelTextColor='#cccccc'
            nodeOpacity={1}
            onClick={(node) => {
              // Drill into parent nodes; leaf clicks are no-ops.
              if (node.isParent) {
                navigateTo([...rootPath, node.data.name]);
              }
            }}
            tooltip={({ node }) => (
              <div
                style={{
                  background: "#252526",
                  color: "#cccccc",
                  border: "1px solid #3c3c3c",
                  borderRadius: "3px",
                  fontSize: 11,
                  fontFamily: "monospace",
                  padding: "6px 10px",
                  lineHeight: 1.5,
                  maxWidth: 280,
                }}
              >
                <code style={{ color: "#3794ff" }}>{node.id}</code>
                <div style={{ color: "#6e6e6e" }}>
                  ~{Math.round(node.value).toLocaleString()} B
                </div>
                {node.isLeaf && node.data.rawValue !== undefined && (
                  <code style={{ fontSize: 10, color: "#969696", wordBreak: "break-all" }}>
                    {String(JSON.stringify(node.data.rawValue) ?? "").slice(0, 120)}
                  </code>
                )}
              </div>
            )}
            animate
          />
        </div>
      )}
    </div>
  );
}
