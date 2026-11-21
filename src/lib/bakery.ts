// Business details for the demo bakery. Everything here is invented.

import type { PHOTOS } from "./photos";

type PhotoKey = keyof typeof PHOTOS;

export const BAKERY = {
  name: "Quillbrook Bakehouse",
  // The bakery's own time zone decides what "today" means for orders.
  timeZone: "America/New_York",
  // How far ahead people can order, in days.
  orderWindowDays: 14,
} as const;

export type Bake = {
  id: string;
  name: string;
  description: string;
  price: string;
  photo: PhotoKey;
};

export const BAKES: readonly Bake[] = [
  {
    id: "sourdough",
    name: "Country sourdough",
    description: "Two-day ferment, crackly crust.",
    price: "$9",
    photo: "bake-sourdough",
  },
  {
    id: "croissant",
    name: "Butter croissant",
    description: "Laminated by hand, baked at dawn.",
    price: "$4",
    photo: "bake-croissant",
  },
  {
    id: "cinnamon-bun",
    name: "Cinnamon bun",
    description: "Soft, sticky, a little too big.",
    price: "$5",
    photo: "bake-cinnamon-bun",
  },
  {
    id: "fruit-tart",
    name: "Seasonal fruit tart",
    description: "Whatever is ripe this week.",
    price: "$6",
    photo: "bake-fruit-tart",
  },
];

// Day numbers follow JavaScript: 0 is Sunday, 6 is Saturday.
export const OPEN_DAYS = [0, 3, 4, 5, 6] as const;

export const HOURS = ["Wednesday to Sunday, 7:00 to 15:00", "Monday and Tuesday, closed"] as const;
