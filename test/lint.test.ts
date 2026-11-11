import { describe, expect, it } from "vitest";
import { lint } from "../src/lint.js";

const rules = (src: string, opts = {}) => lint(src, opts).problems.map((p) => p.rule);

describe("lint", () => {
  it("accepts Adobe's documented frequency example", () => {
    const r = lint(`var frequency = user.get('frequency') || 0;
if (mbox.name == 'orderThankyouPage') {
    return frequency + 1;
}`);
    expect(r.ok).toBe(true);
    expect(r.problems.map((p) => p.rule)).toEqual(["no-try-catch"]);
    expect(r.stats.calls).toBe(1);
    expect(r.stats.estimatedInstructions).toBeGreaterThan(100);
  });

  it("rejects ES6 syntax with a location", () => {
    const r = lint("const x = 1;\nreturn `${x}`;");
    expect(r.ok).toBe(false);
    expect(r.problems[0]).toMatchObject({ rule: "es5-syntax", severity: "error", line: 1 });
  });

  it("rejects globals that do not exist server-side", () => {
    expect(rules("return fetch('/x');")).toContain("forbidden-global");
    expect(rules("var w = window.location; return w;")).toContain("forbidden-global");
    expect(rules("return document.cookie;")).toContain("forbidden-global");
  });

  it("does not confuse property names with globals", () => {
    const r = lint("var o = { window: 1 }; return o.window + mbox.param('document');");
    expect(r.ok).toBe(true);
  });

  it("flags console as useless, not fatal", () => {
    const r = lint("console.log('x'); return 1;");
    expect(r.ok).toBe(true);
    expect(r.problems.map((p) => p.rule)).toContain("console");
  });

  it("errors on dot-star regexes and warns on any other regex", () => {
    expect(lint("return /.*match/.test(page.url);").ok).toBe(false);
    expect(rules("return /a|.*b/.test(page.url);")).toContain("regex-dot-star");
    const simple = lint("return /^abc/.test(page.url);");
    expect(simple.ok).toBe(true);
    expect(simple.problems.map((p) => p.rule)).toContain("regex");
    expect(rules("return new RegExp('x').test(page.url);")).toContain("regex");
  });

  it("warns on open-ended and oversized loops, accepts small literal-bound loops", () => {
    expect(rules("var i = 0; while (i < 3) { i++; } return i;")).toContain("open-ended-loop");
    expect(rules("for (var k in {}) {} return 1;")).toContain("open-ended-loop");
    expect(rules("var n = mbox.param('n'); for (var i = 0; i < n; i++) {} return i;")).toContain("open-ended-loop");
    expect(rules("for (var i = 0; i < 100; i++) {} return i;")).toContain("loop-iterations");
    const ok = lint("for (var i = 0; i < 10; i++) {} return i;");
    expect(ok.problems.map((p) => p.rule)).not.toContain("open-ended-loop");
    expect(ok.stats.loops).toBe(1);
  });

  it("warns on recursion", () => {
    expect(rules("function f(n) { return n ? f(n - 1) : 0; } return f(3);")).toContain("recursion");
  });

  it("warns when a script never returns, and reports the length limit", () => {
    expect(rules("var x = 1;")).toContain("no-return");
    const long = lint("return 1; " + "// " + "x".repeat(1400));
    expect(long.problems.map((p) => p.rule)).toContain("max-length");
  });

  it("warns when a script reads another script's value, but not its own", () => {
    const opts = { name: "segment", otherScriptNames: ["segment", "frequency"] };
    expect(rules("return user.get('frequency') > 3;", opts)).toContain("dependent-script");
    expect(rules("return user.get('user.frequency') > 3;", opts)).toContain("dependent-script");
    expect(rules("return (user.get('segment') || 0) + 1;", opts)).not.toContain("dependent-script");
  });

  it("estimates instructions with calls costing 100", () => {
    const many = Array.from({ length: 25 }, (_, i) => `var a${i} = mbox.param('p${i}');`).join("\n") + "\nreturn 1;";
    const r = lint(many);
    expect(r.stats.calls).toBe(25);
    expect(r.problems.map((p) => p.rule)).toContain("instruction-estimate");
  });
});
