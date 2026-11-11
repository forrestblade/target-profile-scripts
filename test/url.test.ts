import { describe, expect, it } from "vitest";
import { createTargetUrl } from "../src/url.js";

describe("createTargetUrl", () => {
  it("splits the documented Adobe example", () => {
    const page = createTargetUrl("http://www.acme.com/categories/mens_jeans?color=blue&size=small");
    expect(page.url).toBe("http://www.acme.com/categories/mens_jeans?color=blue&size=small");
    expect(page.protocol).toBe("http");
    expect(page.domain).toBe("www.acme.com");
    expect(page.query).toBe("color=blue&size=small");
    expect(page.param("color")).toBe("blue");
    expect(page.param("size")).toBe("small");
  });

  it("returns empty strings for missing params and missing url", () => {
    expect(createTargetUrl("https://a.com/").param("nope")).toBe("");
    const none = createTargetUrl(undefined);
    expect(none.url).toBe("");
    expect(none.protocol).toBe("");
    expect(none.domain).toBe("");
    expect(none.query).toBe("");
    expect(none.param("x")).toBe("");
  });

  it("keeps the host with port as the domain", () => {
    expect(createTargetUrl("https://localhost:8080/p?a=1").domain).toBe("localhost:8080");
  });

  it("still exposes query params from a relative or malformed url", () => {
    const rel = createTargetUrl("/search?hl=en&q=what+is+asdf");
    expect(rel.protocol).toBe("");
    expect(rel.query).toBe("hl=en&q=what+is+asdf");
    expect(rel.param("hl")).toBe("en");
    expect(rel.param("q")).toBe("what is asdf");
  });

  it("is frozen so scripts cannot mutate it", () => {
    const page = createTargetUrl("https://a.com/");
    expect(Object.isFrozen(page)).toBe(true);
  });
});
