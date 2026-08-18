/**
 * @module @yoltra/core
 */

/**
 * A bounded hand-off queue between one producer and one consumer, where **the producer waits**.
 *
 * @remarks
 * This is what makes {@link StoreInstance.call}'s backpressure real rather than decorative. A
 * plain buffer accepts everything and grows; this one hands the producer a promise that does not
 * resolve until the consumer has taken an item. Because the store awaits effects, and `emit`
 * resolves only once its effects have finished, a producer writing
 *
 * ```ts
 * await emit("rpc", "progress", chunk);
 * ```
 *
 * genuinely blocks until the consumer catches up — end to end, through machinery that already
 * existed, with nothing polling and nothing dropped.
 *
 * **Backpressure only engages once the consumer has begun iterating.** Before that, items buffer
 * up to `highWaterMark` and further ones are counted and discarded. That asymmetry is deliberate:
 * a caller that only awaits the terminal reply never pulls, so blocking the producer would
 * deadlock the very call it is feeding — the producer would be waiting to deliver progress
 * nobody will read, and would therefore never emit the terminal event that ends the wait.
 *
 * @internal
 */
export class CallQueue<T> {
  private readonly buffer: T[] = [];

  /** Consumers parked in `take`, oldest first. */
  private readonly takers: Array<(value: IteratorResult<T>) => void> = [];

  /** Producers parked in `put`, each with the item they are waiting to hand over. */
  private readonly putters: Array<{ item: T; release: () => void }> = [];

  private consuming = false;

  /** No more items will be accepted, but what is already here is still owed to the consumer. */
  private ended = false;

  /** Abandoned: nothing further is owed to anybody. */
  private closed = false;

  /** Items discarded because nobody was iterating and the buffer was full. */
  private dropped = 0;

  constructor(private readonly highWaterMark: number) {}

  /** How many items were discarded for want of a consumer. */
  get droppedCount(): number {
    return this.dropped;
  }

  /**
   * Marks that a consumer has started pulling. From here on, a full buffer parks the producer
   * rather than dropping.
   */
  beginConsuming(): void {
    this.consuming = true;
  }

  /**
   * Offers an item. The returned promise settles when the item has been taken — or immediately,
   * if it fit in the buffer or was dropped.
   */
  put(item: T): Promise<void> {
    if (this.closed || this.ended) return Promise.resolve();

    // A parked consumer takes it directly; no buffering, no waiting either way.
    const taker = this.takers.shift();
    if (taker !== undefined) {
      taker({ value: item, done: false });
      return Promise.resolve();
    }

    if (this.buffer.length < this.highWaterMark) {
      this.buffer.push(item);
      return Promise.resolve();
    }

    if (!this.consuming) {
      // Nobody is reading and nobody has said they will. Dropping is the only option that does
      // not deadlock the producer — see the note on this class.
      this.dropped++;
      return Promise.resolve();
    }

    return new Promise<void>((release) => {
      this.putters.push({ item, release });
    });
  }

  /** Takes the next item, waiting if none is available. Resolves `done` once closed and drained. */
  take(): Promise<IteratorResult<T>> {
    this.consuming = true;

    const buffered = this.buffer.shift();
    if (buffered !== undefined) {
      // A parked producer can now hand its item to the space just freed.
      const putter = this.putters.shift();
      if (putter !== undefined) {
        this.buffer.push(putter.item);
        putter.release();
      }
      return Promise.resolve({ value: buffered, done: false });
    }

    // Nothing buffered, but a producer is parked: take directly from it.
    const putter = this.putters.shift();
    if (putter !== undefined) {
      putter.release();
      return Promise.resolve({ value: putter.item, done: false });
    }

    // Nothing left to hand over. `ended` counts here as well as `closed`: the terminal reply has
    // arrived and the buffer is drained, so the stream is genuinely over.
    if (this.closed || this.ended) return Promise.resolve({ value: undefined, done: true });

    return new Promise<IteratorResult<T>>((taker) => {
      this.takers.push(taker);
    });
  }

  /**
   * Stops accepting items, but keeps owing the consumer everything already queued.
   *
   * @remarks
   * What the terminal reply does. Closing outright at that moment would throw away progress the
   * responder had already handed over and the consumer had not yet read — which is exactly what
   * happened before this existed: a six-step job delivered five steps, because the sixth was in
   * the buffer when `done` arrived and the buffer was cleared. The terminal event says "no more
   * is coming", not "forget what you were given".
   */
  end(): void {
    if (this.ended || this.closed) return;
    this.ended = true;

    // Anything a producer is still parked with was sent before the terminal, so it is owed.
    let putter = this.putters.shift();
    while (putter !== undefined) {
      this.buffer.push(putter.item);
      putter.release();
      putter = this.putters.shift();
    }

    // Hand the buffer to anyone already waiting, then tell the rest we are done.
    let taker = this.takers.shift();
    while (taker !== undefined) {
      const next = this.buffer.shift();
      taker(
        next !== undefined
          ? { value: next, done: false }
          : { value: undefined, done: true },
      );
      taker = this.takers.shift();
    }
  }

  /**
   * Closes the queue: waiting consumers are told `done`, and **every parked producer is
   * released**.
   *
   * @remarks
   * Releasing producers is not tidying up. A producer parked on `put` is a pending `await emit`
   * somewhere; leaving it parked when the call has already settled would hang the responder for
   * good — turning a timed-out call into a wedged process, which is worse than the problem
   * backpressure was added to solve.
   */
  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.buffer.length = 0;

    let taker = this.takers.shift();
    while (taker !== undefined) {
      taker({ value: undefined, done: true });
      taker = this.takers.shift();
    }

    let putter = this.putters.shift();
    while (putter !== undefined) {
      putter.release();
      putter = this.putters.shift();
    }
  }
}
