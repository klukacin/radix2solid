// Adapted from recharts #7564 (082495ac4b05070b745089b2d82db2dc1eb8ccc8).
import type { TextAnchor, TextVerticalAnchor } from "../component/Text";

export function cartesianPositionToCSSTranslate(
  horizontal: TextAnchor,
  vertical: TextVerticalAnchor,
): string {
  if (horizontal === "start" && vertical === "start") return "";
  const x =
    horizontal === "middle" ? "-50%" : horizontal === "end" ? "-100%" : "0";
  const y = vertical === "middle" ? "-50%" : vertical === "end" ? "-100%" : "0";
  return `translate(${x}, ${y})`;
}
