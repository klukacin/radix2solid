import assert from "node:assert/strict";
import { test } from "node:test";

import {
  addDays,
  addMonths,
  assertDate,
  assertMonth,
  monthGrid,
  monthOf,
} from "../packages/primitives/src/calendar/date.ts";

test("bounded Gregorian month movement clamps leap days and month ends", () => {
  assert.equal(addMonths("2024-01-31", 1), "2024-02-29");
  assert.equal(addMonths("2024-02-29", 12), "2025-02-28");
  // Clamp an out-of-domain target month to the boundary month first; then preserve/clamp the day within that month.
  assert.equal(addMonths("0001-01-31", -1), "0001-01-31");
  assert.equal(addMonths("9999-12-31", 1), "9999-12-31");
  assert.equal(addDays("0001-01-01", -1), "0001-01-01");
  assert.equal(addDays("9999-12-31", 1), "9999-12-31");
});

test("canonical date and month validation accepts domain edges and rejects impossible values", () => {
  assertDate("0001-01-01");
  assertDate("0099-12-31");
  assertDate("9999-12-31");
  assertMonth("0001-01");
  assertMonth("0099-12");
  assertMonth("9999-12");
  assertDate("1900-02-28");
  assert.throws(() => assertDate("1900-02-29"));
  assertDate("2000-02-29");
  assert.equal(addDays("1900-02-28", 1), "1900-03-01");
  assert.equal(addDays("2000-02-28", 1), "2000-02-29");
  assert.equal(addMonths("1900-01-31", 1), "1900-02-28");
  assert.equal(addMonths("2000-01-31", 1), "2000-02-29");
  for (const value of [
    "0000-01-01",
    "2026-02-30",
    "2024-2-01",
    "2024-01-01T00:00:00Z",
  ]) {
    assert.throws(() => assertDate(value));
  }
  for (const value of ["0000-01", "2026-13", "2026-2"])
    assert.throws(() => assertMonth(value));
  assert.equal(monthOf("0099-12-31"), "0099-12");
});

test("six-week grid has exactly 42 positions and pads the supported-domain edges", () => {
  const leapFebruary = monthGrid("2024-02", 0);
  assert.equal(leapFebruary.length, 42);
  assert.equal(leapFebruary[0], "2024-01-28");
  assert.equal(leapFebruary[4], "2024-02-01");
  assert.equal(leapFebruary[32], "2024-02-29");
  assert.equal(leapFebruary[41], "2024-03-09");

  for (const edge of [monthGrid("0001-01", 0), monthGrid("9999-12", 0)]) {
    assert.equal(edge.length, 42);
    assert.ok(
      edge.includes(null),
      "dates outside years 0001–9999 are represented by null padding",
    );
    assert.ok(
      edge
        .filter((date: string | null): date is string => date !== null)
        .every((date: string) => date >= "0001-01-01" && date <= "9999-12-31"),
    );
  }
});

test("week start changes only the six-week grid alignment", () => {
  const sunday = monthGrid("2026-10", 0);
  const monday = monthGrid("2026-10", 1);
  assert.equal(sunday.length, 42);
  assert.equal(monday.length, 42);
  assert.equal(sunday[0], "2026-09-27");
  assert.equal(monday[0], "2026-09-28");
  assert.equal(sunday[1], monday[0]);
});
