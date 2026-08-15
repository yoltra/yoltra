/**
 * @module @yoltra/core
 *
 * yoltra Core - Channel/Event-driven state management
 *
 * @packageDocumentation
 */

export { EventBus } from "./eventBus/EventBus";
export { LooseEventBus } from "./eventBus/LooseEventBus";
export { Reducer } from "./reducer/Reducer";
export { Store, createStore, typedEvents } from "./store/Store";
export { detectChangedProps } from "./utils/detectChangedProps";
export { freezeState } from "./utils/immutability";

// Export the eventKeys helper function
export { eventKeys } from "./types";

export type {
  EventMapBase,
  EventKey,
  Event,
  EventUnion,
  Change,
  Emit,
  EmitOptions,
  EventMeta,
  InstrumentedEvent,
  InstrumentationObserver,
  Unsubscribe,
  StoreSpec,
  StoreInstance,
  ReducerSpec,
  ReducerFunction,
  ReducersMapAny,
  StateFromReducers,
  EMFromReducersStrict,
  EffectSpec,
  EffectFunction,
  MiddlewareFunction,
  MiddlewareSpec,
  MiddlewareInput,
  DeepReadonly,
  DeepRO,
  Primitive,
  RootValue,
  Path,
  PathValue,
  WithGlob,
  Dotted,
  EventPhase,
  EventSubscriptionHandler,
  NarrowedEventHandler,
  // Event targeting (When matcher)
  When,
  EventFromWhen,
  // Metadata for debugging
  EventConsumerType,
  EventConsumerMeta,
} from "./types";

export { createEntityAdapter } from "./entity/entityAdapter";
export type {
  EntityAdapter,
  EntityAdapterOptions,
  EntityId,
  EntityState,
  EntityUpdate,
} from "./entity/entityAdapter";

export { decodeState, encodeState, encodeStateBounded } from "./serialize/codec";
export type {
  BoundedEncodeResult,
  EncodeOptions,
  EncodeReport,
  EncodeResult,
} from "./serialize/codec";

export { dehydrate, hydrate, persist, withHydration } from "./persistence/persist";
export type {
  Hydration,
  PersistableStore,
  PersistenceAdapter,
  PersistencePhase,
  PersistOptions,
} from "./persistence/persist";
export { createMemoryAdapter, createWebStorageAdapter } from "./persistence/adapters";
export type { WebStorageLike } from "./persistence/adapters";
