import { describe, expect, it } from "vitest";
import { Journey } from "../../src/simulate.js";
import { script } from "../helpers.js";

const loyaltyTier = script("loyaltyTier");

describe("loyaltyTier", () => {
  it("persists a known tier across pages that do not send it, and ignores junk", () => {
    const sim = new Journey()
      .hit("home")
      .hit("account", { params: { loyaltyTier: " Gold " } })
      .hit("pdp")
      .hit("account", { params: { loyaltyTier: "<script>" } })
      .hit("account", { params: { loyaltyTier: "platinum" } })
      .run([loyaltyTier]);
    expect(sim.errors).toEqual([]);
    expect(sim.steps.map((s) => s.attributes.loyaltyTier)).toEqual([undefined, "gold", "gold", "gold", "platinum"]);
  });

  it("does not treat object prototype names as tiers", () => {
    const sim = new Journey().hit("account", { params: { loyaltyTier: "constructor" } }).run([loyaltyTier]);
    expect(sim.state.attributes.loyaltyTier).toBeUndefined();
  });
});
