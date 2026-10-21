export type Point = { x: number; y: number };
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!,
      b = polygon[j]!;
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}
export function pointerGrace(
  event: PointerEvent,
  from: HTMLElement,
  to: HTMLElement,
): Point[] {
  const { clientX: x, clientY: y } = event;
  const rect = from.getBoundingClientRect();
  const left = Math.abs(rect.left - x),
    right = Math.abs(rect.right - x),
    top = Math.abs(rect.top - y),
    bottom = Math.abs(rect.bottom - y);
  const minimum = Math.min(left, right, top, bottom);
  const exit =
    minimum === left
      ? [
          { x: x + 5, y: y - 5 },
          { x: x + 5, y: y + 5 },
        ]
      : minimum === right
        ? [
            { x: x - 5, y: y - 5 },
            { x: x - 5, y: y + 5 },
          ]
        : minimum === top
          ? [
              { x: x - 5, y: y + 5 },
              { x: x + 5, y: y + 5 },
            ]
          : [
              { x: x - 5, y: y - 5 },
              { x: x + 5, y: y - 5 },
            ];
  const target = to.getBoundingClientRect();
  exit.push(
    { x: target.left, y: target.top },
    { x: target.right, y: target.top },
    { x: target.right, y: target.bottom },
    { x: target.left, y: target.bottom },
  );
  exit.sort((a, b) => a.x - b.x || a.y - b.y);
  const upper: Point[] = [],
    lower: Point[] = [];
  const append = (hull: Point[], p: Point) => {
    while (hull.length >= 2) {
      const q = hull.at(-1)!,
        r = hull.at(-2)!;
      if ((q.x - r.x) * (p.y - r.y) < (q.y - r.y) * (p.x - r.x)) break;
      hull.pop();
    }
    hull.push(p);
  };
  for (const point of exit) append(upper, point);
  for (let i = exit.length - 1; i >= 0; i--) append(lower, exit[i]!);
  upper.pop();
  lower.pop();
  if (
    upper.length === 1 &&
    lower.length === 1 &&
    upper[0]!.x === lower[0]!.x &&
    upper[0]!.y === lower[0]!.y
  )
    return upper;
  upper.push(...lower);
  return upper;
}
