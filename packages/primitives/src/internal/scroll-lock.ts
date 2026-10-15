import { composedContains } from "./focus-scope.js";

/** One acquisition per document registry, released only after its last modal closes. */
export function lockScroll(
  document: Document,
  allowed: () => HTMLElement[],
): () => void {
  const body = document.body;
  const view = document.defaultView!;
  const overflow = body.style.overflow;
  const padding = body.style.paddingRight;
  const gap = Math.max(
    0,
    view.innerWidth - document.documentElement.clientWidth,
  );
  if (gap)
    body.style.paddingRight = `${parseFloat(view.getComputedStyle(body).paddingRight || "0") + gap}px`;
  body.style.overflow = "hidden";
  let previous: { id: number; x: number; y: number } | undefined;
  function canScroll(event: Event, dx: number, dy: number) {
    const roots = allowed();
    const path = event.composedPath();
    const target = path[0] as Node | undefined;
    if (!target || !roots.some((root) => composedContains(root, target)))
      return false;
    const vertical = Math.abs(dy) >= Math.abs(dx);
    const delta = vertical ? dy : dx;
    if (!delta) return true;
    for (const candidate of path) {
      if (!(candidate instanceof view.HTMLElement)) continue;
      if (
        candidate === body ||
        candidate === document.documentElement ||
        !roots.some((root) => composedContains(root, candidate))
      )
        break;
      const style = view.getComputedStyle(candidate);
      const overflow = vertical ? style.overflowY : style.overflowX;
      const position = vertical ? candidate.scrollTop : candidate.scrollLeft;
      const extent = vertical
        ? candidate.scrollHeight - candidate.clientHeight
        : candidate.scrollWidth - candidate.clientWidth;
      if (
        /auto|scroll|overlay/.test(overflow) &&
        extent > 0 &&
        (delta > 0 ? position < extent - 1 : position > 0)
      )
        return true;
    }
    return false;
  }
  const wheel = (event: WheelEvent) => {
    if (!event.ctrlKey && !canScroll(event, event.deltaX, event.deltaY))
      event.preventDefault();
  };
  const start = (event: TouchEvent) => {
    const touch = event.touches.length === 1 ? event.touches[0] : undefined;
    previous = touch
      ? { id: touch.identifier, x: touch.clientX, y: touch.clientY }
      : undefined;
  };
  const move = (event: TouchEvent) => {
    if (!previous || event.touches.length !== 1) return;
    const touch = event.touches[0]!;
    if (touch.identifier !== previous.id) return;
    if (
      !canScroll(event, previous.x - touch.clientX, previous.y - touch.clientY)
    )
      event.preventDefault();
    previous = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
  };
  document.addEventListener("wheel", wheel, { passive: false, capture: true });
  document.addEventListener("touchstart", start, {
    passive: true,
    capture: true,
  });
  document.addEventListener("touchmove", move, {
    passive: false,
    capture: true,
  });
  return () => {
    document.removeEventListener("wheel", wheel, true);
    document.removeEventListener("touchstart", start, true);
    document.removeEventListener("touchmove", move, true);
    body.style.overflow = overflow;
    body.style.paddingRight = padding;
  };
}
