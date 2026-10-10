import { merge, omit, type Element } from 'solid-js';
import { Portal as NativePortal } from '@solidjs/web';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';

export type PortalProps = PrimitiveProps<'div'> & { container?: globalThis.Element | DocumentFragment | null };
export function Portal(props: PortalProps): Element {
  // Native Portal already defers children until hydration settles and renders nothing on the server.
  // DocumentFragment/ShadowRoot use the same append/remove API; the renderer's declaration is narrower.
  const nativeProps = merge({ get mount() { return props.container ?? undefined; } }, {
    get children() { return <Primitive as="div" {...omit(props, 'container')} />; }
  }) as Parameters<typeof NativePortal>[0];
  return <NativePortal {...nativeProps} />;
}
