/**
 * @module @yoltra/core
 */

/**
 * Flexible, synchronous pub/sub bus that supports **exact** and **pattern** event subscriptions.
 *
 * @typeParam C - Channel name type (defaults to `string`).
 * @typeParam T - Event type name type (defaults to `string`). Types are treated as **dot-separated paths** (e.g. `"a.b.c"`).
 * @typeParam P - Payload type for all events (defaults to `any`).
 *
 * @remarks
 * - **Exact handlers** subscribe to a specific `(channel, type)` pair. Type keys are **normalized** by stripping a single leading dot (`".foo"` → `"foo"`).
 * - **Pattern handlers** subscribe using wildcards over dot-separated segments:
 *   - `*`   matches **one** segment.
 *   - `**`  matches **zero or more** segments (greedy).
 * - On {@link LooseEventBus.emit | `emit`}, exact handlers fire first, then any matching pattern handlers.
 * - Handlers are **de-duplicated**: if the same function is both exact and pattern-registered, it is called **once**.
 * - Handler invocation is **synchronous**. Exceptions are caught and logged; remaining handlers still run.
 *
 * @example
 * ```ts
 * type C = 'ui' | 'data';
 * type T = string;
 * type P = unknown;
 *
 * const bus = new LooseEventBus<C, T, P>();
 *
 * // Exact
 * const offA = bus.on('ui', 'panel.open', () => console.log('panel opened'));
 *
 * // Patterns
 * const offB = bus.on('ui', 'panel.*', () => console.log('any single sub-event under panel'));
 * const offC = bus.on('ui', 'panel.**', () => console.log('any depth under panel'));
 *
 * bus.emit('ui', 'panel.open', null);
 * // => exact fires, then 'panel.*', then 'panel.**'
 *
 * offA(); offB(); offC(); // unsubscribe
 * ```
 *
 * @public
 */
/**
 * One registered pattern, kept pre-split.
 * @internal
 */
interface PatternEntry {
  readonly pattern: string;
  readonly segments: readonly string[];
}

/**
 * The patterns on one channel, arranged by what a subject's first segment can match.
 * @internal
 */
interface PatternIndex {
  /** Keyed by a literal first segment. */
  readonly byHead: Map<string, PatternEntry[]>;
  /** Patterns beginning with `*` or `**`, which every subject has to test. */
  readonly anyHead: PatternEntry[];
}

export class LooseEventBus<C extends string = string, T extends string = string, P = any> {
  /**
   * Exact handlers: `channel → type → [handlers]`.
   * @internal
   */
  private handlers = new Map<C, Map<T, Array<(p: P) => void>>>();

  /**
   * Pattern handlers with `*` and `**`: `channel → pattern(string) → [handlers]`.
   * @internal
   */
  private patternHandlers = new Map<C, Map<string, Array<(p: P) => void>>>();

  /**
   * Patterns bucketed by their first segment, so an emit tests only what could match.
   *
   * @remarks
   * Delivery used to walk every pattern registered on the channel and run the full segment
   * matcher against each. That is linear in the number of patterns rather than in the number
   * that match, and it re-split both the pattern and the subject on every test — for a thousand
   * patterns, two thousand string splits to deliver one event.
   *
   * A subject's first segment can only be matched by a pattern whose first segment is that same
   * literal, or is `*` or `**`. Bucketing on that turns the common shape — distinct event
   * families like `panel.*` and `order.**` — from a scan of everything into a map lookup plus
   * the handful that begin with a wildcard.
   *
   * It buys nothing for a channel where every pattern starts with `**`, since all of those must
   * still be tested. That is the honest worst case, and it is unchanged rather than worsened.
   */
  private patternIndex = new Map<C, PatternIndex>();

