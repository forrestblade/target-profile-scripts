import { describe, expect, it } from "vitest";
import { Journey, simulate } from "../src/simulate.js";

const recency = {
  name: "recency",
  source: `var dayInMillis = 3600 * 24 * 1000;
if (mbox.name == 'orderThankyouPage') {
    user.setLocal('lastPurchaseTime', new Date().getTime());
}
var lastPurchaseTime = user.getLocal('lastPurchaseTime');
if (lastPurchaseTime) {
    return ((new Date()).getTime() - lastPurchaseTime) / dayInMillis;
}`,
};

const frequency = {
  name: "frequency",
  source: `var frequency = user.get('frequency') || 0;
if (mbox.name == 'orderThankyouPage') { return frequency + 1; }`,
};

describe("simulate", () => {
  it("runs every script on every request and snapshots attributes per step", () => {
    const t0 = Date.UTC(2026, 0, 1);
    const sim = simulate([recency, frequency], [
      { mbox: { name: "homepage" }, now: t0 },
      { mbox: { name: "orderThankyouPage" }, now: t0 },
      { mbox: { name: "homepage" }, now: t0 + 2 * 86_400_000 },
    ]);
    expect(sim.errors).toEqual([]);
    expect(sim.steps[0].attributes).toEqual({});
    expect(sim.steps[1].attributes).toEqual({ recency: 0, frequency: 1 });
    expect(sim.steps[2].attributes).toEqual({ recency: 2, frequency: 1 });
  });

  it("collects errors with their step", () => {
    const sim = simulate([{ name: "boom", source: "if (mbox.name == 'b') throw new Error('x'); return 1;" }], [
      { mbox: { name: "a" } },
      { mbox: { name: "b" } },
    ]);
    expect(sim.errors).toHaveLength(1);
    expect(sim.errors[0].step).toBe(1);
    expect(sim.state.attributes.boom).toBe(1);
  });
});

describe("Journey", () => {
  it("builds requests with a moving clock, session flags and landing page", () => {
    const reqs = new Journey(1000)
      .hit("homepage", { page: "https://a.com/?utm_source=mail" })
      .hit("pdp", { page: "https://a.com/p/1" })
      .days(1)
      .session()
      .hit("homepage", { page: "https://a.com/" })
      .build();
    expect(reqs.map((r) => r.now)).toEqual([1000, 1000, 1000 + 86_400_000]);
    expect(reqs.map((r) => r.user?.isNewSession)).toEqual([true, false, true]);
    expect(reqs.map((r) => r.user?.isFirstSession)).toEqual([true, true, false]);
    expect(reqs.map((r) => r.landing)).toEqual([
      "https://a.com/?utm_source=mail",
      "https://a.com/?utm_source=mail",
      "https://a.com/",
    ]);
    expect(reqs[1].mbox).toEqual({ name: "pdp", params: undefined });
  });

  it("runs scripts over the journey", () => {
    const sim = new Journey().hit("orderThankyouPage").days(3).hit("homepage").run([recency]);
    expect(sim.state.attributes.recency).toBe(3);
  });
});
