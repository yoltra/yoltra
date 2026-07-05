/**
 * Performance metrics collection for DevTools-instrumented stores.
 *
 * @remarks
 * Tracks event throughput, processing latency, deduplication hits, and
 * middleware rejections over a rolling one-second window. Metrics snapshots
 * are reported to the DevTools hub on demand via `STORE_METRICS` messages.
 *
 * @module @yoltra/devtools-node-agent
 */

import type { StoreMetrics } from "@yoltra/devtools-protocol";

/**
 * Collects and computes real-time performance metrics for a DevTools-wrapped store.
 *
 * @remarks
 * Maintains a rolling one-second window of event timestamps to compute
 * events-per-second, and accumulates lifetime counters for total event count,
 * processing time, dedup hits, and middleware rejections. The {@link buildMetrics}
 * method merges these counters with live store introspection data to produce
 * a complete {@link StoreMetrics} snapshot.
 *
 * @internal
 */
export class MetricsCollector {
  private eventCount = 0;
  private totalProcessingTimeMs = 0;
  private dedupHits = 0;
  private middlewareRejections = 0;
  private recentEvents: number[] = []; // timestamps of recent events
  private readonly windowMs = 1000; // 1s rolling window for events/sec

  /**
   * Record an event being processed.
   *
   * @param processingTimeMs - Time taken to process the event (ms).
   */
  recordEvent(processingTimeMs: number): void {
    this.eventCount++;
    this.totalProcessingTimeMs += processingTimeMs;
    this.recentEvents.push(Date.now());
    this.pruneRecent();
  }

  /**
   * Record a deduplication hit (event skipped by the dedup guard).
   *
   * @remarks
   * Increments the lifetime dedup-hit counter, which is included in the
   * next metrics snapshot.
   */
  recordDedupHit(): void {
    this.dedupHits++;
  }

  /**
   * Record a middleware rejection (event blocked by middleware).
   *
   * @remarks
   * Increments the lifetime middleware-rejection counter, which is included
   * in the next metrics snapshot.
   */
  recordMiddlewareRejection(): void {
    this.middlewareRejections++;
  }

  /**
   * Build a complete metrics snapshot by merging collected counters with
   * live store introspection data.
   *
   * @remarks
   * Prunes stale timestamps from the rolling window before computing
   * `eventsPerSecond`. All lifetime counters (event count, dedup hits,
   * middleware rejections) are included as-is.
   *
   * @param storeInfo - Live introspection counts from the instrumented store
   *   (reducer count, effect count, etc.).
   * @returns A `StoreMetrics["metrics"]` object ready for serialisation.
   */
  /** Returns the total committed event count (for computing middlewareRejections externally). */
  getEventCount(): number {
    return this.eventCount;
  }

  buildMetrics(storeInfo: {
    reducerCount: number;
    effectCount: number;
    middlewareCount: number;
    subscriberCount: number;
    connectorCount: number;
    dedupHits: number;
    queueDepth: number;
    middlewareRejections: number;
  }): StoreMetrics["metrics"] {
    this.pruneRecent();

    return {
      eventCount: this.eventCount,
      eventsPerSecond: this.recentEvents.length,
      avgProcessingTimeMs:
        this.eventCount > 0 ? this.totalProcessingTimeMs / this.eventCount : 0,
      reducerCount: storeInfo.reducerCount,
      effectCount: storeInfo.effectCount,
      middlewareCount: storeInfo.middlewareCount,
      subscriberCount: storeInfo.subscriberCount,
      connectorCount: storeInfo.connectorCount,
      dedupHits: storeInfo.dedupHits,
      middlewareRejections: storeInfo.middlewareRejections,
      queueDepth: storeInfo.queueDepth,
    };
  }

  private pruneRecent(): void {
    const cutoff = Date.now() - this.windowMs;
    while (this.recentEvents.length > 0 && this.recentEvents[0] < cutoff) {
      this.recentEvents.shift();
    }
  }
}