  /**
   * Subscribes a handler to either an **exact** type or a **pattern**.
   *
   * @param channel - Channel to subscribe on.
   * @param type - Exact event type (e.g. `"a.b"`) or pattern (contains `*`/`**`).
   * @param handler - Function invoked with the emitted payload.
   * @returns An **unsubscribe** function that removes this handler.
   *
   * @remarks
   * - Exact subscriptions are stored under a **normalized** key (leading `.` removed).
   * - Pattern subscriptions are stored **as provided**; matching normalizes the subject.
   *
   * @example Exact subscription
   * ```ts
   * const off = bus.on('data', 'items.loaded', ({ count }) => {
   *   console.log('Loaded', count);
   * });
   * // Later
   * off();
   * ```
   *
   * @example Pattern subscription
   * ```ts
   * // Match any single sub-event: 'panel.open', 'panel.close', etc.
   * const offStar = bus.on('ui', 'panel.*', () => {});
   *
   * // Match any depth: 'panel.open', 'panel.items.add', 'panel', etc.
   * const offGlob = bus.on('ui', 'panel.**', () => {});
   * ```
   *
   * @public
   */
  on(channel: C, type: T, handler: (payload: P) => void): () => void {
    const typeStr = String(type);
    if (!this.isPattern(typeStr)) {
      // Exact subscription with normalized key (strip leading dot)
      const key = this.normalizeTypeKey(typeStr) as T;

      if (!this.handlers.has(channel)) this.handlers.set(channel, new Map());
      const map = this.handlers.get(channel)!;

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(handler);

      // capture normalized key for off()
      return () => this.offExactNormalized(channel, key, handler);
    } else {
      // Pattern subscription (stored as provided; matcher handles normalization)
      const pattern = typeStr;

      if (!this.patternHandlers.has(channel)) this.patternHandlers.set(channel, new Map());
      const pmap = this.patternHandlers.get(channel)!;

      if (!pmap.has(pattern)) {
        pmap.set(pattern, []);
        // Split once here rather than on every emit, and file it under the segment that decides
        // whether it is even a candidate.
        this.indexPattern(channel, pattern);
      }
      pmap.get(pattern)!.push(handler);

      return () => this.offPattern(channel, pattern, handler);
    }
  }

  /**
   * Unsubscribes an **exact** handler. The `type` key is normalized internally,
   * so callers can pass `"foo"` or `".foo"` interchangeably.
   *
   * @param channel - Channel name.
   * @param type - Exact event type key to remove (normalization applied).
   * @param handler - The same handler reference previously passed to {@link LooseEventBus.on | `on`}.
   *
   * @example
   * ```ts
   * const h = () => {};
   * bus.on('ui', 'panel.open', h);
   * // Remove it (with or without leading dot)
   * bus.off('ui', '.panel.open', h);
   * ```
   *
   * @public
   */
  off(channel: C, type: T, handler: (payload: P) => void): void {
    const key = this.normalizeTypeKey(String(type)) as T;
    this.offExactNormalized(channel, key, handler);
  }

  /**
   * Internal exact unsubscription using an already **normalized** type key.
   *
   * @param channel - Channel name.
   * @param normalizedType - Event type key with leading dot removed.
   * @param handler - Handler to remove.
   * @internal
   */
  private offExactNormalized(
    channel: C,
    normalizedType: T,
    handler: (payload: P) => void,
  ): void {
    const cMap = this.handlers.get(channel);
    if (!cMap) return;
    const list = cMap.get(normalizedType);
    if (!list) return;

    const i = list.indexOf(handler);
    if (i !== -1) list.splice(i, 1);

    // cleanup empties
    if (list.length === 0) cMap.delete(normalizedType);
    if (cMap.size === 0) this.handlers.delete(channel);
  }

  /**
   * Internal removal for a **pattern** subscription. No-ops if missing.
   *
   * @param channel - Channel name.
   * @param pattern - Pattern string as originally subscribed.
   * @param handler - Handler to remove.
   * @internal
   */
  private offPattern(channel: C, pattern: string, handler: (payload: P) => void): void {
    const pMap = this.patternHandlers.get(channel);
    if (!pMap) return;

    const list = pMap.get(pattern);
    if (!list) return;

    const i = list.indexOf(handler);
    if (i !== -1) list.splice(i, 1);

    // cleanup empties
    if (list.length === 0) {
      pMap.delete(pattern);
      this.unindexPattern(channel, pattern);
    }
    if (pMap.size === 0) {
      this.patternHandlers.delete(channel);
      this.patternIndex.delete(channel);
    }
  }

  /**
   * Emits an event to all exact subscribers first, then to **matching pattern** subscribers.
   * Duplicate handler references are called **once** (de-duped).
   *
   * @param channel - Channel to emit on.
   * @param type - Event type (subject). A leading dot is ignored for matching.
   * @param payload - Payload delivered to handlers.
   *
   * @example
   * ```ts
   * // Suppose:
   * //  - on('ui', 'panel.open', h)
   * //  - on('ui', 'panel.*', h)       // same handler ref!
   * //  - on('ui', 'panel.**', other)
   * bus.emit('ui', 'panel.open', { id: 1 });
   * // => 'h' runs once (de-duped), then 'other'
   * ```
   *
   * @public
   */
  emit(channel: C, type: T, payload: P): void {
    const typeStr = String(type);
    const normalizedType = this.normalizeTypeKey(typeStr) as T;

    // Exact delivery (normalized)
    const exactList = this.handlers.get(channel)?.get(normalizedType) ?? [];

    // Pattern delivery (normalize subject before matching)
    const patternLists = this.matchingPatternHandlers(channel, typeStr);

    const called = new Set<(p: P) => void>();
    const deliver = (arr: Array<(p: P) => void>) => {
      for (const h of [...arr]) {
        if (called.has(h)) continue;

        called.add(h);

        try {
          h(payload);
        } catch (exc) {
          console.error(exc);
          continue;
        }
      }
    };

    deliver(exactList);
    for (const list of patternLists) deliver(list);
  }

