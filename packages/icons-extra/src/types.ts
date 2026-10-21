import type { JSX } from "@solidjs/web";

export type IconProps = Omit<
  JSX.IntrinsicElements["svg"],
  "children" | "title"
> & {
  children?: never;
  color?: string;
  size?: number | string;
  /** A native SVG title gives this icon an accessible name. */
  title?: string;
};
