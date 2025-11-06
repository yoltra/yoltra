import type { StoreInstance } from "@quojs/core";

// declarative, ultra-simple and eXpressive
export type QuoPlegdes = "d" | "u" | "x";

// Logo reducer
export type Circle = {
  id: string;         // the circle id
  x: number;          // new x position
  y: number;          // new x position
  r?: number;
};

export type GroupedCircle = {
  group: QuoPlegdes;  // the group  in which updated circle lives
} & Circle;

/**
 * Logo State
 * 
 * Describes the shape of the logo state. */
export type LogoState = {
  // interactivity toggle
  enabled: boolean;

  // current FPS (updated at 4hz)
  fps: number;

  // how many circles were generated for each letter
  itemCount: { d: number; u: number; x: number };

  // the size of the svg element
  size: { height: number; width: number };

  // dictionary of circles separated by our pledge initial
  d: Record<string, Circle>; // declarative
  u: Record<string, Circle>; // ultra-simple
  x: Record<string, Circle>; // eXpressive

  // hols state related to intro animation
  intro: {
    remaining: number;  // how many circles are still animating
    total?: number;     // total of circles, remaining + done
    done: boolean;      // specifies if the intro is complete
  };
};

/**
 * Logo reducer action map.
 * 
 * Descrives the set of events and their payloads
 * for the logo channel. */
export type LogoAM = {
  // stops animation
  stop: {};

  // starts animation
  start: {};

  // FPS information
  fps: { fps: number };

  // changes to the size of the animation
  size: { height: number; width: number };

  // coun of circles by group
  count: { d: number; u: number; x: number };

  /**
 * Atomic update of Circle.
 * 
 * Dispatched mostly because circles are
 * avoiding the mouse or traveling back
 * to their original position. */
  update: GroupedCircle;

  /**
   * Batch update of Circles.
   * 
   * Dispatched on every frame by the animation BE
   * to update multiple circles in batch, circles are grouped. */
  batchUpdate: {
    changes: GroupedCircle[], // An array of change description objects
  };

  // Dispathed every frame during progress animation
  introProgress: {
    remaining: number;  // number of circles that are yet to arrive home
    total : number;      // total number of traveling circles
  };

  // Dispatched when the intro animation is complete
  introComplete: {};
};

// Application state shape
export interface AppState {
  logo: LogoState;
}

// Application action map
export type AppAM = {
  logo: LogoAM;
  on: {
    mousemove: { x: number; y: number };
  };
};

export type AppStore = StoreInstance<keyof AppState & string, AppState, AppAM>;
