import type { JSX } from "@solidjs/web";
import { createMemo, merge, omit } from "solid-js";

import type { PropDef, Responsive } from "../props/prop-def.js";
import {
  getResponsiveClassNames,
  getResponsiveStyles,
} from "./get-responsive-styles.js";
import { isResponsiveObject } from "./is-responsive-object.js";
import { mergeStyles } from "./merge-styles.js";

type StylingKeys<T> =
  T extends Record<string, PropDef>
    ? {
        [K in keyof T]: T[K] extends { className: string } ? K : never;
      }[keyof T]
    : never;
type StylingProps = Pick<JSX.HTMLAttributes<HTMLElement>, "class" | "style">;

/** Live native prop view; responsive defaults never write to consumer objects. */
export function extractProps<
  P extends object,
  T extends Record<string, PropDef>[],
>(
  props: P & StylingProps,
  ...propDefs: T
): Omit<P, StylingKeys<T[number]> | "class" | "style"> & StylingProps {
  const defs: Record<string, PropDef> = Object.assign({}, ...propDefs);
  const stylingKeys: string[] = [];
  const defaults: Record<string, unknown> = {};
  function value(key: string, def: PropDef): unknown {
    let current: unknown = Reflect.get(props, key);
    if (current === undefined) current = def.default;
    if (
      def.type === "enum" &&
      !isResponsiveObject(current as Responsive<string>) &&
      !def.values.includes(current)
    ) {
      current = def.default;
    }
    if (isResponsiveObject(current as Responsive<string>)) {
      const responsive = current as Partial<Record<string, string>>;
      const initial = responsive.initial;
      if (
        initial === undefined
          ? def.default !== undefined
          : def.type === "enum" && !def.values.includes(initial)
      ) {
        current = { ...responsive, initial: def.default };
      }
    }
    return current;
  }
  for (const [key, def] of Object.entries(defs)) {
    if ("className" in def && def.className) stylingKeys.push(key);
    else
      Object.defineProperty(defaults, key, {
        enumerable: true,
        get: () => value(key, def),
      });
  }
  const styling = createMemo(() => {
    const classes: string[] = [];
    const variables: Record<string, string | undefined> = {};
    for (const key of stylingKeys) {
      const def = defs[key];
      const current = value(key, def);
      if (
        !current ||
        (isResponsiveObject(current as Responsive<string>) &&
          !("responsive" in def))
      )
        continue;
      if (!("className" in def)) continue;
      if (def.type === "enum") {
        const result = getResponsiveClassNames({
          className: def.className!,
          value: current as Responsive<string>,
          propValues: def.values,
          parseValue: def.parseValue,
        });
        if (result) classes.push(result);
      } else if (
        (def.type === "string" || def.type === "enum | string") &&
        "customProperties" in def &&
        def.customProperties
      ) {
        const [className, styles] = getResponsiveStyles({
          className: def.className!,
          customProperties: def.customProperties,
          value: current as Responsive<string>,
          propValues: def.type === "string" ? [] : def.values,
          parseValue: def.parseValue,
        });
        if (className) classes.push(className);
        Object.assign(variables, styles);
      } else if (def.type === "boolean") classes.push(def.className!);
    }
    return { classes: classes.join(" "), variables };
  });
  return merge(
    omit(props, ...(stylingKeys as (keyof (P & StylingProps))[])),
    defaults,
    {
      get class() {
        return [styling().classes, props.class];
      },
      get style() {
        return mergeStyles(styling().variables, props.style);
      },
    },
  ) as Omit<P, StylingKeys<T[number]> | "class" | "style"> & StylingProps;
}
