import { describe, expect, it } from "vitest";
import { Journey } from "../../src/simulate.js";
import { script } from "../helpers.js";

const region = script("regionBucket");
const geo = (country: string, state = "") =>
  new Journey().hit("home", { profile: { geolocation: { country, state } } }).run([region]).state.attributes.regionBucket;

describe("regionBucket", () => {
  it("maps US states to Census regions", () => {
    expect(geo("US", "TX")).toBe("south");
    expect(geo("us", "ny")).toBe("northeast");
    expect(geo("US", "IL")).toBe("midwest");
    expect(geo("US", "WA")).toBe("west");
  });

  it("handles non-US, unknown state and missing geo", () => {
    expect(geo("CA", "ON")).toBe("intl");
    expect(geo("US", "PR")).toBe("unknown");
    expect(geo("")).toBe("unknown");
  });
});
