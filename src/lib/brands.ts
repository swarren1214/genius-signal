import type { Brand } from "@/lib/types";

export const defaultBrands: Brand[] = [
  {
    id: "genius",
    name: "Global Payments Genius",
    isOwnBrand: true,
    newsSearchTerms: ["Global Payments Genius", "Genius POS"],
  },
  { id: "toast", name: "Toast", newsSearchTerms: ["Toast POS", "Toast Inc"] },
  {
    id: "square",
    name: "Square for Restaurants",
    newsSearchTerms: ["Square for Restaurants", "Block restaurant"],
  },
  {
    id: "clover",
    name: "Clover",
    newsSearchTerms: ["Clover POS", "Clover Network"],
  },
  { id: "touchbistro", name: "TouchBistro", newsSearchTerms: ["TouchBistro"] },
  {
    id: "lightspeed",
    name: "Lightspeed Restaurant",
    newsSearchTerms: ["Lightspeed Restaurant"],
  },
  {
    id: "spoton",
    name: "SpotOn",
    newsSearchTerms: ["SpotOn restaurant", "SpotOn POS"],
  },
];
