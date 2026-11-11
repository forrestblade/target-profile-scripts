import { describe, expect, it } from "vitest";
import { Journey } from "../../src/simulate.js";
import { script } from "../helpers.js";

const segment = script("engagementSegment");

describe("engagementSegment", () => {
  it("classifies each new session by the gap since the previous one", () => {
    const sim = new Journey()
      .hit("home").hit("pdp")
      .days(3).session().hit("home")
      .days(20).session().hit("home").hit("cart")
      .days(45).session().hit("home")
      .days(1).session().hit("home")
      .run([segment]);
    expect(sim.errors).toEqual([]);
    expect(sim.steps.map((s) => s.attributes.engagementSegment)).toEqual([
      "new", "new", "active", "returning", "returning", "reactivated", "active",
    ]);
  });
});
