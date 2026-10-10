import { createEffect, createSignal, onCleanup, type Element } from 'solid-js';
import { isServer, type ComponentProps } from '@solidjs/web';
import { useThemeContext } from '../theme.js';

/** Resolve responsive, scaled menu padding from the same CSS that renders it. */
export function createMenuAlignOffset(getClass: () => unknown) {
  const theme = useThemeContext();
  const [viewport, setViewport] = createSignal<HTMLDivElement>();
  const [offset, setOffset] = createSignal(0);
  if (!isServer) createEffect(() => [viewport(), getClass(), theme.scaling] as const, ([node]) => {
    const view = node?.ownerDocument.defaultView;
    if (!node || !view) return;
    let frame = 0;
    const update = () => {
      if (!frame) frame = view.requestAnimationFrame(() => {
        frame = 0;
        setOffset(-Number.parseFloat(view.getComputedStyle(node).paddingTop));
      });
    };
    update();
    view.addEventListener('resize', update);
    return () => { view.cancelAnimationFrame(frame); view.removeEventListener('resize', update); };
  }, { transparent: true });
  function Viewport(props: ComponentProps<'div'>): Element {
    if (!isServer) onCleanup(() => setViewport(undefined));
    return <div {...props} ref={setViewport} />;
  }
  return { Viewport, offset };
}
