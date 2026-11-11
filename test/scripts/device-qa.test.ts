import { describe, expect, it } from "vitest";
import { Journey } from "../../src/simulate.js";
import { script } from "../helpers.js";

const deviceClass = script("deviceClass");
const qaFlag = script("qaFlag");

describe("deviceClass", () => {
  const run = (mobile: { isMobilePhone?: boolean; isTablet?: boolean }) =>
    new Journey().hit("home", { profile: { mobile } }).run([deviceClass]).state.attributes.deviceClass;

  it("maps the built-in mobile flags", () => {
    expect(run({ isMobilePhone: true })).toBe("phone");
    expect(run({ isTablet: true })).toBe("tablet");
    expect(run({})).toBe("desktop");
  });
});

describe("qaFlag", () => {
  it("sticks for the session the tester arrived in, then clears on the next session", () => {
    const sim = new Journey()
      .hit("home", { page: "https://www.example.com/?adobeQA=exp-42" })
      .hit("pdp", { page: "https://www.example.com/p/1" })
      .days(1).session()
      .hit("home", { page: "https://www.example.com/" })
      .hit("pdp", { page: "https://www.example.com/p/1" })
      .run([qaFlag]);
    expect(sim.errors).toEqual([]);
    expect(sim.steps.map((s) => s.attributes.qaFlag)).toEqual(["exp-42", "exp-42", "", ""]);
  });

  it("accepts the lowercase parameter and the mbox parameter", () => {
    expect(new Journey().hit("home", { page: "https://x.com/?adobeqa=a" }).run([qaFlag]).state.attributes.qaFlag).toBe("a");
    expect(new Journey().hit("home", { params: { adobeQA: "b" } }).run([qaFlag]).state.attributes.qaFlag).toBe("b");
  });
});
