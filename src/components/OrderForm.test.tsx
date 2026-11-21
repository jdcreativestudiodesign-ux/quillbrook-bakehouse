import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OrderState } from "@/app/actions";

// Replace the server action with a stand-in, so these tests check only the form.
const requestOrder = vi.fn<(previous: OrderState, data: FormData) => Promise<OrderState>>();
vi.mock("@/app/actions", () => ({ requestOrder: (p: OrderState, d: FormData) => requestOrder(p, d) }));

const { OrderForm } = await import("./OrderForm");

async function fillAndSend() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Your name"), "Sam Okafor");
  await user.type(screen.getByLabelText("Email"), "sam@example.com");
  await user.type(screen.getByLabelText("Pick-up day"), "2026-12-05");
  await user.type(screen.getByLabelText("What would you like?"), "2 cinnamon buns");
  await user.click(screen.getByRole("button", { name: "Send my order" }));
}

describe("OrderForm", () => {
  it("gives every field a visible label", () => {
    render(<OrderForm />);
    for (const label of ["Your name", "Email", "Pick-up day", "What would you like?"]) {
      expect(screen.getByLabelText(label)).toBeRequired();
    }
  });

  it("limits the order box to 500 characters", () => {
    render(<OrderForm />);
    expect(screen.getByLabelText("What would you like?")).toHaveAttribute("maxlength", "500");
  });

  it("hides the spam trap from people and keyboard users", () => {
    render(<OrderForm />);
    const trap = document.getElementById("website") as HTMLInputElement;
    expect(trap).toHaveAttribute("tabindex", "-1");
    expect(trap.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("sends the form and shows the confirmation", async () => {
    requestOrder.mockResolvedValueOnce({
      status: "success",
      message: "Thanks, Sam Okafor. Your order will be boxed and waiting.",
      errors: {},
      values: {},
    });
    render(<OrderForm />);
    await fillAndSend();

    expect(await screen.findByRole("status")).toHaveTextContent("Thanks, Sam Okafor.");
    expect(Object.fromEntries(requestOrder.mock.calls[0][1])).toMatchObject({
      name: "Sam Okafor",
      email: "sam@example.com",
      day: "2026-12-05",
      items: "2 cinnamon buns",
      website: "",
    });
  });

  it("shows each error next to its field and keeps what was typed", async () => {
    requestOrder.mockResolvedValueOnce({
      status: "error",
      message: "Please check the highlighted fields.",
      errors: { day: "We're closed on Mondays and Tuesdays. Please choose Wednesday to Sunday." },
      values: { name: "Sam Okafor", email: "sam@example.com", day: "2026-12-07", items: "2 cinnamon buns" },
    });
    render(<OrderForm />);
    await fillAndSend();

    const day = await screen.findByLabelText("Pick-up day");
    expect(await screen.findByText(/closed on Mondays and Tuesdays/)).toHaveAttribute("id", "day-error");
    expect(day).toHaveAttribute("aria-invalid", "true");
    expect(day).toHaveAttribute("aria-describedby", "day-error");
    expect(day).toHaveValue("2026-12-07");
    expect(screen.getByLabelText("What would you like?")).toHaveValue("2 cinnamon buns");
    expect(screen.getByLabelText("Your name")).not.toHaveAttribute("aria-invalid");
    expect(screen.getByRole("status")).toHaveTextContent("Please check the highlighted fields.");
  });
});
