import { describe, expect, it } from "vitest";
import { formatDay, parseDay, todayIn, validateOrder, type OrderInput } from "./order";

// Fixed "today" so the tests never depend on the real date.
// 2 December 2026 is a Wednesday.
const TODAY = "2026-12-02";

function input(overrides: Partial<OrderInput> = {}): OrderInput {
  return {
    name: "Sam Okafor",
    email: "sam@example.com",
    day: "2026-12-05", // Saturday
    items: "1 country sourdough, 4 butter croissants",
    website: "",
    ...overrides,
  };
}

function errorsFor(overrides: Partial<OrderInput>) {
  const result = validateOrder(input(overrides), TODAY);
  if (result.ok) throw new Error("Expected the order to be rejected");
  return result.errors;
}

describe("validateOrder: a good order", () => {
  it("accepts a complete order and tidies the text", () => {
    const result = validateOrder(
      input({ name: " Sam Okafor ", email: " sam@example.com ", items: "  2 cinnamon buns \n" }),
      TODAY,
    );
    expect(result).toEqual({
      ok: true,
      order: { name: "Sam Okafor", email: "sam@example.com", day: "2026-12-05", items: "2 cinnamon buns" },
    });
  });

  it("accepts pick-up today, when the bakery is open today", () => {
    expect(validateOrder(input({ day: TODAY }), TODAY).ok).toBe(true);
  });

  it("accepts the last day of the 14-day window", () => {
    // 16 December 2026 is a Wednesday, exactly 14 days ahead.
    expect(validateOrder(input({ day: "2026-12-16" }), TODAY).ok).toBe(true);
  });

  it("accepts Sunday pick-up", () => {
    expect(validateOrder(input({ day: "2026-12-06" }), TODAY).ok).toBe(true);
  });
});

describe("validateOrder: name and email", () => {
  it("asks for a name when it is blank or one letter", () => {
    expect(errorsFor({ name: "  " }).name).toBe("Please tell us your name.");
    expect(errorsFor({ name: "S" }).name).toBe("Please tell us your name.");
  });

  it("rejects a name over 80 characters", () => {
    expect(errorsFor({ name: "S".repeat(81) }).name).toMatch(/under 80/);
    expect(validateOrder(input({ name: "S".repeat(80) }), TODAY).ok).toBe(true);
  });

  it("asks for an email when it is blank", () => {
    expect(errorsFor({ email: "" }).email).toBe("Please add your email so we can confirm.");
  });

  it.each(["sam", "sam@", "sam@example", "sam @example.com", "@example.com"])(
    "rejects the badly formed email %j",
    (email) => {
      expect(errorsFor({ email }).email).toMatch(/doesn't look right/);
    },
  );
});

describe("validateOrder: what they'd like", () => {
  it("asks what they'd like when the box is empty or too short", () => {
    expect(errorsFor({ items: "   " }).items).toBe("Please tell us what you'd like.");
    expect(errorsFor({ items: "ok" }).items).toBe("Please tell us what you'd like.");
    expect(validateOrder(input({ items: "bun" }), TODAY).ok).toBe(true);
  });

  it("rejects an order over 500 characters, but not one of exactly 500", () => {
    expect(errorsFor({ items: "x".repeat(501) }).items).toMatch(/under 500 characters/);
    expect(validateOrder(input({ items: "x".repeat(500) }), TODAY).ok).toBe(true);
  });
});

describe("validateOrder: the pick-up day", () => {
  it("asks for a day when none is chosen", () => {
    expect(errorsFor({ day: "" }).day).toBe("Please choose a pick-up day.");
  });

  it.each(["2026-02-30", "2026-13-01", "05/12/2026", "saturday"])("rejects %j as not a real date", (day) => {
    expect(errorsFor({ day }).day).toBe("Please choose a real date.");
  });

  it("rejects yesterday, the closest day in the past", () => {
    expect(errorsFor({ day: "2026-12-01" }).day).toMatch(/already passed/);
  });

  it("rejects a day beyond the 14-day window", () => {
    // 17 December 2026 is a Thursday, 15 days ahead.
    expect(errorsFor({ day: "2026-12-17" }).day).toMatch(/up to 14 days ahead/);
  });

  it.each([
    ["Monday", "2026-12-07"],
    ["Tuesday", "2026-12-08"],
  ])("rejects %s, when the bakery is closed", (_weekday, day) => {
    expect(errorsFor({ day }).day).toMatch(/closed on Mondays and Tuesdays/);
  });

  it("reports every problem at once", () => {
    const errors = errorsFor({ name: "", email: "x", day: "", items: "" });
    expect(Object.keys(errors).sort()).toEqual(["day", "email", "items", "name"]);
  });
});

describe("validateOrder: spam", () => {
  it("flags the order as spam when the hidden field is filled in", () => {
    expect(validateOrder(input({ website: "https://spam.example" }), TODAY)).toEqual({
      ok: false,
      spam: true,
      errors: {},
    });
  });
});

describe("date helpers", () => {
  it("works out today's date in the bakery's time zone, not the server's", () => {
    // 03:00 UTC on 3 December is still 2 December in New York.
    const now = new Date("2026-12-03T03:00:00Z");
    expect(todayIn("America/New_York", now)).toBe("2026-12-02");
    expect(todayIn("Asia/Taipei", now)).toBe("2026-12-03");
  });

  it("parses real dates and rejects impossible ones", () => {
    expect(parseDay("2028-02-29")).toBe(Date.UTC(2028, 1, 29)); // leap year
    expect(parseDay("2027-02-29")).toBeNull();
  });

  it("formats a day in plain English", () => {
    expect(formatDay("2026-12-05")).toBe("Saturday 5 December");
  });
});
