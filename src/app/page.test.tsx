import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BAKES } from "@/lib/bakery";
import { PHOTOS } from "@/lib/photos";
import Home from "./page";

describe("Home page", () => {
  it("says clearly that this is a demo for an invented business", () => {
    render(<Home />);
    expect(screen.getByText(/Portfolio sample: an invented business/)).toBeInTheDocument();
  });

  it("has one main heading and a heading for each section", () => {
    render(<Home />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    for (const name of ["Today's bakes", "Small batches, on purpose", "Order ahead"]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
    }
  });

  it("lists every bake with its price and its photo", () => {
    render(<Home />);
    const list = screen.getByRole("list");
    for (const bake of BAKES) {
      const item = within(list).getByRole("heading", { name: bake.name }).closest("li") as HTMLElement;
      expect(item).not.toBeNull();
      expect(within(item).getByText(bake.price)).toBeInTheDocument();
      expect(within(item).getByRole("img", { name: PHOTOS[bake.photo].alt })).toBeInTheDocument();
    }
  });

  it("links the calls to action to the order form and the bakes", () => {
    render(<Home />);
    const main = screen.getByRole("main");
    expect(within(main).getByRole("link", { name: "Order ahead" })).toHaveAttribute("href", "#order");
    expect(within(main).getByRole("link", { name: "See today's bakes" })).toHaveAttribute("href", "#bakes");
    expect(document.getElementById("order")).not.toBeNull();
    expect(document.getElementById("bakes")).not.toBeNull();
  });

  it("shows the hero and story photos with real descriptions", () => {
    render(<Home />);
    expect(screen.getByRole("img", { name: PHOTOS["bakery-hero"].alt })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: PHOTOS["bakery-story"].alt })).toBeInTheDocument();
  });

  it("offers a skip link to the main content", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });
});
