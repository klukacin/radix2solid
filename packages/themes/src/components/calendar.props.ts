import { colorPropDef } from "../props/color.prop.js";
import type { PropDef } from "../props/prop-def.js";
import { radiusPropDef } from "../props/radius.prop.js";

const sizes = ["1", "2", "3"] as const;
const variants = ["surface", "classic", "soft"] as const;

const calendarRootPropDefs = {
  size: {
    type: "enum",
    className: "rt-r-size",
    values: sizes,
    default: "2",
    responsive: true,
  },
  variant: {
    type: "enum",
    className: "rt-variant",
    values: variants,
    default: "surface",
  },
  ...colorPropDef,
  ...radiusPropDef,
} satisfies {
  size: PropDef<(typeof sizes)[number]>;
  variant: PropDef<(typeof variants)[number]>;
};

export { calendarRootPropDefs };
