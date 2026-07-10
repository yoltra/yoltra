/**
 * Fixed-size circular buffer for bounded event retention.
 *
 * @module @yoltra/devtools-server
 */

/**
 * Fixed-size circular buffer that overwrites the oldest entry on overflow.
 *
 * @typeParam T - Item type stored in the buffer.
 *
 * @remarks
 * Used by the hub to retain event history for late-connecting extensions.
 * The buffer pre-allocates an array of the given capacity and uses modular
 * arithmetic to track insertion position, making {@link push} an O(1)
 * operation with no memory allocation after construction.
 *
 * @public
 */
export class RingBuffer<T> {
  private readonly items: Array<T | undefined>;
  private head = 0;
  private count = 0;

  /**
   * @param capacity - Maximum number of items. Must be at least 1.
   */
  constructor(public readonly capacity: number) {
    if (capacity < 1) throw new Error("RingBuffer capacity must be >= 1");
    this.items = new Array(capacity);
  }

  /**
   * Push an item. Overwrites the oldest if at capacity.
   *
   * @param item - Item to add.
   *
   * @public
   */
  push(item: T): void {
    this.items[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  /**
   * Returns all items in insertion order (oldest first).
   *
   * @returns A new array containing buffered items from oldest to newest.
   *
   * @public
   */
  toArray(): T[] {
    if (this.count === 0) return [];
    const result: T[] = [];
    const start = this.count < this.capacity ? 0 : this.head;
    for (let i = 0; i < this.count; i++) {
      result.push(this.items[(start + i) % this.capacity] as T);
    }
    return result;
  }

  /**
   * Current number of items stored in the buffer.
   *
   * @returns A value between `0` and {@link capacity} inclusive.
   *
   * @public
   */
  get size(): number {
    return this.count;
  }

  /**
   * Remove all items.
   *
   * @public
   */
  clear(): void {
    this.items.fill(undefined);
    this.head = 0;
    this.count = 0;
  }
}
