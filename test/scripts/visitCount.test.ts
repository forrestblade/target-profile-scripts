import { describe, expect, it } from "vitest";
import { Journey } from "../../src/simulate.js";
import { script } from "../helpers.js";

const visitCount = script("visitCount");

describe("visitCount", () => {
  it("counts sessions, not requests", () => {
    const sim = new Journey()
      .hit("home").hit("pdp").hit("cart")
      .days(1).session().hit("home").hit("pdp")
      .days(3).session().hit("home")
      .run([visitCount]);
    expect(sim.errors).toEqual([]);
    expect(sim.steps.map((s) => s.attributes.visitCount)).toEqual([1, 1, 1, 2, 2, 3]);
  });

  it("repairs a corrupted stored value", () => {
    const sim = new Journey().hit("home").run([visitCount], { initialAttributes: { visitCount: "garbage" } });
    expect(sim.state.attributes.visitCount).toBe(1);
  });
});
