import { isServer } from "@solidjs/web";
// Native port of Radix Presence; upstream MIT, Copyright (c) 2022 WorkOS.
import {
  createEffect,
  createSignal,
  Show,
  untrack,
  type Accessor,
  type Element,
} from "solid-js";

export function createPresence(
  present: Accessor<boolean>,
  forceMount: Accessor<boolean> = () => false,
) {
  const [node, ref] = createSignal<HTMLElement | undefined>();
  const [retained, retain] = createSignal(untrack(present));
  let mountedAnimation = "none";
  if (!isServer) {
    createEffect(
      node,
      (element) => {
        if (!element) return;
        const view = element.ownerDocument.defaultView!;
        mountedAnimation = view.getComputedStyle(element).animationName;
        const start = (event: AnimationEvent) => {
          if (event.target === element && present())
            mountedAnimation = view.getComputedStyle(element).animationName;
        };
        element.addEventListener("animationstart", start);
        return () => {
          element.removeEventListener("animationstart", start);
        };
      },
      { transparent: true },
    );
    createEffect(
      () => [present(), node()] as const,
      ([visible, element]) => {
        if (visible) {
          retain(true);
          // An always-mounted hidden shell may have recorded its closed animation at registration.
          if (element)
            mountedAnimation =
              element.ownerDocument.defaultView!.getComputedStyle(
                element,
              ).animationName;
          return;
        }
        if (!element) {
          retain(false);
          return;
        }
        const view = element.ownerDocument.defaultView!;
        const styles = view.getComputedStyle(element);
        const animations = element
          .getAnimations()
          .filter((animation) => animation instanceof view.CSSAnimation);
        const exiting =
          styles.display !== "none" &&
          styles.animationName !== "none" &&
          styles.animationName !== mountedAnimation &&
          animations.length > 0;
        retain(exiting);
        if (!exiting) return;
        let current = true;
        const finish = () => {
          if (current) retain(false);
        };
        // A pending animation can cancel before animationstart without emitting DOM animationcancel.
        void Promise.race(
          animations.map((animation) => animation.finished),
        ).then(finish, finish);
        return () => {
          current = false;
        };
      },
      { transparent: true },
    );
  }
  return { ref, mounted: () => forceMount() || present() || retained() };
}

export function Presence(props: {
  present: boolean;
  children: (ref: (node: HTMLElement) => void) => Element;
}): Element {
  const presence = createPresence(() => props.present);
  function Mounted(): Element {
    return props.children(presence.ref);
  }
  return (
    <Show when={presence.mounted()}>
      <Mounted />
    </Show>
  );
}
