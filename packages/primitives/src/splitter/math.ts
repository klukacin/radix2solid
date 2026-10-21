export type SplitterBounds = { min: number; max: number };

export function constrainPanels(
  available: number,
  requested: number,
  primary: SplitterBounds,
  secondary: SplitterBounds,
) {
  const min = Math.max(0, primary.min, available - secondary.max);
  const max = Math.min(available, primary.max, available - secondary.min);
  if (min <= max) {
    const size = Math.max(min, Math.min(max, requested));
    return {
      primary: size,
      secondary: available - size,
      min,
      max,
      state: "satisfied" as const,
    };
  }
  const size = Math.max(primary.min, Math.min(primary.max, requested));
  const rest = Math.max(
    secondary.min,
    Math.min(secondary.max, Math.max(0, available - size)),
  );
  return {
    primary: size,
    secondary: rest,
    min: primary.min,
    max: Number.isFinite(primary.max)
      ? primary.max
      : Math.max(available, size, primary.min),
    state:
      size + rest > available ? ("overflow" as const) : ("underflow" as const),
  };
}

export function validateNumber(
  value: number,
  unit: "%" | "px",
  name: string,
  positive = false,
) {
  if (
    !Number.isFinite(value) ||
    (positive ? value <= 0 : value < 0) ||
    (unit === "%" && value > 100)
  )
    throw new RangeError(
      `Splitter ${name} must be finite, ${positive ? "positive" : "nonnegative"}${unit === "%" ? " and at most 100" : ""}.`,
    );
  return value;
}

export function validateParts(parts: readonly string[]) {
  if (
    parts.length !== 3 ||
    parts[0] !== "primary" ||
    parts[1] !== "handle" ||
    parts[2] !== "secondary"
  )
    throw new Error(
      "Splitter requires exactly primary Panel, Handle, secondary Panel in that order.",
    );
}
