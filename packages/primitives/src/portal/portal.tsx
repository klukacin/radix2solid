import { Portal as NativePortal } from "@solidjs/web";
import { merge, omit, type Element } from "solid-js";

import { Primitive, type PrimitiveProps } from "../internal/primitive.js";

export type PortalProps = PrimitiveProps<"div"> & {
  container?: globalThis.Element | DocumentFragment | null;
};
export function Portal(props: PortalProps): Element {
  // Native Portal already defers children until hydration settles and renders nothing on the server.
  // DocumentFragment/ShadowRoot use the same append/remove API; the renderer's declaration is narrower.
  const forwarded = omit(props, "container");
  const nativeProps = merge(
    {
      get mount() {
        return props.container ?? undefined;
      },
    },
    {
      get children() {
        return (
          <Primitive
            as="div"
            {...forwarded}
          />
        );
      },
    },
  ) as Parameters<typeof NativePortal>[0];
  return <NativePortal {...nativeProps} />;
}
