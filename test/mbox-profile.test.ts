import { describe, expect, it } from "vitest";
import { createMbox } from "../src/mbox.js";
import { createProfile } from "../src/profile.js";

describe("createMbox", () => {
  it("exposes name and params", () => {
    const mbox = createMbox("orderThankyouPage", { orderTotal: "120.50", orderId: "A1" });
    expect(mbox.name).toBe("orderThankyouPage");
    expect(mbox.param("orderTotal")).toBe("120.50");
  });

  it("returns empty string for a missing param and empty name when unset", () => {
    expect(createMbox(undefined).name).toBe("");
    expect(createMbox("x").param("missing")).toBe("");
  });

  it("does not leak prototype properties as params", () => {
    expect(createMbox("x", {}).param("constructor")).toBe("");
  });
});

describe("createProfile", () => {
  it("get, param and parameter read the same persistent values and return null when unset", () => {
    const profile = createProfile({ params: { gender: "f", model: "A5" } });
    expect(profile.get("gender")).toBe("f");
    expect(profile.param("model")).toBe("A5");
    expect(profile.parameter("model")).toBe("A5");
    expect(profile.get("nothing")).toBeNull();
  });

  it("fills geolocation and mobile defaults", () => {
    const profile = createProfile({ geolocation: { country: "US", state: "TX" }, mobile: { isMobilePhone: true } });
    expect(profile.geolocation.country).toBe("US");
    expect(profile.geolocation.state).toBe("TX");
    expect(profile.geolocation.city).toBe("");
    expect(profile.mobile.isMobilePhone).toBe(true);
    expect(profile.mobile.isTablet).toBe(false);
    expect(profile.sessionCount).toBe(0);
  });
});
