/**
 * Saving state, and starting from saved state.
 *
 * @remarks
 * The two halves happen on opposite sides of the store's existence, which is why this is two
 * functions rather than one. {@link hydrate} produces *initial slice state*, so the store is
 * born hydrated; {@link persist} subscribes to a store that already exists.
 *
 * Restoring after construction is the obvious alternative and the wrong one. It means applying
 * a whole-state snapshot to a live store, which emits a change across every path: a visible
 * flash on boot, a burst of instrumentation entries describing changes nobody made, and
 * effects observing a transition that never happened.
 *
 * @module @yoltra/core
 */

import { decodeState, encodeState } from "../serialize/codec";
import type { Scheduler, TimerHandle } from "../types";
import { globalScheduler } from "../utils/ports";

/** Where persisted state lives. Bring your own; core imports no platform global. */
export interface PersistenceAdapter {
  read(key: string): string | null | Promise<string | null>;
  write(key: string, value: string): void | Promise<void>;
  remove(key: string): void | Promise<void>;
}

/** Where a failure happened, so a handler can tell a bad write from a bad payload. */
export type PersistencePhase = "read" | "write" | "decode" | "migrate" | "encode";

/** Shared configuration. */
export interface PersistOptions {
  /** Storage key. */
  readonly key: string;
  readonly adapter: PersistenceAdapter;
  /**
   * Schema version of what is written.
   *
   * @remarks
   * Compared on read. A mismatch is handed to {@link PersistOptions.migrate}, and without one
   * the stored value is discarded rather than trusted — reducers change, and a snapshot
   * written against an older shape is not merely stale, it may not be valid state at all.
   */
  readonly version: number;
  /** Slices to persist. Every slice by default. */
  readonly slices?: readonly string[];
  /** Coalescing window for writes, in milliseconds. Defaults to 250. */
  readonly throttleMs?: number;
  /**
   * Largest number of values encoded in one write. Defaults to 100 000.
   *
   * @remarks
   * State larger than this is **not written**: the previous stored value stays, and a
   * {@link PersistEncodeError} with `truncated: true` reaches {@link PersistOptions.onError}.
   * Writing the part that fit would replace a complete earlier snapshot with a partial one,
   * which hydrates into state no reducer ever produced.
   */
  readonly maxNodes?: number;
  /**
   * Where the coalescing timer is armed. Defaults to the global `setTimeout` and `clearTimeout`,
   * looked up when the timer is armed, so fake timers installed later still apply.
   *
   * @remarks
   * Pass the store's own scheduler to keep every timer a host owns behind one port.
   */
  readonly scheduler?: Scheduler;
  /**
   * Upgrades a payload written by an older version.
   *
   * @returns The slices to restore, or `null` to start fresh.
   */
  readonly migrate?: (persisted: unknown, from: number) => Record<string, unknown> | null;
  /**
   * Called on any failure.
   *
   * @remarks
   * Persistence never throws into the application it is persisting. A store that will not
   * start because storage holds stale JSON is worse than one that starts fresh, and a full
   * disk should not take down a page.
   */
  readonly onError?: (error: unknown, phase: PersistencePhase) => void;
}

/**
 * What an encode had to give up, reported under the `"encode"` phase.
 *
 * @remarks
 * Two different losses, with two different outcomes. A **truncated** encode (state past
 * {@link PersistOptions.maxNodes}) is never written, so `written` is `false` and storage keeps its
 * previous value. **Unsupported** values (functions, symbols, class instances the codec cannot
 * represent) are written as markers, so `written` is `true` and `unsupported` names their paths.
 *
 * @public
 */
export class PersistEncodeError extends Error {
  /** The state exceeded the node budget. */
  readonly truncated: boolean;
  /** Paths of values written as markers because they have no faithful representation. */
  readonly unsupported: readonly string[];
  /** Whether anything was written. */
  readonly written: boolean;

