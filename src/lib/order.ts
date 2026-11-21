// Order-ahead rules. Pure functions with no network or clock access,
// so every rule can be tested with a fixed "today".

import { BAKERY, OPEN_DAYS } from "./bakery";

export type OrderField = "name" | "email" | "day" | "items";

export type OrderInput = Record<OrderField, string> & {
  // Hidden "website" field. People never see it; simple spam bots fill it in.
  website: string;
};

export type FieldErrors = Partial<Record<OrderField, string>>;

export type Order = {
  name: string;
  email: string;
  day: string; // YYYY-MM-DD
  items: string;
};

export type ValidationResult =
  | { ok: true; order: Order }
  | { ok: false; spam: boolean; errors: FieldErrors };

export const ITEMS_MIN = 3;
export const ITEMS_MAX = 500;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Today's date in the bakery's time zone, as YYYY-MM-DD. */
export function todayIn(timeZone: string, now: Date): string {
  // The en-CA locale formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Parses YYYY-MM-DD into a UTC timestamp, or null if it is not a real date. */
export function parseDay(value: string): number | null {
  const match = DAY_PATTERN.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const time = Date.UTC(year, month - 1, day);
  const check = new Date(time);
  // Rejects dates such as 2026-02-30, which Date.UTC would roll into March.
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return time;
}

/** "Saturday 5 December" for a YYYY-MM-DD date. */
export function formatDay(value: string): string {
  const time = parseDay(value);
  if (time === null) return value;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(time));
}

function checkDay(day: string, today: string): string | undefined {
  if (day === "") return "Please choose a pick-up day.";
  const chosen = parseDay(day);
  const start = parseDay(today);
  if (chosen === null || start === null) return "Please choose a real date.";
  const daysAhead = Math.round((chosen - start) / MS_PER_DAY);
  if (daysAhead < 0) return "That day has already passed. Please choose another.";
  if (daysAhead > BAKERY.orderWindowDays) {
    return `We take orders up to ${BAKERY.orderWindowDays} days ahead. Please choose an earlier day.`;
  }
  const weekday = new Date(chosen).getUTCDay();
  if (!(OPEN_DAYS as readonly number[]).includes(weekday)) {
    return "We're closed on Mondays and Tuesdays. Please choose Wednesday to Sunday.";
  }
  return undefined;
}

/**
 * Checks an order-ahead request. `today` is the bakery's date (YYYY-MM-DD),
 * passed in so tests can fix it.
 */
export function validateOrder(input: OrderInput, today: string): ValidationResult {
  if (input.website.trim() !== "") {
    return { ok: false, spam: true, errors: {} };
  }

  const name = input.name.trim();
  const email = input.email.trim();
  const items = input.items.trim();
  const errors: FieldErrors = {};

  if (name.length < 2) errors.name = "Please tell us your name.";
  else if (name.length > 80) errors.name = "Please keep your name under 80 characters.";

  if (email === "") errors.email = "Please add your email so we can confirm.";
  else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.email = "That email doesn't look right. Please check it.";
  }

  const dayError = checkDay(input.day, today);
  if (dayError) errors.day = dayError;

  if (items.length < ITEMS_MIN) errors.items = "Please tell us what you'd like.";
  else if (items.length > ITEMS_MAX) {
    errors.items = `Please keep your order under ${ITEMS_MAX} characters, or call us for large orders.`;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, spam: false, errors };
  }

  return { ok: true, order: { name, email, day: input.day, items } };
}
