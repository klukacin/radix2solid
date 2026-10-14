// Ported from recharts 3.8.1 src/state/eventSettingsSlice.ts (commit 7a23854).
// Solid-native slice; immer's `castDraft` is unnecessary with a Solid store.
import type { ChartStateInitializer } from "./createChartState";
import { EventThrottlingProps } from "../util/types";

export type EventSettingsState = Required<EventThrottlingProps>;

export const initialEventSettingsState: EventSettingsState = {
  throttleDelay: "raf",
  throttledEvents: ["mousemove", "touchmove", "pointermove", "scroll", "wheel"],
};

export interface EventSettingsActions {
  setEventSettings(payload: EventThrottlingProps): void;
}

export interface EventSettingsSlice {
  readonly state: EventSettingsState;
  readonly actions: EventSettingsActions;
}

export function createEventSettingsSlice(initialState: EventSettingsState=initialEventSettingsState,createState: ChartStateInitializer): EventSettingsSlice {
  const [state,setState]=createState<EventSettingsState>({ ...initialState });

  const actions: EventSettingsActions={
    setEventSettings(payload) {
      setState((s) => {
        if(payload.throttleDelay!=null) {
          s.throttleDelay=payload.throttleDelay;
        }
        if(payload.throttledEvents!=null) {
          s.throttledEvents=payload.throttledEvents;
        }
      });
    },
  };

  return { get state() { return state(); },actions };
}
