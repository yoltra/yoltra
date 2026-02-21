import { clamp } from ".";
import type { Circle } from "./engine/Circle";

export type QuadTreeOptions = {
  capacity?: number; // max items per node before subdivision
  maxDepth?: number; // max subdivision depth
};

type Rect = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type IdIndex = {
  node: QuadNode;
  index: number;
};

class QuadNode {
  bounds: Rect;
  depth: number;
  items: Circle[] = [];
  children: QuadNode[] | null = null;

  constructor(bounds: Rect, depth: number) {
    this.bounds = bounds;
    this.depth = depth;
  }
}

/**
 * QuadTree for circle-like items (Circle).
 * 
 * - Inserts items by their *circle bounding box*.
 * - If a circle doesn't fit fully in a child quadrant, it stays in the current node.
 * - queryCircle(x,y,r) returns items whose circles intersect the query circle (distance <= r + 16) */
export class QuadTree {
  private readonly capacity: number;
  private readonly maxDepth: number;
  private root: QuadNode;
  private idIndex = new Map<string, IdIndex>();
  private _size = 0;

  /**
   * eps used for robust inequalities at boundaries */
  private static readonly EPS = 1e-9;

  /**
   * Root bounds of the tree (top-left x,y with width,height)
   * all items' bounding boxes must fit inside these bounds */
  constructor(
    bounds: { x: number; y: number; width: number; height: number },
    options: QuadTreeOptions = {}
  ) {
    const { x, y, width, height } = bounds;
    if (width <= 0 || height <= 0) {
      throw new Error("QuadTree root bounds must have positive width and height.");
    }
    this.capacity = options.capacity ?? 8;
    this.maxDepth = options.maxDepth ?? 10;
    this.root = new QuadNode(
      { minX: x, minY: y, maxX: x + width, maxY: y + height },
      0
    );
  }

  /**
   * Number of items currently in the tree */
  get size(): number {
    return this._size;
  }

  /**
   * Remove all items and reset to a single root node */
  clear(): void {
    this.root = new QuadNode(this.root.bounds, 0);
    this.idIndex.clear();
    this._size = 0;
  }

  /**
   * Insert an item.
   * 
   * Returns true if inserted; false if item is out of bounds or id already exists */
  insert(item: Circle): boolean {
    if (this.idIndex.has(item.id)) return false;
    const bbox = this.circleAABB(item.x, item.y, 16);
    if (!this.rectContainsRect(this.root.bounds, bbox)) return false;

    const inserted = this.insertIntoNode(this.root, item, bbox);
    if (inserted) {
      this._size++;
    }
    return inserted;
  }

  /**
   * Update an existing item by id.
   * 
   * If the id doesn't exist, this falls back to insert
   * Implementation: remove + re-insert (robust and keeps tree valid) */
  update(next: Circle): boolean {
    if (!this.idIndex.has(next.id)) {
      return this.insert(next);
    }
    
    // here we choose: if insert fails, the item is considered removed (caller can handle bounds)
    const removed = this.remove(next.id);
    if (!removed) return false;
    return this.insert(next);
  }

  /**
   * Remove an item by id.
   * 
   * Returns true if found and removed, false otherwise */
  remove(id: string): boolean {
    const loc = this.idIndex.get(id);
    if (!loc) return false;

    const { node, index } = loc;
    const lastIdx = node.items.length - 1;
    if (index !== lastIdx) {

      // swap with last
      const moved = node.items[lastIdx];
      node.items[index] = moved;
      this.idIndex.set(moved.id, { node, index });
    }

    node.items.pop();
    this.idIndex.delete(id);
    this._size--;

    // prune children when underflow. generaly not necessary; keeps things simpler...
    return true;
  }

  /**
   * Query all items whose *circles* intersect the circle centered at (x,y) with radius r.
   * Typical use: neighbors for a circle that *wants to grow* to rNew.
   *
   * Options:
   *  - excludeId: skip this id (e.g., querying neighbors for the same item)
   *  - maxResults: cap results for performance (early exit) */
  queryCircle(
    x: number,
    y: number,
    r: number,
    opts: { excludeId?: string; maxResults?: number } = {}
  ): Circle[] {
    const results: Circle[] = [];
    this.queryCircleRecursive(this.root, x, y, r, results, opts);
    return results;
  }

  private insertIntoNode(node: QuadNode, item: Circle, bbox: Rect): boolean {
    if (node.children) {
      const idx = this.childIndexFor(node, bbox);
      if (idx !== -1) {
        return this.insertIntoNode(node.children[idx], item, bbox);
      }
    }

    // put in this node
    const index = node.items.length;
    node.items.push(item);
    this.idIndex.set(item.id, { node, index });

    // subdivide if needed
    if (node.items.length > this.capacity && node.depth < this.maxDepth) {
      if (!node.children) this.subdivide(node);
      // re-distribute items that fit inside children
      this.redistribute(node);
    }

    return true;
  }

