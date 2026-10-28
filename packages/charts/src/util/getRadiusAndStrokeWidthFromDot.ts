import { svgPropertiesNoEventsFromUnknownKeepCase } from "./svgPropertiesNoEvents";
// Ported from recharts 3.8.1 src/util/getRadiusAndStrokeWidthFromDot.tsx (commit 7a23854).
// No JSX → `.ts`.
import { ActiveDotType, DotType } from "./types";

export function getRadiusAndStrokeWidthFromDot(dot: ActiveDotType | DotType): {
  r: number;
  strokeWidth: number;
} {
  const props = svgPropertiesNoEventsFromUnknownKeepCase(dot);
  const defaultR = 3;
  const defaultStrokeWidth = 2;
  if (props != null) {
    const r = props.r;
    const strokeWidth = props.strokeWidth;
    let realR = Number(r);
    let realStrokeWidth = Number(strokeWidth);
    if (Number.isNaN(realR) || realR < 0) {
      realR = defaultR;
    }
    if (Number.isNaN(realStrokeWidth) || realStrokeWidth < 0) {
      realStrokeWidth = defaultStrokeWidth;
    }
    return {
      r: realR,
      strokeWidth: realStrokeWidth,
    };
  }
  return {
    r: defaultR,
    strokeWidth: defaultStrokeWidth,
  };
}
