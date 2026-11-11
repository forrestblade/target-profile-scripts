import { describe, expect, it } from "vitest";
import { Journey } from "../../src/simulate.js";
import { script } from "../helpers.js";

const days = script("daysSinceLastPurchase");

describe("daysSinceLastPurchase", () => {
  it("is unset until an order, then counts whole days from the latest order", () => {
    const sim = new Journey()
      .hit("home")
      .hit("orderConfirmPage", { params: { orderId: "A1" } })
      .days(2.5).session().hit("home")
      .days(5).session().hit("orderConfirmPage", { params: { orderId: "A2" } })
      .days(1).session().hit("home")
      .run([days]);
    expect(sim.errors).toEqual([]);
    expect(sim.steps.map((s) => s.attributes.daysSinceLastPurchase)).toEqual([undefined, 0, 2, 0, 1]);
  });
});