  private subdivide(node: QuadNode): void {
    const { minX, minY, maxX, maxY } = node.bounds;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const d = node.depth + 1;

    // order: 0=NW, 1=NE, 2=SW, 3=SE
    node.children = [
      new QuadNode({ minX, minY, maxX: midX, maxY: midY }, d), // NW
      new QuadNode({ minX: midX, minY, maxX, maxY: midY }, d), // NE
      new QuadNode({ minX, minY: midY, maxX: midX, maxY }, d), // SW
      new QuadNode({ minX: midX, minY: midY, maxX, maxY }, d), // SE
    ];
  }

  private redistribute(node: QuadNode): void {
    if (!node.children) return;

    const old = node.items;
    node.items = []; // rebuild; will reset idIndex for items that stay

    for (let i = 0; i < old.length; i++) {
      const it = old[i];
      // @ts-expect-error
      const bbox = this.circleAABB(it.x, it.y, it.r);
      const idx = this.childIndexFor(node, bbox);

      if (idx !== -1) {
        // move to child
        const child = node.children[idx];
        const index = child.items.length;

        child.items.push(it);
        this.idIndex.set(it.id, { node: child, index });
      } else {
        // keep here
        const index = node.items.length;

        node.items.push(it);
        this.idIndex.set(it.id, { node, index });
      }
    }
  }

  private childIndexFor(parent: QuadNode, bbox: Rect): number {
    if (!parent.children) return -1;

    const { minX, minY, maxX, maxY } = parent.bounds;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    // strict containment in a single quadrant; if it touches mid lines, keep in parent
    const inLeft = bbox.maxX <= midX - QuadTree.EPS;
    const inRight = bbox.minX >= midX + QuadTree.EPS;
    const inTop = bbox.maxY <= midY - QuadTree.EPS;
    const inBottom = bbox.minY >= midY + QuadTree.EPS;

    if (inLeft) {
      if (inTop) return 0; // NW
      if (inBottom) return 2; // SW
    } else if (inRight) {
      if (inTop) return 1; // NE
      if (inBottom) return 3; // SE
    }
    return -1;
  }

  private queryCircleRecursive(
    node: QuadNode,
    cx: number,
    cy: number,
    r: number,
    results: Circle[],
    opts: { excludeId?: string; maxResults?: number }
  ): void {
    if (!this.rectIntersectsCircle(node.bounds, cx, cy, r)) return;

    // check items at this node
    for (let i = 0; i < node.items.length; i++) {
      const it = node.items[i];
      if (opts.excludeId && it.id === opts.excludeId) continue;
      if (this.circlesIntersect(cx, cy, r, it.x, it.y, 16)) {
        results.push(it);
        if (opts.maxResults && results.length >= opts.maxResults) return;
      }
    }

    // recurse
    if (node.children) {
      // early exit if maxResults reached along the way
      this.queryCircleRecursive(node.children[0], cx, cy, r, results, opts);
      if (opts.maxResults && results.length >= opts.maxResults) return;

      this.queryCircleRecursive(node.children[1], cx, cy, r, results, opts);
      if (opts.maxResults && results.length >= opts.maxResults) return;

      this.queryCircleRecursive(node.children[2], cx, cy, r, results, opts);
      if (opts.maxResults && results.length >= opts.maxResults) return;

      this.queryCircleRecursive(node.children[3], cx, cy, r, results, opts);
    }
  }

  private circleAABB(x: number, y: number, r: number): Rect {
    return { minX: x - r, minY: y - r, maxX: x + r, maxY: y + r };
  }

  private rectContainsRect(outer: Rect, inner: Rect): boolean {
    return (
      inner.minX >= outer.minX &&
      inner.maxX <= outer.maxX &&
      inner.minY >= outer.minY &&
      inner.maxY <= outer.maxY
    );
  }

  private rectIntersectsCircle(rect: Rect, cx: number, cy: number, r: number): boolean {
    // clamp circle center to rect, then compare distance
    const clampedX = clamp(cx, rect.minX, rect.maxX);
    const clampedY = clamp(cy, rect.minY, rect.maxY);
    const dx = cx - clampedX;
    const dy = cy - clampedY;

    return dx * dx + dy * dy <= r * r;
  }

  private circlesIntersect(ax: number, ay: number, ar: number, bx: number, by: number, br: number): boolean {
    const dx = ax - bx;
    const dy = ay - by;
    const rr = ar + br;
    
    return dx * dx + dy * dy <= rr * rr;
  }
}
