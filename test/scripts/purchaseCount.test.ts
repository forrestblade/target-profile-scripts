import { describe, expect, it } from "vitest";
import { Journey } from "../../src/simulate.js";
import { script } from "../helpers.js";

const purchaseCount = script("purchaseCount");

describe("purchaseCount", () => {
  it("counts distinct orders and ignores a reload of the confirmation page", () => {
    const sim = new Journey()
      .hit("home")
      .hit("orderConfirmPage", { params: { orderId: "A100", orderTotal: "20" } })
      .hit("orderConfirmPage", { params: { orderId: "A100", orderTotal: "20" } })
      .days(10).session()
      .hit("orderConfirmPage", { params: { orderId: "A101", orderTotal: "35" } })
      .run([purchaseCount]);
    expect(sim.errors).toEqual([]);
    expect(sim.steps.map((s) => s.attributes.purchaseCount)).toEqual([0, 1, 1, 2]);
  });
});
