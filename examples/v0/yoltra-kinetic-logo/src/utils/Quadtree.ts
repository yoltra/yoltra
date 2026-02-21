import { clamp } from ".";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Rect = { minX: number; minY: number; maxX: number; maxY: number };

/** Minimal interface the QuadTree requires from its items. */
export interface PointItem {
  readonly id: string;
  x: number;
  y: number;
}

export type QuadTreeOptions = {
  /** Max items per node before subdivision. Default 8. */
  capacity?: number;
  /** Max subdivision depth. Default 10. */
  maxDepth?: number;
};

// ---------------------------------------------------------------------------
// Internal node
// ---------------------------------------------------------------------------

class QuadNode<T extends PointItem> {
  bounds: Rect;
  depth: number;
  items: T[] = [];
  children: QuadNode<T>[] | null = null;

  constructor(bounds: Rect, depth: number) {
    this.bounds = bounds;
    this.depth = depth;
  }
}

// ---------------------------------------------------------------------------
// QuadTree
// ---------------------------------------------------------------------------

/**
 * Generic QuadTree for point-like items.
 *
 * - Insert / remove / update by id in O(log N) amortised.
 * - `queryCircle(x, y, r)` returns items whose circles intersect (cx, cy, r). */
export class QuadTree<T extends PointItem> {
  private readonly capacity: number;
  private readonly maxDepth: number;
  private root: QuadNode<T>;
  private idIndex = new Map<string, { node: QuadNode<T>; index: number }>();
  private _size = 0;

  private static readonly EPS = 1e-9;

  constructor(
    bounds: { x: number; y: number; width: number; height: number },
    options: QuadTreeOptions = {}
  ) {
    const { x, y, width, height } = bounds;
    if (width <= 0 || height <= 0) throw new Error("QuadTree bounds must have positive width and height.");
    this.capacity = options.capacity ?? 8;
    this.maxDepth = options.maxDepth ?? 10;
    this.root = new QuadNode<T>(
      { minX: x, minY: y, maxX: x + width, maxY: y + height },
      0
    );
  }

  get size(): number { return this._size; }

  clear(): void {
    this.root = new QuadNode<T>(this.root.bounds, 0);
    this.idIndex.clear();
    this._size = 0;
  }

  insert(item: T): boolean {
    if (this.idIndex.has(item.id)) return false;
    const bbox = this.aabb(item.x, item.y, 16);
    if (!this.contains(this.root.bounds, bbox)) return false;
    const ok = this.insertIntoNode(this.root, item, bbox);
    if (ok) this._size++;
    return ok;
  }

  remove(id: string): boolean {
    const loc = this.idIndex.get(id);
    if (!loc) return false;
    const { node, index } = loc;
    const last = node.items.length - 1;
    if (index !== last) {
      const moved = node.items[last];
      node.items[index] = moved;
      this.idIndex.set(moved.id, { node, index });
    }
    node.items.pop();
    this.idIndex.delete(id);
    this._size--;
    return true;
  }

  update(item: T): boolean {
    if (!this.idIndex.has(item.id)) return this.insert(item);
    this.remove(item.id);
    return this.insert(item);
  }

  queryCircle(
    cx: number,
    cy: number,
    r: number,
    opts: { excludeId?: string; maxResults?: number } = {}
  ): T[] {
    const results: T[] = [];
    this.queryRecursive(this.root, cx, cy, r, results, opts);
    return results;
  }

  // ── private ──────────────────────────────────────────────────────────────

  private insertIntoNode(node: QuadNode<T>, item: T, bbox: Rect): boolean {
    if (node.children) {
      const idx = this.childIndex(node, bbox);
      if (idx !== -1) return this.insertIntoNode(node.children[idx], item, bbox);
    }
    const index = node.items.length;
    node.items.push(item);
    this.idIndex.set(item.id, { node, index });
    if (node.items.length > this.capacity && node.depth < this.maxDepth) {
      if (!node.children) this.subdivide(node);
      this.redistribute(node);
    }
    return true;
  }

  private subdivide(node: QuadNode<T>): void {
    const { minX, minY, maxX, maxY } = node.bounds;
    const mx = (minX + maxX) / 2;
    const my = (minY + maxY) / 2;
    const d = node.depth + 1;
    node.children = [
      new QuadNode<T>({ minX, minY, maxX: mx, maxY: my }, d),       // NW
      new QuadNode<T>({ minX: mx, minY, maxX, maxY: my }, d),       // NE
      new QuadNode<T>({ minX, minY: my, maxX: mx, maxY }, d),       // SW
      new QuadNode<T>({ minX: mx, minY: my, maxX, maxY }, d),       // SE
    ];
  }

  private redistribute(node: QuadNode<T>): void {
    if (!node.children) return;
    const old = node.items;
    node.items = [];
    for (const it of old) {
      const bbox = this.aabb(it.x, it.y, 16);
      const idx = this.childIndex(node, bbox);
      if (idx !== -1) {
        const child = node.children[idx];
        const index = child.items.length;
        child.items.push(it);
        this.idIndex.set(it.id, { node: child, index });
      } else {
        const index = node.items.length;
        node.items.push(it);
        this.idIndex.set(it.id, { node, index });
      }
    }
  }

  private childIndex(parent: QuadNode<T>, bbox: Rect): number {
    if (!parent.children) return -1;
    const { minX, minY, maxX, maxY } = parent.bounds;
    const mx = (minX + maxX) / 2;
    const my = (minY + maxY) / 2;
    const inLeft = bbox.maxX <= mx - QuadTree.EPS;
    const inRight = bbox.minX >= mx + QuadTree.EPS;
    const inTop = bbox.maxY <= my - QuadTree.EPS;
    const inBottom = bbox.minY >= my + QuadTree.EPS;
    if (inLeft) { if (inTop) return 0; if (inBottom) return 2; }
    else if (inRight) { if (inTop) return 1; if (inBottom) return 3; }
    return -1;
  }

  private queryRecursive(
    node: QuadNode<T>,
    cx: number,
    cy: number,
    r: number,
    results: T[],
    opts: { excludeId?: string; maxResults?: number }
  ): void {
    if (!this.rectIntersectsCircle(node.bounds, cx, cy, r)) return;
    for (const it of node.items) {
      if (opts.excludeId && it.id === opts.excludeId) continue;
      if (this.circlesIntersect(cx, cy, r, it.x, it.y, 16)) {
        results.push(it);
        if (opts.maxResults && results.length >= opts.maxResults) return;
      }
    }
    if (node.children) {
      for (const child of node.children) {
        this.queryRecursive(child, cx, cy, r, results, opts);
        if (opts.maxResults && results.length >= opts.maxResults) return;
      }
    }
  }

  private aabb(x: number, y: number, r: number): Rect {
    return { minX: x - r, minY: y - r, maxX: x + r, maxY: y + r };
  }

  private contains(outer: Rect, inner: Rect): boolean {
    return inner.minX >= outer.minX && inner.maxX <= outer.maxX
      && inner.minY >= outer.minY && inner.maxY <= outer.maxY;
  }

  private rectIntersectsCircle(rect: Rect, cx: number, cy: number, r: number): boolean {
    const nx = clamp(cx, rect.minX, rect.maxX) - cx;
    const ny = clamp(cy, rect.minY, rect.maxY) - cy;
    return nx * nx + ny * ny <= r * r;
  }

  private circlesIntersect(ax: number, ay: number, ar: number, bx: number, by: number, br: number): boolean {
    const dx = ax - bx;
    const dy = ay - by;
    const rr = ar + br;
    return dx * dx + dy * dy <= rr * rr;
  }
}
