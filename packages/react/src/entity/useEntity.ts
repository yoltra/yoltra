/**
 * Hooks for normalised collections, so a row subscribes to itself rather than to the list.
 *
 * @remarks
 * These are thin wrappers over {@link useAtomicProp}. Their whole value is that the path
 * comes from the adapter rather than being written by hand: `entities.abc.title` typed into a
 * component is a string nothing checks, and it is the kind of string that silently stops
 * matching when an id format changes.
 *
 * @module @yoltra/react
 */

import type { EntityAdapter, EntityId, EntityState } from "@yoltra/core";

import { useAtomicProp } from "../hooks/hooks";

/**
 * Subscribes to a collection's order.
 *
 * @remarks
 * This is the subscription a list container wants, and the only one that should wake when the
 * collection is reordered. Rows use {@link useEntity} or {@link useEntityField} and stay
 * asleep through a sort.
 *
 * @public
 */
export function useEntityIds<T, Id extends EntityId, R extends string>(
  reducer: R,
  adapter: EntityAdapter<T, Id>,
): readonly Id[] {
  return useAtomicProp<R, Record<R, EntityState<T, Id>>, R, never>({
    reducer,
    property: adapter.idsPath as never,
  }) as unknown as readonly Id[];
}

/**
 * Subscribes to one entity.
 *
 * @returns The entity, or `undefined` once it has been removed — a row that outlives its data
 * for one render is normal, and returning `undefined` is what lets it render nothing rather
 * than throw.
 *
 * @public
 */
export function useEntity<T, Id extends EntityId, R extends string>(
  reducer: R,
  adapter: EntityAdapter<T, Id>,
  id: Id,
): T | undefined {
  return useAtomicProp<R, Record<R, EntityState<T, Id>>, R, never>({
    reducer,
    property: adapter.pathTo(id) as never,
  }) as unknown as T | undefined;
}

/**
 * Subscribes to one field of one entity.
 *
 * @remarks
 * The narrowest subscription available, and the reason the shape is worth adopting: editing a
 * title wakes the components reading that title and nothing else.
 *
 * @public
 */
export function useEntityField<T, Id extends EntityId, R extends string, K extends keyof T & string>(
  reducer: R,
  adapter: EntityAdapter<T, Id>,
  id: Id,
  field: K,
): T[K] | undefined {
  return useAtomicProp<R, Record<R, EntityState<T, Id>>, R, never>({
    reducer,
    property: adapter.pathTo(id, field) as never,
  }) as unknown as T[K] | undefined;
}