  constructor(truncated: boolean, unsupported: readonly string[], written: boolean) {
    const parts: string[] = [];
    // Both, when both: "too large" says retry with less, a named path says which value to change.
    if (truncated) parts.push("state was too large to encode in full");
    if (unsupported.length > 0) {
      parts.push(`values with no faithful representation at: ${unsupported.join(", ")}`);
    }
    super(
      `[yoltra] Persisted state is incomplete: ${parts.join("; ")}. ` +
        (written ? "It was written anyway." : "Nothing was written; storage keeps its previous value."),
    );
    this.name = "PersistEncodeError";
    this.truncated = truncated;
    this.unsupported = unsupported;
    this.written = written;
  }
}

/** What {@link hydrate} recovered. */
export interface Hydration {
  /** Slice states to start from. Empty when there was nothing usable to restore. */
  readonly slices: Readonly<Record<string, unknown>>;
  /** `true` when a payload was found, decoded and accepted. */
  readonly restored: boolean;
}

/** What is written to storage. */
interface Envelope {
  readonly version: number;
  readonly slices: Record<string, unknown>;
}

/** @internal */
function report(
  options: Pick<PersistOptions, "onError">,
  error: unknown,
  phase: PersistencePhase,
): void {
  options.onError?.(error, phase);
}

/**
 * Reads persisted state, ready to seed a store.
 *
 * @remarks
 * Every read-side failure — missing, unparseable, wrong version with no migration, a
 * migration that declines — resolves to "nothing to restore" and reports through
 * {@link PersistOptions.onError}. Nothing throws.
 *
 * @example
 * ```ts
 * const hydration = await hydrate({ key: 'app', adapter, version: 3 });
 * const store = createStore({
 *   name: 'App',
 *   reducer: withHydration({ todos: todosSpec }, hydration),
 * });
 * ```
 *
 * @public
 */
export async function hydrate(
  options: PersistOptions & { readonly source?: string },
): Promise<Hydration> {
  const empty: Hydration = { slices: {}, restored: false };

  let raw: string | null | undefined;
  try {
    raw = options.source ?? (await options.adapter.read(options.key));
  } catch (error) {
    report(options, error, "read");
    return empty;
  }
  if (raw === null || raw === undefined || raw === "") return empty;

  let envelope: Envelope;
  try {
    envelope = decodeState(JSON.parse(raw)) as Envelope;
  } catch (error) {
    report(options, error, "decode");
    return empty;
  }

  if (envelope === null || typeof envelope !== "object" || typeof envelope.version !== "number") {
    report(options, new Error("persisted payload is not a recognisable envelope"), "decode");
    return empty;
  }

  if (envelope.version !== options.version) {
    if (options.migrate === undefined) {
      report(
        options,
        new Error(
          `persisted state is version ${envelope.version}, this build expects ${options.version}, and no migrate was supplied`,
        ),
        "migrate",
      );
      return empty;
    }
    try {
      const migrated = options.migrate(envelope.slices, envelope.version);
      if (migrated === null) return empty;
      return { slices: migrated, restored: true };
    } catch (error) {
      report(options, error, "migrate");
      return empty;
    }
  }

  return { slices: envelope.slices ?? {}, restored: true };
}

/**
 * Replaces each reducer's initial state with what was restored for it.
 *
 * @remarks
 * Slices absent from the payload keep their declared defaults, so adding a reducer does not
 * invalidate everything written before it existed.
 *
 * @public
 */
export function withHydration<R extends Record<string, { state: unknown }>>(
  reducers: R,
  hydration: Hydration,
): R {
  if (!hydration.restored) return reducers;

  const next = {} as Record<string, { state: unknown }>;
  for (const [name, spec] of Object.entries(reducers)) {
    const restored = hydration.slices[name];
    next[name] = restored === undefined ? spec : { ...spec, state: restored };
  }
  return next as R;
}

/** The store surface persistence needs, which is two methods wide. */
export interface PersistableStore {
  getState(): unknown;
  instrument(
    observer: (info: { changedPaths?: readonly string[] }) => void,
    options?: { ephemeral?: boolean },
  ): () => void;
}

/**
 * Serializes the slices being persisted, or refuses to.
 *
 * @returns The payload, or `null` when the state was truncated and must not be written.
 *
 * @remarks
 * Every loss is reported through {@link PersistOptions.onError} under the `"encode"` phase, as a
 * {@link PersistEncodeError}. Its own phase rather than `"write"`: a serialization loss and an
 * adapter failure need different responses.
 *
 * A truncated encode is refused. It used to be written, replacing a complete earlier snapshot
 * with one cut off at the node budget, which then hydrated into state no reducer produced.
 * Unsupported values still write: the rest of the state is intact, and each marker names its
 * path.
 */
