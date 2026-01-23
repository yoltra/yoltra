/**
 * @module @quojs/core
 *
 * Quo.js Core - Channel/Event-driven state management
 *
 * @packageDocumentation
 */

export { EventBus } from "./eventBus/EventBus";
export { LooseEventBus } from "./eventBus/LooseEventBus";
export { Reducer } from "./reducer/Reducer";
export { Store, createStore, typedEvents } from "./store/Store";
export { detectChangedProps } from "./utils/detectChangedProps";
export { freezeState } from "./utils/immutability";

export type {
  EventMapBase,
  EventKey,
  Event,
  EventUnion,
  Change,
  Emit,
  Unsubscribe,
  StoreSpec,
  StoreInstance,
  ReducerSpec,
  ReducerFunction,
  EffectSpec,
  EffectFunction,
  MiddlewareFunction,
  DeepReadonly,
  DeepRO,
  Primitive,
  Path,
  WithGlob,
  Dotted,
  EventPhase,
  EventSubscriptionHandler,
} from "./types";