import { describe, expect, it } from "vitest";
import { Journey } from "../../src/simulate.js";
import { script } from "../helpers.js";

const first = script("firstTouchCampaign");
const last = script("lastTouchCampaign");

describe("firstTouchCampaign and lastTouchCampaign", () => {
  it("first sticks, last follows", () => {
    const sim = new Journey()
      .hit("home", { page: "https://shop.example.com/?utm_campaign=Spring_Sale" })
      .hit("pdp", { page: "https://shop.example.com/p/1" })
      .days(2).session()
      .hit("home", { page: "https://shop.example.com/?utm_campaign=retarget-2" })
      .days(1).session()
      .hit("home", { page: "https://shop.example.com/" })
      .run([first, last]);
    expect(sim.errors).toEqual([]);
    expect(sim.steps.map((s) => s.attributes.firstTouchCampaign)).toEqual([
      "spring_sale", "spring_sale", "spring_sale", "spring_sale",
    ]);
    expect(sim.steps.map((s) => s.attributes.lastTouchCampaign)).toEqual([
      "spring_sale", "spring_sale", "retarget-2", "retarget-2",
    ]);
  });

  it("stays unset for a visitor who never arrives with a campaign", () => {
    const sim = new Journey().hit("home", { page: "https://shop.example.com/" }).run([first, last]);
    expect(sim.state.attributes).toEqual({});
  });

  it("caps user input length", () => {
    const sim = new Journey()
      .hit("home", { page: "https://shop.example.com/?utm_campaign=" + "x".repeat(500) })
      .run([first]);
    expect(String(sim.state.attributes.firstTouchCampaign)).toHaveLength(100);
  });
});
