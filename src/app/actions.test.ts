import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestOrder, type OrderState } from "./actions";

const idle: OrderState = { status: "idle", message: "", errors: {}, values: {} };

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const good = {
  name: "Sam Okafor",
  email: "sam@example.com",
  day: "2026-12-05", // Saturday
  items: "1 country sourdough",
  website: "",
};

describe("requestOrder (server action)", () => {
  beforeEach(() => {
    // 15:00 UTC on Wednesday 2 December 2026 is 10:00 in New York.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-02T15:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("confirms a good order in plain English", async () => {
    const state = await requestOrder(idle, form(good));
    expect(state).toEqual({
      status: "success",
      message:
        "Thanks, Sam Okafor. Your order will be boxed and waiting on Saturday 5 December. We'll confirm by email, and you pay when you collect.",
      errors: {},
      values: {},
    });
  });

  it("returns field errors and keeps what the visitor typed", async () => {
    const state = await requestOrder(idle, form({ ...good, email: "nope", day: "2026-12-07" }));
    expect(state.status).toBe("error");
    expect(state.errors).toEqual({
      email: "That email doesn't look right. Please check it.",
      day: "We're closed on Mondays and Tuesdays. Please choose Wednesday to Sunday.",
    });
    expect(state.values).toEqual({
      name: "Sam Okafor",
      email: "nope",
      day: "2026-12-07",
      items: "1 country sourdough",
    });
  });

  it("uses the bakery's date, so late-evening New York orders for today still work", async () => {
    // 03:00 UTC on Thursday 3 December is still Wednesday evening in New York.
    vi.setSystemTime(new Date("2026-12-03T03:00:00Z"));
    const state = await requestOrder(idle, form({ ...good, day: "2026-12-02" }));
    expect(state.status).toBe("success");
  });

  it("treats missing fields as empty rather than crashing", async () => {
    const state = await requestOrder(idle, new FormData());
    expect(state.status).toBe("error");
    expect(Object.keys(state.errors).sort()).toEqual(["day", "email", "items", "name"]);
  });

  it("answers bots politely but never echoes their data back", async () => {
    const state = await requestOrder(idle, form({ ...good, website: "spam" }));
    expect(state).toEqual({ status: "success", message: "Thanks, we've received your order.", errors: {}, values: {} });
  });
});
