/**
 * @module @yoltra/core
 */

import type { Event, EventMapBase } from "../types";

/**
 * Minimal, synchronous pub/sub event bus keyed by **channel** and **type**.
 *
 * @typeParam EM - Event map shape:
 * ```ts
 * type EventMapBase = Record<string, Record<string, unknown>>;
 * // Example:
 * type EM = {
 *   ui: { toggle: boolean };
 *   data: { loaded: { items: string[] } };
 * };
 * ```
 *
 * @remarks
 * - Handlers are stored per `(channel, type)` and invoked **synchronously** in subscription order.
 * - Exceptions thrown by a handler are **caught and logged**, and do **not** stop other handlers.
 * - Intended for in-memory, single-process usage (no cross-tab/process broadcasting).
 *
 * @example
 * ```ts
 * type EM = {
 *   ui: { toggle: boolean };
 *   data: { loaded: { items: string[] } };
 * };
 *
 * const bus = new EventBus<EM>();
 *
 * // Subscribe
 * const off = bus.on('ui', 'toggle', (on) => {
 *   console.log('UI toggled:', on);
 * });
 *
 * // Emit
 * bus.emit('ui', 'toggle', true); // logs: "UI toggled: true"
 *
 * // Unsubscribe
 * off();
 * ```
 *
 * @public
 */
export class EventBus<EM extends EventMapBase> {
  /**
   * Internal registry: `channel → type → Set<handler>`.
   * @internal
   */
  private handlers: Map<string, Map<string, Set<(payload: any, event?: any) => void>>> = new Map();

  /**
   * Subscribes a handler to an exact `(channel, type)`.
   *
   * @typeParam C - Channel key (must be a string key of `EM`).
   * @typeParam T - Type key within channel `C` (must be a string key of `EM[C]`).
   * @param channel - Channel name to subscribe to.
   * @param type - Event type within the channel.
   * @param handler - Function invoked with the payload type `EM[C][T]`. It optionally
   * receives the **source event** as a second argument when the emitter supplies one, so
   * subscribers can read the true `id` (and any `meta`) instead of reconstructing an event
   * from the payload alone. Handlers that declare only `payload` remain valid.
   * @returns An **unsubscribe** function that removes this handler.
   *
   * @example
   * ```ts
   * const off = bus.on('data', 'loaded', ({ items }) => {
   *   console.log('Loaded', items.length, 'items');
   * });
   *
   * // Later, stop listening:
   * off();
   * ```
   *
   * @example Reading the source event
   * ```ts
   * bus.on('data', 'loaded', (payload, event) => {
   *   console.log('event id:', event?.id);
   * });
   * ```
   *
   * @public
   */
  public on<C extends keyof EM & string, T extends keyof EM[C] & string>(
    channel: C,
    type: T,
    handler: (payload: EM[C][T], event?: Event<EM, C, T>) => void,
  ): () => void {
    let byType = this.handlers.get(channel);
    if (!byType) {
      byType = new Map();
      this.handlers.set(channel, byType);
    }

    let set = byType.get(type);
    if (!set) {
      set = new Set();
      byType.set(type, set);
    }

    set.add(handler as any);

    return () => this.off(channel, type, handler);
  }

  /**
   * Removes a specific handler previously added with {@link EventBus.on | `on`}.
   *
   * @typeParam C - Channel key (string key of `EM`).
   * @typeParam T - Type key within channel `C` (string key of `EM[C]`).
   * @param channel - Channel name of the subscription to remove.
   * @param type - Event type of the subscription to remove.
   * @param handler - The same handler reference that was passed to `on`.
   *
   * @example
   * ```ts
   * const h = (n: number) => console.log('inc', n);
   * bus.on('math', 'inc', h);
   *
   * // Explicitly remove this handler:
   * bus.off('math', 'inc', h);
   * ```
   *
   * @public
   */
  public off<C extends keyof EM & string, T extends keyof EM[C] & string>(
    channel: C,
    type: T,
    handler: (payload: EM[C][T], event?: Event<EM, C, T>) => void,
  ): void {
    const byType = this.handlers.get(channel);
    if (!byType) return;

    const set = byType.get(type);
    if (!set) return;

    set.delete(handler as any);

    if (set.size === 0) byType.delete(type);
    if (byType.size === 0) this.handlers.delete(channel);
  }

  /**
   * Emits an event to all subscribers of the exact `(channel, type)`.
   *
   * Handlers are invoked **synchronously**. Any exception thrown by a handler is
   * caught and logged, and other handlers still run.
   *
   * @typeParam C - Channel key (string key of `EM`).
   * @typeParam T - Type key within channel `C` (string key of `EM[C]`).
   * @param channel - Channel name to emit on.
   * @param type - Event type to emit.
   * @param payload - Payload matching `EM[C][T]`.
   * @param event - Optional **source event**, forwarded to handlers as a second argument.
   * Supply it whenever the caller already holds the real event so subscribers observe its
   * true `id` rather than reconstructing one; omitting it keeps the original behaviour.
   *
   * @example
   * ```ts
   * bus.emit('ui', 'toggle', false);
   * ```
   *
   * @public
   */
  public emit<C extends keyof EM & string, T extends keyof EM[C] & string>(
    channel: C,
    type: T,
    payload: EM[C][T],
    event?: Event<EM, C, T>,
  ): void {
    const byType = this.handlers.get(channel);
    if (!byType) return;

    const set = byType.get(type);
    if (!set || set.size === 0) return;

    for (const h of [...set]) {
      try {
        (h as any)(payload, event);
      } catch (err) {
        console.error("EventBus handler error:", err);
      }
    }
  }

  /**
   * Clears **all** listeners across all channels/types.
   *
   * Useful for tests or during HMR teardown to avoid duplicate handlers.
   *
   * @example
   * ```ts
   * // In a test teardown:
   * afterEach(() => bus.clear());
   * ```
   *
   * @public
   */
  public clear(): void {
    this.handlers.clear();
  }
}