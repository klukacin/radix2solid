export type DateValue = string;
export type MonthValue = string;

const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const monthPattern = /^(\d{4})-(\d{2})$/;
const lastOrdinal = daysBeforeYear(10_000) - 1;

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

function daysBeforeYear(year: number): number {
  const previous = year - 1;
  return (
    previous * 365 +
    Math.floor(previous / 4) -
    Math.floor(previous / 100) +
    Math.floor(previous / 400)
  );
}

function daysBeforeMonth(year: number, month: number): number {
  let days = 0;
  for (let current = 1; current < month; current++)
    days += daysInMonth(year, current);
  return days;
}

function dateOrdinal(year: number, month: number, day: number): number {
  return daysBeforeYear(year) + daysBeforeMonth(year, month) + day - 1;
}

function ordinalDate(ordinal: number): DateValue {
  let low = 1,
    high = 10_000;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (daysBeforeYear(middle) <= ordinal) low = middle;
    else high = middle;
  }
  const year = low;
  let remaining = ordinal - daysBeforeYear(year),
    month = 1;
  while (remaining >= daysInMonth(year, month))
    remaining -= daysInMonth(year, month++);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(remaining + 1).padStart(2, "0")}`;
}

function integer(value: number, operation: string): void {
  if (!Number.isSafeInteger(value))
    throw new RangeError(`Calendar: ${operation} must be a safe integer.`);
}

export function assertDate(value: string): asserts value is DateValue {
  const match = datePattern.exec(value);
  if (!match)
    throw new RangeError("Calendar: expected a canonical YYYY-MM-DD date.");
  const year = Number(match[1]),
    month = Number(match[2]),
    day = Number(match[3]);
  if (
    year < 1 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month)
  ) {
    throw new RangeError(
      "Calendar: date is outside the Gregorian date domain.",
    );
  }
}

export function assertMonth(value: string): asserts value is MonthValue {
  const match = monthPattern.exec(value);
  if (!match)
    throw new RangeError("Calendar: expected a canonical YYYY-MM month.");
  const year = Number(match[1]),
    month = Number(match[2]);
  if (year < 1 || year > 9999 || month < 1 || month > 12) {
    throw new RangeError(
      "Calendar: month is outside the Gregorian date domain.",
    );
  }
}

export function addDays(date: DateValue, days: number): DateValue {
  assertDate(date);
  integer(days, "day movement");
  const [year, month, day] = date.split("-").map(Number);
  const ordinal = Math.max(
    0,
    Math.min(lastOrdinal, dateOrdinal(year!, month!, day!) + days),
  );
  return ordinalDate(ordinal);
}

export function addMonths(date: DateValue, months: number): DateValue {
  assertDate(date);
  integer(months, "month movement");
  const [year, month, day] = date.split("-").map(Number);
  const monthIndex = (year! - 1) * 12 + month! - 1;
  const boundedIndex = Math.max(
    0,
    Math.min(9999 * 12 - 1, monthIndex + months),
  );
  const nextYear = Math.floor(boundedIndex / 12) + 1;
  const nextMonth = (boundedIndex % 12) + 1;
  const nextDay = Math.min(day!, daysInMonth(nextYear, nextMonth));
  return `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
}

export function monthOf(date: DateValue): MonthValue {
  assertDate(date);
  return date.slice(0, 7);
}

export function monthGrid(
  month: MonthValue,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6,
): readonly (DateValue | null)[] {
  assertMonth(month);
  if (!Number.isInteger(weekStartsOn) || weekStartsOn < 0 || weekStartsOn > 6)
    throw new RangeError(
      "Calendar: weekStartsOn must be a weekday from 0 through 6.",
    );
  const [year, monthNumber] = month.split("-").map(Number);
  const firstOrdinal =
    daysBeforeYear(year!) + daysBeforeMonth(year!, monthNumber!);
  const firstWeekday = (firstOrdinal + 1) % 7;
  const start = firstOrdinal - ((firstWeekday - weekStartsOn + 7) % 7);
  const days: (DateValue | null)[] = [];
  for (let index = 0; index < 42; index++) {
    const ordinal = start + index;
    days.push(
      ordinal < 0 || ordinal > lastOrdinal ? null : ordinalDate(ordinal),
    );
  }
  return days;
}

export function weekdayOf(date: DateValue): number {
  assertDate(date);
  const [year, month, day] = date.split("-").map(Number);
  const previous = year! - 1;
  let ordinal =
    previous * 365 +
    Math.floor(previous / 4) -
    Math.floor(previous / 100) +
    Math.floor(previous / 400) +
    day! -
    1;
  for (let current = 1; current < month!; current++)
    ordinal += daysInMonth(year!, current);
  return (ordinal + 1) % 7;
}
