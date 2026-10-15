import type { ComponentProps, ValidComponent } from "@solidjs/web";
import type { SlotRender } from "@wsagency/radix2solid-primitives/slot";
import type { Element } from "solid-js";

export type ComponentPropsWithout<
  T extends ValidComponent,
  O extends string,
> = Omit<ComponentProps<T>, O>;
export type ComponentPropsAs<C extends ValidComponent, T extends string> = Omit<
  Extract<ComponentProps<C>, { as?: T; asChild?: false }>,
  "as" | "asChild"
>;
export type RemovedProps =
  | "asChild"
  | "defaultChecked"
  | "defaultValue"
  | "color";
export type ComposedProps<P> = P extends unknown
  ? Omit<P, "asChild" | "children"> &
      (
        | { asChild: true; children: SlotRender }
        | { asChild?: false; children?: Element }
      )
  : never;
