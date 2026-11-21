"use client";

import { useActionState } from "react";
import { requestOrder, type OrderState } from "@/app/actions";
import { ITEMS_MAX, type OrderField } from "@/lib/order";

const initialState: OrderState = { status: "idle", message: "", errors: {}, values: {} };

function errorProps(state: OrderState, field: OrderField) {
  const error = state.errors[field];
  return error
    ? { "aria-invalid": true as const, "aria-describedby": `${field}-error` }
    : {};
}

function FieldError({ state, field }: { state: OrderState; field: OrderField }) {
  const error = state.errors[field];
  if (!error) return null;
  return (
    <p id={`${field}-error`} className="field-error">
      {error}
    </p>
  );
}

export function OrderForm() {
  const [state, formAction, pending] = useActionState(requestOrder, initialState);
  const values = state.values;

  return (
    <form action={formAction} className="order-form" aria-label="Order ahead">
      <div className="field">
        <label htmlFor="name">Your name</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={80}
          defaultValue={values.name ?? ""}
          {...errorProps(state, "name")}
        />
        <FieldError state={state} field="name" />
      </div>

      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          defaultValue={values.email ?? ""}
          {...errorProps(state, "email")}
        />
        <FieldError state={state} field="email" />
      </div>

      <div className="field field-wide">
        <label htmlFor="day">Pick-up day</label>
        <input
          id="day"
          name="day"
          type="date"
          required
          defaultValue={values.day ?? ""}
          {...errorProps(state, "day")}
        />
        <FieldError state={state} field="day" />
      </div>

      <div className="field field-wide">
        <label htmlFor="items">What would you like?</label>
        <textarea
          id="items"
          name="items"
          rows={4}
          required
          maxLength={ITEMS_MAX}
          defaultValue={values.items ?? ""}
          {...errorProps(state, "items")}
        />
        <FieldError state={state} field="items" />
      </div>

      {/* Hidden from people and screen readers; only bots fill it in. */}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" className="button button-primary field-wide" disabled={pending}>
        {pending ? "Sending..." : "Send my order"}
      </button>

      <p role="status" className={`form-status form-status-${state.status} field-wide`}>
        {state.message}
      </p>
    </form>
  );
}
