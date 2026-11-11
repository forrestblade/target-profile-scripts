import { describe, expect, it } from "vitest";
import { Journey } from "../../src/simulate.js";
import { script } from "../helpers.js";

const ltv = script("lifetimeOrderValue");

describe("lifetimeOrderValue", () => {
  it("adds distinct orders, skips reloads and bad totals, keeps cents exact", () => {
    const sim = new Journey()
      .hit("orderConfirmPage", { params: { orderId: "A1", orderTotal: "19.99" } })
      .hit("orderConfirmPage", { params: { orderId: "A1", orderTotal: "19.99" } })
      .hit("orderConfirmPage", { params: { orderId: "A2", orderTotal: "0.01" } })
      .hit("orderConfirmPage", { params: { orderId: "A3", orderTotal: "free" } })
      .hit("home")
      .run([ltv]);
    expect(sim.errors).toEqual([]);
    expect(sim.steps.map((s) => s.attributes.lifetimeOrderValue)).toEqual([19.99, 19.99, 20, 20, 20]);
  });
});