  /**
   * Emits a payload that is only built if somebody is listening.
   *
   * @param channel - Channel to emit on.
   * @param type - Concrete event type.
   * @param make - Builds the payload. Called at most once, and only when a handler matched.
   *
   * @remarks
   * Same matching as {@link LooseEventBus.emit}; the difference is *when* the payload exists.
   * The store's change notification carries the old and new value at a path, and reading those
   * means walking the state tree twice per path. Doing that eagerly meant a slice nobody had
   * subscribed to paid the full cost of describing changes to an audience of nobody — the
   * matching work was already being done to discover there were no handlers.
   *
   * @public
   */
  emitWith(channel: C, type: T, make: () => P): void {
    const typeStr = String(type);
    const normalizedType = this.normalizeTypeKey(typeStr) as T;

    const exactList = this.handlers.get(channel)?.get(normalizedType) ?? [];

    const patternLists = this.matchingPatternHandlers(channel, typeStr);

    if (exactList.length === 0 && patternLists.length === 0) return;

    // Exactly one construction, shared by every handler — the same guarantee `emit` gives.
    const payload = make();

    const called = new Set<(p: P) => void>();
    const deliver = (arr: Array<(p: P) => void>) => {
      for (const h of [...arr]) {
        if (called.has(h)) continue;
        called.add(h);
        try {
          h(payload);
        } catch (exc) {
          console.error(exc);
          continue;
        }
      }
    };

    deliver(exactList);
    for (const list of patternLists) deliver(list);
  }

  /**
   * Determines if a string is a **pattern** (contains `*`).
   * @param s - Event type or pattern string.
   * @returns `true` if it contains at least one `*`, else `false`.
   * @internal
   */
  private isPattern(s: string): boolean {
    return s.includes("*");
  }

  /**
   * Normalizes event type keys for exact matching by stripping a **single** leading dot.
   *
   * @param s - Event type key.
   * @returns Normalized key without a leading dot.
   * @example
   * ```ts
   * normalizeTypeKey('.a.b') // 'a.b'
   * normalizeTypeKey('a.b')  // 'a.b'
   * ```
   * @internal
   */
  private normalizeTypeKey(s: string): string {
    return s.replace(/^\./, "");
  }

  /**
   * Splits a path into dot-separated segments after normalization and removes empties.
   * @param p - Event type or pattern string.
   * @internal
   */
  private splitPath(p: string): string[] {
    return this.normalizeTypeKey(p).split(".").filter(Boolean);
  }

  /**
   * Files a pattern under the first segment that could select it.
   * @internal
   */
  private indexPattern(channel: C, pattern: string): void {
    let index = this.patternIndex.get(channel);
    if (index === undefined) {
      index = { byHead: new Map(), anyHead: [] };
      this.patternIndex.set(channel, index);
    }
    const segments = this.splitPath(pattern);
    const entry: PatternEntry = { pattern, segments };
    const head = segments[0];
    // A pattern with no segments at all, or one starting with a wildcard, cannot be narrowed by
    // the subject's first segment — so it goes in the list every emit walks.
    if (head === undefined || head === "*" || head === "**") {
      index.anyHead.push(entry);
      return;
    }
    const bucket = index.byHead.get(head);
    if (bucket === undefined) index.byHead.set(head, [entry]);
    else bucket.push(entry);
  }

  /**
   * Removes a pattern from the index. Paired with {@link LooseEventBus.offPattern}.
   * @internal
   */
  private unindexPattern(channel: C, pattern: string): void {
    const index = this.patternIndex.get(channel);
    if (index === undefined) return;
    const head = this.splitPath(pattern)[0];
    const bucket =
      head === undefined || head === "*" || head === "**"
        ? index.anyHead
        : index.byHead.get(head);
    if (bucket === undefined) return;
    const at = bucket.findIndex((e) => e.pattern === pattern);
    if (at !== -1) bucket.splice(at, 1);
    if (bucket.length === 0 && bucket !== index.anyHead && head !== undefined) {
      index.byHead.delete(head);
    }
  }

