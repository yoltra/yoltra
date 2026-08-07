/**
 * Normalised collections, so a list stops paying O(N) for an O(1) change.
 *
 * @remarks
 * Path notification is positional for arrays. `detectChangedProps` walks indices and reports
 * `items.0.title`, which names a *slot*, not a thing. So `unshift`, `splice(0, 1)` and `sort`
 * move nearly every element into a different slot, and the diff correctly reports that nearly
 * every leaf changed. Inserting one row at the front of a thousand wakes a thousand
 * subscribers.
 *
 * The remedy is the state shape, not a quieter diff. A key-stable array diff would need an
 * identity key the diff has no business knowing, and even then the *paths* would still be
 * positional — `items.0.title` names position zero, and so does the RFC-6902 pointer the
 * devtools agents build from it.
 *
 * Normalising to `{ ids, entities }` makes `entities.abc.title` stable across insert, remove
 * and reorder.
 *
 * **What this does not do:** `ids` is still an array, so a reorder still reports `ids.0`,
 * `ids.1` and so on. That cost is confined rather than removed. A list container subscribes to
 * `ids` and reorders its children; rows subscribe to `entities.<id>.<field>` and stay asleep.
 * The promise is cost proportional to what actually changed.
 *
 * @module @yoltra/core
 */

/** What an entity may be keyed by. */
export type EntityId = string | number;

/**
 * A normalised collection.
 *
 * @typeParam T - The entity.
 * @typeParam Id - Its key type.
 *
 * @public
 */
export interface EntityState<T, Id extends EntityId = string> {
  /** Order. Reordering touches this and nothing under `entities`. */
  readonly ids: readonly Id[];
  /** Identity-keyed, so a path to one entity survives every change to the others. */
  readonly entities: Readonly<Record<Id, T>>;
}

/** A change to apply to one entity. */
export interface EntityUpdate<T, Id extends EntityId> {
  readonly id: Id;
  readonly changes: Partial<T>;
}

/** How an adapter identifies and orders its entities. */
export interface EntityAdapterOptions<T, Id extends EntityId> {
  /** Defaults to reading `id`. */
  readonly selectId?: (entity: T) => Id;
  /**
   * Keeps `ids` sorted.
   *
   * @remarks
   * Omit it and `ids` holds insertion order, which is cheaper: with a comparer, any change
   * that could affect position re-sorts. The sorted array is only adopted when it actually
   * differs, so a sort that changes nothing reports nothing.
   */
  readonly sortComparer?: (a: T, b: T) => number;
}

/**
 * Reducer helpers, selectors, and the subscription paths that make the shape worth having.
 *
 * @public
 */
export interface EntityAdapter<T, Id extends EntityId = string> {
  getInitialState(): EntityState<T, Id>;
  getInitialState<Extra extends object>(extra: Extra): EntityState<T, Id> & Extra;

  /** Adds an entity. Existing ids are left alone — this is not an upsert. */
  addOne<S extends EntityState<T, Id>>(state: S, entity: T): S;
  addMany<S extends EntityState<T, Id>>(state: S, entities: readonly T[]): S;
  /** Adds or replaces one entity wholesale. */
  setOne<S extends EntityState<T, Id>>(state: S, entity: T): S;
  setMany<S extends EntityState<T, Id>>(state: S, entities: readonly T[]): S;
  /** Replaces the whole collection. */
  setAll<S extends EntityState<T, Id>>(state: S, entities: readonly T[]): S;
  /** Merges `changes` into one entity. Unknown ids are ignored. */
  updateOne<S extends EntityState<T, Id>>(state: S, update: EntityUpdate<T, Id>): S;
  updateMany<S extends EntityState<T, Id>>(state: S, updates: readonly EntityUpdate<T, Id>[]): S;
  /** Adds, or merges into an existing entity. */
  upsertOne<S extends EntityState<T, Id>>(state: S, entity: T): S;
  upsertMany<S extends EntityState<T, Id>>(state: S, entities: readonly T[]): S;
  removeOne<S extends EntityState<T, Id>>(state: S, id: Id): S;
  removeMany<S extends EntityState<T, Id>>(state: S, ids: readonly Id[]): S;
  removeAll<S extends EntityState<T, Id>>(state: S): S;

  selectIds(state: EntityState<T, Id>): readonly Id[];
  selectEntities(state: EntityState<T, Id>): Readonly<Record<Id, T>>;
  selectAll(state: EntityState<T, Id>): readonly T[];
  selectById(state: EntityState<T, Id>, id: Id): T | undefined;
  selectTotal(state: EntityState<T, Id>): number;

  /** Path to the order array. Subscribe here for a list that reorders. */
  readonly idsPath: string;
  /** Path to one entity, or to a field of it. */
  pathTo(id: Id, field?: string): string;
  /** Wildcard across every entity's `field`, for the loose subscription registry. */
  anyField(field: string): string;
}

/** @internal */
const warnedDottedIds = new Set<string>();

/** @internal */
function warnDottedId(id: EntityId): void {
  const key = String(id);
  if (warnedDottedIds.has(key)) return;
  warnedDottedIds.add(key);
  console.warn(
    `[yoltra] Entity id "${key}" contains a dot. Paths are dotted, so a subscription to ` +
      `"entities.${key}" is indistinguishable from one to a nested object of the same name. ` +
      `Use ids without dots.`,
  );
}

/**
 * Returns `next` only when it differs from `current`, element by element.
 *
 * @remarks
 * Reusing the existing array when the order did not change is what keeps `ids` out of the
 * changed-path list. Without it, every update to a sorted collection would report the order
 * as changed and wake the list container for nothing.
 *
 * @internal
 */
