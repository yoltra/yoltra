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

/** Where persisted state lives. Bring your own; core imports no platform global. */
export interface PersistenceAdapter {
  read(key: string): string | null | Promise<string | null>;
  write(key: string, value: string): void | Promise<void>;
  remove(key: string): void | Promise<void>;
}

/** Where a failure happened, so a handler can tell a bad write from a bad payload. */
export type PersistencePhase = "read" | "write" | "decode" | "migrate";

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
function report(options: PersistOptions, error: unknown, phase: PersistencePhase): void {
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

/** A reducer spec, as far as hydration cares: something carrying an initial `state`. */
interface HasState {
  state: unknown;
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
export function withHydration<R extends Record<string, HasState>>(
  reducers: R,
  hydration: Hydration,
): R {
  if (!hydration.restored) return reducers;

  const next = {} as Record<string, HasState>;
  for (const [name, spec] of Object.entries(reducers)) {
    const restored = hydration.slices[name];
    next[name] = restored === undefined ? spec : { ...spec, state: restored };
  }
  return next as R;
}

/** The store surface persistence needs, which is two methods wide. */
export interface PersistableStore {
  getState(): unknown;
  instrument(observer: (info: { changedPaths?: readonly string[] }) => void): () => void;
}

/** Serializes the slices being persisted. */
function encodeEnvelope(state: unknown, options: Pick<PersistOptions, "version" | "slices">): string {
  const all = (state ?? {}) as Record<string, unknown>;
  const slices: Record<string, unknown> =
    options.slices === undefined
      ? all
      : Object.fromEntries(options.slices.filter((s) => s in all).map((s) => [s, all[s]]));

  return JSON.stringify(encodeState({ version: options.version, slices }).value);
}

/**
 * Writes state as it changes.
 *
 * @returns A function that stops persisting and flushes anything pending.
 *
 * @remarks
 * Driven by `instrument` rather than the coarse subscription, so a change confined to a slice
 * that is not persisted costs nothing at all. Writes are coalesced on the trailing edge.
 *
 * @public
 */
export function persist(store: PersistableStore, options: PersistOptions): () => void {
  const throttleMs = options.throttleMs ?? 250;
  const watched = options.slices;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending = false;

  const flush = (): void => {
    if (!pending) return;
    pending = false;
    try {
      const written = options.adapter.write(options.key, encodeEnvelope(store.getState(), options));
      if (written instanceof Promise) {
        void written.catch((error: unknown) => report(options, error, "write"));
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
    timer = setTimeout(() => {
      timer = null;
      flush();
    }, throttleMs);
    // Never hold a process open for a pending write.
    (timer as unknown as { unref?: () => void }).unref?.();
  };

  const stop = store.instrument((info) => {
    if (watched === undefined) {
      schedule();
      return;
    }
    // A changed path is `slice.rest`; only a watched slice is worth a write.
    const touched = (info.changedPaths ?? []).some((path) =>
      watched.some((slice) => path === slice || path.startsWith(`${slice}.`)),
    );
    if (touched) schedule();
  });

  return () => {
    stop();
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    flush();
  };
}

/**
 * Serializes a store for handoff, for example from a server render to the client.
 *
 * @public
 */
export function dehydrate(
  store: Pick<PersistableStore, "getState">,
  options: Pick<PersistOptions, "version" | "slices">,
): string {
  return encodeEnvelope(store.getState(), options);
}
