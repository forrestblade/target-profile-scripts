import { describe, expect, it } from "vitest";
import { Journey } from "../../src/simulate.js";
import { script } from "../helpers.js";

const lastCategory = script("lastCategoryViewed");

describe("lastCategoryViewed", () => {
  it("tracks the latest category and survives pages that do not pass one", () => {
    const sim = new Journey()
      .hit("home")
      .hit("category", { params: { category: " Running Shoes " } })
      .hit("pdp", { params: { category: "running shoes" } })
      .hit("cart")
      .hit("category", { params: { category: "Jackets" } })
      .run([lastCategory]);
    expect(sim.errors).toEqual([]);
    expect(sim.steps.map((s) => s.attributes.lastCategoryViewed)).toEqual([
      undefined, "running shoes", "running shoes", "running shoes", "jackets",
    ]);
  });

  it("falls back to a profile parameter", () => {
    const sim = new Journey().hit("pdp", { profile: { params: { category: "Hats" } } }).run([lastCategory]);
    expect(sim.state.attributes.lastCategoryViewed).toBe("hats");
  });
});