function encodeEnvelope(
  state: unknown,
  options: Pick<PersistOptions, "version" | "slices" | "onError" | "maxNodes">,
): string | null {
  const all = (state ?? {}) as Record<string, unknown>;
  const slices: Record<string, unknown> =
    options.slices === undefined
      ? all
      : Object.fromEntries(options.slices.filter((s) => s in all).map((s) => [s, all[s]]));

  const { value, report: encodeReport } = encodeState(
    { version: options.version, slices },
    { maxNodes: options.maxNodes ?? 100_000 },
  );
  const { truncated, unsupported } = encodeReport;

  if (truncated || unsupported.length > 0) {
    report(options, new PersistEncodeError(truncated, unsupported, !truncated), "encode");
  }

  return truncated ? null : JSON.stringify(value);
}

/**
 * Writes state as it changes.
 *
 * @returns A function that stops persisting, flushes anything pending, and returns a promise
 *   that resolves once the last write has settled. Await it before a process exits: with an
 *   asynchronous adapter the final write is otherwise still in flight. It never rejects; a
 *   failed write is reported through `onError`.
 *
 * @remarks
 * Driven by `instrument` rather than the coarse subscription, so a change confined to a slice
 * that is not persisted costs nothing at all. Writes are coalesced on the trailing edge.
 *
 * @public
 */
export function persist(store: PersistableStore, options: PersistOptions): () => Promise<void> {
  const throttleMs = options.throttleMs ?? 250;
  const watched = options.slices;
  const scheduler = options.scheduler ?? globalScheduler;
  let timer: TimerHandle | null = null;
  let pending = false;
  // The most recent asynchronous write, settled or not, so stopping can wait for it.
  let lastWrite: Promise<void> = Promise.resolve();

  const flush = (): void => {
    if (!pending) return;
    pending = false;
    try {
      const payload = encodeEnvelope(store.getState(), options);
      // Refused and already reported: storage keeps the last complete snapshot.
      if (payload === null) return;
      const written = options.adapter.write(options.key, payload);
      if (written instanceof Promise) {
        lastWrite = written.catch((error: unknown) => report(options, error, "write"));
      }
    } catch (error) {
      // Storage being full, or unavailable in private mode, must not surface to the caller.
      report(options, error, "write");
    }
  };

  const schedule = (): void => {
    pending = true;
    if (throttleMs <= 0) {
      flush();
      return;
    }
    if (timer !== null) return;
    const handle = scheduler.setTimeout(() => {
      timer = null;
      flush();
    }, throttleMs);
    // Never hold a process open for a pending write.
    (handle as { unref?: () => void }).unref?.();
    timer = handle;
  };

  const stop = store.instrument((info) => {
    // Only an event that changed state is worth a write. A vetoed, refused or no-op event used
    // to schedule one too, rewriting storage with what it already held.
    const changed = info.changedPaths ?? [];
    if (changed.length === 0) return;
    // A changed path is `slice.rest`; only a watched slice is worth a write.
    if (
      watched === undefined ||
      changed.some((path) => watched.some((slice) => path === slice || path.startsWith(`${slice}.`)))
    ) {
      schedule();
    }
    // Opted into ephemeral events: storage must follow every change to state, whatever caused it.
  }, { ephemeral: true });

  return () => {
    stop();
    if (timer !== null) {
      scheduler.clearTimeout(timer);
      timer = null;
    }
    flush();
    return lastWrite;
  };
}

/**
 * Serializes a store for handoff, for example from a server render to the client.
 *
 * @returns The payload, or `""` when the state exceeded {@link PersistOptions.maxNodes}. An empty
 *   handoff hydrates as "nothing to restore", so the client starts from its defaults rather than
 *   from part of the server's state. The loss is reported through `onError` either way.
 *
 * @public
 */
export function dehydrate(
  store: Pick<PersistableStore, "getState">,
  options: Pick<PersistOptions, "version" | "slices" | "onError" | "maxNodes">,
): string {
  return encodeEnvelope(store.getState(), options) ?? "";
}
