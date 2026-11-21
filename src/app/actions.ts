"use server";

import { BAKERY } from "@/lib/bakery";
import { formatDay, todayIn, validateOrder, type FieldErrors, type OrderInput } from "@/lib/order";

export type OrderState = {
  status: "idle" | "error" | "success";
  message: string;
  errors: FieldErrors;
  // Sent back after an error so the form keeps what the visitor typed.
  values: Partial<OrderInput>;
};

function readForm(formData: FormData): OrderInput {
  const read = (key: keyof OrderInput) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  return {
    name: read("name"),
    email: read("email"),
    day: read("day"),
    items: read("items"),
    website: read("website"),
  };
}

export async function requestOrder(_previous: OrderState, formData: FormData): Promise<OrderState> {
  const input = readForm(formData);
  const today = todayIn(BAKERY.timeZone, new Date());
  const result = validateOrder(input, today);

  if (!result.ok && result.spam) {
    // Looks like a bot: answer as if all went well, but do nothing.
    return { status: "success", message: "Thanks, we've received your order.", errors: {}, values: {} };
  }

  if (!result.ok) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      errors: result.errors,
      // The hidden spam field is never sent back.
      values: { name: input.name, email: input.email, day: input.day, items: input.items },
    };
  }

  // Demo site: a real project would send this to the bakery's email or
  // order system here. Nothing is stored or sent.
  const { order } = result;
  return {
    status: "success",
    message: `Thanks, ${order.name}. Your order will be boxed and waiting on ${formatDay(order.day)}. We'll confirm by email, and you pay when you collect.`,
    errors: {},
    values: {},
  };
}
