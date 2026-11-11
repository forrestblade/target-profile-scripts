import { describe, expect, it } from "vitest";
import { runScript } from "../src/run.js";
import { createVisitorState } from "../src/user.js";

const docsFrequency = {
  name: "frequency",
  source: `var frequency = user.get('frequency') || 0;
if (mbox.name == 'orderThankyouPage') {
    return frequency + 1;
}`,
};

describe("runScript", () => {
  it("stores the return value as user.<name> and leaves it alone when the script returns nothing", () => {
    const state = createVisitorState();
    const r1 = runScript(docsFrequency, { mbox: { name: "orderThankyouPage" } }, state);
    expect(r1.error).toBeUndefined();
    expect(r1.value).toBe(1);
    expect(state.attributes.frequency).toBe(1);

    const r2 = runScript(docsFrequency, { mbox: { name: "homepage" } }, state);
    expect(r2.value).toBeUndefined();
    expect(state.attributes.frequency).toBe(1);

    runScript(docsFrequency, { mbox: { name: "orderThankyouPage" } }, state);
    expect(state.attributes.frequency).toBe(2);
  });

  it("exposes page, landing, referrer, mbox, profile and user", () => {
    const script = {
      name: "probe",
      source: `return [page.domain, landing.param('utm_source'), referrer.domain, mbox.param('x'),
        profile.get('tier'), profile.geolocation.state, String(user.isNewSession)].join('|');`,
    };
    const r = runScript(
      script,
      {
        page: "https://www.example.com/a?x=1",
        landing: "https://www.example.com/?utm_source=mail",
        referrer: "https://google.com/",
        mbox: { name: "m", params: { x: "mx" } },
        profile: { params: { tier: "gold" }, geolocation: { state: "TX" } },
        user: { isNewSession: true },
      },
      createVisitorState(),
    );
    expect(r.value).toBe("www.example.com|mail|google.com|mx|gold|TX|true");
  });

  it("landing defaults to page when not given", () => {
    const r = runScript({ name: "l", source: "return landing.url;" }, { page: "https://a.com/x" }, createVisitorState());
    expect(r.value).toBe("https://a.com/x");
  });

  it("pins the clock when now is given", () => {
    const r = runScript(
      { name: "clock", source: "return [new Date().getTime(), Date.now(), new Date(0).getTime()].join(',');" },
      { now: 1_700_000_000_000 },
      createVisitorState(),
    );
    expect(r.value).toBe("1700000000000,1700000000000,0");
  });

  it("captures a thrown error instead of propagating it, and keeps the old attribute", () => {
    const state = createVisitorState({ bad: "keep" });
    const r = runScript({ name: "bad", source: "return undefinedVariable + 1;" }, {}, state);
    expect(r.error).toBeInstanceOf(Error);
    expect(r.error?.message).toMatch(/undefinedVariable is not defined/);
    expect(state.attributes.bad).toBe("keep");
  });

  it("stops a runaway loop", () => {
    const r = runScript({ name: "loop", source: "while (true) {}" }, {}, createVisitorState(), { timeoutMs: 20 });
    expect(r.error?.message).toMatch(/timed out/i);
  });

  it("has no Node or browser globals", () => {
    const r = runScript(
      { name: "globals", source: "return [typeof fetch, typeof require, typeof process, typeof setTimeout, typeof window, typeof console].join(',');" },
      {},
      createVisitorState(),
    );
    expect(r.value).toBe("undefined,undefined,undefined,undefined,undefined,object");
  });
});
