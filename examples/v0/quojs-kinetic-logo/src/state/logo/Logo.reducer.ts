import type { ActionPair, ReducerSpec } from "@quojs/core";
import type { AppAM, LogoAM, LogoState, Circle } from "../types";

export const LOGO_INITIAL_STATE: LogoState = {
  enabled: true,
  d: Object.create(null),
  u: Object.create(null),
  x: Object.create(null),
  fps: 0,
  itemCount: { d: 0, u: 0, x: 0 },
  size: { height: 0, width: 0 },
  intro: {
    remaining: 0,
    total: 0,
    done: false,
  },
};

const LOGO_ACTIONS = [
  ["logo", "update"],
  ["logo", "stop"],
  ["logo", "fps"],
  ["logo", "size"],
  ["logo", "count"],
  ["logo", "batchUpdate"],
  ["logo", "introProgress"],
  ["logo", "introComplete"],
  ["logo", "start"],
] as const satisfies readonly ActionPair<AppAM>[];

// type inference
type GroupKey = keyof Pick<LogoState, "d" | "u" | "x">;

function upsertItem(state: LogoState, group: GroupKey, next: Circle): LogoState {
  const groupMap = state[group];
  const prev = groupMap[next.id];

  // insert
  if (!prev) {
    const nextGroup = { ...groupMap, [next.id]: next };
    return { ...state, [group]: nextGroup };
  }

  // update only if something actually changed
  if (
    prev.x === next.x &&
    prev.y === next.y
  ) {
    return state; // no-op
  }

  const nextGroup = { ...groupMap, [next.id]: { ...prev, ...next } };
  return { ...state, [group]: nextGroup };
}

export const logoReducer: ReducerSpec<LogoState, AppAM> = {
  actions: [
    ...LOGO_ACTIONS
  ],
  state: LOGO_INITIAL_STATE,
  reducer: (state, action) => {
    if (action.channel !== "logo") return state;
    if (!state.enabled && action.event !== "start") return state;

    /**
     * Here, everything is auto-completed.
     * 
     * Try removing the "update" part on line #71 and re-add it */
    switch (action.event) {
      case "update": {
        const { group, id, x, y } = action.payload;
        const next: Circle = { id, x, y };

        return upsertItem(state, group as GroupKey, next);
      }

      case "start": {
        if (state.enabled) return state;

        return {
          ...state,
          enabled: true,
        };
      }

      case "stop": {
        if (!state.enabled) return state;

        return {
          ...state,
          enabled: false
        };
      }

      case "fps": {
        const { fps } = action.payload as LogoAM["fps"];

        if (state.fps === fps) return state;

        return {
          ...state,
          fps,
        };
      }

      case "count": {
        const next = action.payload as LogoAM["count"];
        const prev = state.itemCount;

        if (prev.d === next.d && prev.u === next.u && prev.x === next.x) return state;

        return { ...state, itemCount: next };
      }

      case "size": {
        const { height, width } = action.payload as LogoAM["size"];
        const prev = state.size;

        if (prev.height === height && prev.width === width) return state;

        return {
          ...state, size: {
            height,
            width,
          }
        };
      }

      case "batchUpdate": {
        if (!action.payload.changes.length) return state;
        const { changes } = action.payload;

        let wroteAny = false;
        for (const c of changes) {
          let prev = state[c.group][c.id];

          if (!prev) {
            prev = {
              ...state[c.group][c.id],
              ...c,
            };

            state = {
              ...state,
              [c.group]: {
                ...state[c.group],
                [c.id]: prev,
              }
            };

            wroteAny = true;
            continue;
          }

          const nx = c.x ?? prev.x;
          const ny = c.y ?? prev.y;

          if (nx !== prev.x || ny !== prev.y) {
            state = {
              ...state,
              [c.group]: {
                ...state[c.group],
                [c.id]: { ...prev, x: nx, y: ny },
              }
            };

            wroteAny = true;
          }
        }

        return wroteAny ? { ...state } : state;
      }

      case "introProgress": {
        const { remaining, total } = action.payload;

        return {
          ...state,
          intro: {
            ...state.intro,
            remaining,
            total,
          }
        };
      }

      case "introComplete": {
        return {
          ...state,
          intro: {
            ...(state.intro ?? {}),
            remaining: 0,
            done: true
          }
        };
      }

      default:
        return state;
    }
  },
};
