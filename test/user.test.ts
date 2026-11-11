import { describe, expect, it } from "vitest";
import { createUser, createVisitorState } from "../src/user.js";

describe("createUser", () => {
  it("reads persistent attributes, with or without the user. prefix, null when unset", () => {
    const state = createVisitorState({ frequency: 3 });
    const user = createUser(state, "anyScript");
    expect(user.get("frequency")).toBe(3);
    expect(user.get("user.frequency")).toBe(3);
    expect(user.get("nothing")).toBeNull();
  });

  it("scopes locals to the script that set them and persists them in the state", () => {
    const state = createVisitorState();
    const a = createUser(state, "recency");
    a.setLocal("lastPurchaseTime", 1000);
    expect(a.getLocal("lastPurchaseTime")).toBe(1000);

    const b = createUser(state, "frequency");
    expect(b.getLocal("lastPurchaseTime")).toBeNull();

    const aAgain = createUser(state, "recency");
    expect(aAgain.getLocal("lastPurchaseTime")).toBe(1000);
  });

  it("looks up headers case-insensitively and derives user.browser from user-agent", () => {
    const user = createUser(createVisitorState(), "s", {
      headers: { "User-Agent": "Mozilla/5.0 Safari/605", "Accept-Language": "en-US" },
    });
    expect(user.header("user-agent")).toBe("Mozilla/5.0 Safari/605");
    expect(user.header("ACCEPT-LANGUAGE")).toBe("en-US");
    expect(user.header("x-forwarded-for")).toBeNull();
    expect(user.browser).toBe("Mozilla/5.0 Safari/605");
  });

  it("exposes session built-ins with safe defaults", () => {
    const user = createUser(createVisitorState(), "s", { isNewSession: true, activeCampaigns: [101, 202] });
    expect(user.isNewSession).toBe(true);
    expect(user.isFirstSession).toBe(false);
    expect(user.daysSinceLastVisit).toBe(0);
    expect(user.activeCampaigns).toEqual([101, 202]);
    expect(user.activeActivities).toEqual([101, 202]);
    expect(user.categoryAffinity).toBeNull();
    expect(user.categoryAffinities).toEqual([]);
  });
});