  /**
   * The handler lists of every pattern matching this subject.
   *
   * @remarks
   * Shared by `emit` and `emitWith` so the two cannot drift on what "matching" means — which
   * they could, being two copies of the same walk before.
   *
   * The subject is split once here rather than once per pattern tested.
   *
   * @internal
   */
  private matchingPatternHandlers(channel: C, typeStr: string): Array<Array<(p: P) => void>> {
    const patternMap = this.patternHandlers.get(channel);
    const index = this.patternIndex.get(channel);
    if (patternMap === undefined || patternMap.size === 0 || index === undefined) return [];

    const subject = this.splitPath(typeStr);
    const lists: Array<Array<(p: P) => void>> = [];

    const test = (entries: readonly PatternEntry[]): void => {
      for (const entry of entries) {
        if (!this.matchSegments(entry.segments, subject)) continue;
        const handlers = patternMap.get(entry.pattern);
        if (handlers !== undefined) lists.push(handlers);
      }
    };

    const head = subject[0];
    if (head !== undefined) {
      const bucket = index.byHead.get(head);
      if (bucket !== undefined) test(bucket);
    }
    test(index.anyHead);

    return lists;
  }

  /**
   * Pattern matcher over dot-separated segments, which arrive already split.
   *
   * Rules:
   * - **literal**: exact match.
   * - `*`   : matches exactly **one** segment.
   * - `**`  : matches **zero or more** remaining segments (including empty).
   *
   * @remarks
   * Takes segments rather than strings so delivery can split each pattern once at registration
   * and the subject once per emit, instead of both once per test. Re-splitting per test was most
   * of what made wildcard delivery expensive: a thousand patterns meant two thousand string
   * splits to deliver one event.
   *
   * @param pSegs - Pattern segments (may include `*`/`**`).
   * @param sSegs - Subject segments to test.
   * @returns `true` if the pattern matches; otherwise `false`.
   *
   * @example
   * ```ts
   * matchSegments(['a', '*'], ['a', 'b'])           // true
   * matchSegments(['a', '*'], ['a', 'b', 'c'])      // false
   * matchSegments(['a', '**'], ['a'])               // true
   * matchSegments(['**', 'end'], ['x', 'y', 'end']) // true
   * ```
   *
   * @internal
   */
  private matchSegments(pSegs: readonly string[], sSegs: readonly string[]): boolean {

    // Iterative segment glob with backtracking — no per-suffix recursion or
    // string re-joining. `*` matches exactly one segment; `**` matches zero or
    // more. Standard wildcard algorithm (`*`≈`?`, `**`≈`*`).
    let i = 0; // pattern index
    let j = 0; // subject index
    let star = -1; // pSegs index of the most recent '**' seen
    let matchIdx = 0; // sSegs index captured when that '**' was seen

    while (j < sSegs.length) {
      if (i < pSegs.length && (pSegs[i] === "*" || pSegs[i] === sSegs[j])) {
        i++;
        j++;
      } else if (i < pSegs.length && pSegs[i] === "**") {
        // '**' initially absorbs zero segments; remember it for backtracking.
        star = i;
        matchIdx = j;
        i++;
      } else if (star !== -1) {
        // Backtrack: let the last '**' absorb one more subject segment.
        i = star + 1;
        j = ++matchIdx;
      } else {
        return false;
      }
    }

    // Any leftover pattern tokens must all be '**' (each matching zero segments).
    while (i < pSegs.length && pSegs[i] === "**") i++;
    return i === pSegs.length;
  }

  /**
   * Removes **all** listeners (exact and pattern). Useful for tests/HMR teardown.
   *
   * @example
   * ```ts
   * afterEach(() => bus.clear());
   * ```
   *
   * @public
   */
  clear(): void {
    this.handlers.clear();
    this.patternHandlers.clear();
    // The index is derived state; leaving it behind would re-register a pattern twice on the
    // next `on()` and hold every cleared pattern string alive for the life of the bus.
    this.patternIndex.clear();
  }

  /**
   * Returns a snapshot of all registered subscriptions for DevTools introspection.
   *
   * @returns An array of `{ channel, type, count }` entries for each distinct
   *          (channel, type/pattern) pair with at least one handler.
   *
   * @internal
   */
  __introspect(): Array<{ channel: string; type: string; count: number }> {
    const result: Array<{ channel: string; type: string; count: number }> = [];
    for (const [channel, map] of this.handlers) {
      for (const [type, list] of map) {
        if (list.length > 0) {
          result.push({ channel: channel as string, type: type as string, count: list.length });
        }
      }
    }
    for (const [channel, map] of this.patternHandlers) {
      for (const [pattern, list] of map) {
        if (list.length > 0) {
          result.push({ channel: channel as string, type: pattern, count: list.length });
        }
      }
    }
    return result;
  }
}