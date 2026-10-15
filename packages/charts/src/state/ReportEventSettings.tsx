import type { JSX } from "@solidjs/web";
// Ported from recharts 3.8.1 src/state/ReportEventSettings.tsx (commit 7a23854).
// memo/propsAreEqual dropped; useAppDispatch → useAppStore().actions; useEffect → createEffect.
import { createEffect } from "solid-js";

import { EventThrottlingProps } from "../util/types";
import { useAppStore } from "./hooks";

export const ReportEventSettings = (
  props: EventThrottlingProps,
): JSX.Element => {
  const store = useAppStore();

  createEffect(
    () => ({
      throttleDelay: props.throttleDelay,
      throttledEvents: props.throttledEvents,
    }),
    (settings) => {
      store?.actions.eventSettings.setEventSettings(settings);
    },
  );

  return null;
};