function sameOrder<Id extends EntityId>(
  current: readonly Id[],
  next: readonly Id[],
): readonly Id[] {
  if (current.length !== next.length) return next;
  for (let i = 0; i < current.length; i++) {
    if (current[i] !== next[i]) return next;
  }
  return current;
}

/**
 * Builds an adapter for one entity type.
 *
 * @example
 * ```ts
 * const todos = createEntityAdapter<Todo>();
 *
 * const spec: ReducerSpec<EntityState<Todo>, EM> = {
 *   state: todos.getInitialState(),
 *   when: { keys: eventKeys<EM>()([['todos', 'toggled']]) },
 *   reducer: (state, event) =>
 *     todos.updateOne(state, { id: event.payload.id, changes: { done: event.payload.done } }),
 * };
 *
 * // and in a component
 * useAtomicProp({ reducer: 'todos', property: todos.pathTo(id, 'title') });
 * ```
 *
 * @public
 */
export function createEntityAdapter<T, Id extends EntityId = string>(
  options: EntityAdapterOptions<T, Id> = {},
): EntityAdapter<T, Id> {
  const selectId = options.selectId ?? ((entity: T) => (entity as { id: Id }).id);
  const { sortComparer } = options;

  const order = <S extends EntityState<T, Id>>(state: S, ids: readonly Id[]): readonly Id[] => {
    if (sortComparer === undefined) return ids;
    const sorted = [...ids].sort((a, b) => {
      const left = state.entities[a];
      const right = state.entities[b];
      if (left === undefined || right === undefined) return 0;
      return sortComparer(left, right);
    });
    return sameOrder(ids, sorted);
  };

  const write = <S extends EntityState<T, Id>>(
    state: S,
    entities: Record<Id, T>,
    ids: readonly Id[],
  ): S => {
    const next = { ...state, entities, ids } as S;
    return { ...next, ids: order(next, ids) };
  };

  const put = <S extends EntityState<T, Id>>(
    state: S,
    incoming: readonly T[],
    mode: "add" | "set" | "upsert",
  ): S => {
    let entities: Record<Id, T> | null = null;
    let ids: Id[] | null = null;

    for (const entity of incoming) {
      const id = selectId(entity);
      if (process.env.NODE_ENV !== "production" && String(id).includes(".")) warnDottedId(id);

      const existing = (entities ?? state.entities)[id];
      if (existing !== undefined && mode === "add") continue;

      const value =
        existing !== undefined && mode === "upsert" ? { ...existing, ...entity } : entity;

      entities ??= { ...state.entities };
      entities[id] = value;
      if (existing === undefined) {
        ids ??= [...state.ids];
        ids.push(id);
      }
    }

    if (entities === null) return state;
    return write(state, entities, ids ?? state.ids);
  };

  const merge = <S extends EntityState<T, Id>>(
    state: S,
    updates: readonly EntityUpdate<T, Id>[],
  ): S => {
    let entities: Record<Id, T> | null = null;

    for (const { id, changes } of updates) {
      const existing = (entities ?? state.entities)[id];
      if (existing === undefined) continue;
      entities ??= { ...state.entities };
      // Only the touched entity gets a new reference. Cloning the rest would report every
      // entity as changed, which is the defect this whole module exists to remove.
      entities[id] = { ...existing, ...changes };
    }

    if (entities === null) return state;
    return write(state, entities, state.ids);
  };

  const drop = <S extends EntityState<T, Id>>(state: S, ids: readonly Id[]): S => {
    const doomed = new Set<Id>(ids.filter((id) => state.entities[id] !== undefined));
    if (doomed.size === 0) return state;

    const entities = { ...state.entities };
    for (const id of doomed) delete entities[id];
    return write(
      state,
      entities,
      state.ids.filter((id) => !doomed.has(id)),
    );
  };

  return {
    getInitialState<Extra extends object>(extra?: Extra) {
      const base: EntityState<T, Id> = { ids: [], entities: {} as Record<Id, T> };
      return (extra === undefined ? base : { ...base, ...extra }) as EntityState<T, Id> & Extra;
    },

    addOne: (state, entity) => put(state, [entity], "add"),
    addMany: (state, entities) => put(state, entities, "add"),
    setOne: (state, entity) => put(state, [entity], "set"),
    setMany: (state, entities) => put(state, entities, "set"),
    setAll: (state, entities) => {
      const next = {} as Record<Id, T>;
      const ids: Id[] = [];
      for (const entity of entities) {
        const id = selectId(entity);
        if (next[id] === undefined) ids.push(id);
        next[id] = entity;
      }
      return write(state, next, ids);
    },
    updateOne: (state, update) => merge(state, [update]),
    updateMany: (state, updates) => merge(state, updates),
    upsertOne: (state, entity) => put(state, [entity], "upsert"),
    upsertMany: (state, entities) => put(state, entities, "upsert"),
    removeOne: (state, id) => drop(state, [id]),
    removeMany: (state, ids) => drop(state, ids),
    removeAll: (state) => (state.ids.length === 0 ? state : write(state, {} as Record<Id, T>, [])),

    selectIds: (state) => state.ids,
    selectEntities: (state) => state.entities,
    selectAll: (state) => state.ids.map((id) => state.entities[id]!),
    selectById: (state, id) => state.entities[id],
    selectTotal: (state) => state.ids.length,

    idsPath: "ids",
    pathTo: (id, field) => (field === undefined ? `entities.${id}` : `entities.${id}.${field}`),
    anyField: (field) => `entities.*.${field}`,
  };
}
