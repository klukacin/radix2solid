import { marginPropDefs } from "../props/margin.props.js";
import type { MarginProps } from "../props/margin.props.js";
import { getResponsiveStyles } from "./get-responsive-styles.js";

export function getMarginStyles(margins: MarginProps) {
  const classes: string[] = [];
  const styles: Record<string, string | undefined> = {};
  for (const key of Object.keys(marginPropDefs) as (keyof MarginProps)[]) {
    if (margins[key] === undefined) continue;
    const def = marginPropDefs[key];
    const [className, variables] = getResponsiveStyles({
      className: def.className,
      customProperties: def.customProperties,
      propValues: def.values,
      value: margins[key],
    });
    if (className) classes.push(className);
    Object.assign(styles, variables);
  }
  return [classes.join(" "), styles] as const;
}
