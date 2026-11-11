import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { lint, LIMITS } from "../../src/lint.js";
import { loadScript } from "../../src/load.js";
import { runScript } from "../../src/run.js";
import { createVisitorState } from "../../src/user.js";

const dir = fileURLToPath(new URL("../../scripts/", import.meta.url));
const files = readdirSync(dir).filter((f) => f.endsWith(".js")).sort();
const scripts = files.map((f) => loadScript(dir + f));
const names = scripts.map((s) => s.name);

describe("every shipped script", () => {
  it.each(scripts.map((s) => [s.name, s] as const))("%s passes lint with no errors or warnings", (_, s) => {
    const r = lint(s.source, { name: s.name, otherScriptNames: names });
    const notInfo = r.problems.filter((p) => p.severity !== "info");
    expect(notInfo, JSON.stringify(notInfo, null, 2)).toEqual([]);
    expect(r.stats.length).toBeLessThanOrEqual(LIMITS.maxLength);
    expect(r.stats.estimatedInstructions).toBeLessThanOrEqual(LIMITS.maxInstructions);
  });

  it.each(scripts.map((s) => [s.name, s] as const))("%s has a try/catch and a header comment", (_, s) => {
    expect(s.source).toMatch(/^\/\*\s*\n \* user\./);
    expect(lint(s.source).problems.map((p) => p.rule)).not.toContain("no-try-catch");
  });

  it.each(scripts.map((s) => [s.name, s] as const))("%s survives an empty request without throwing", (_, s) => {
    const r = runScript(s, {}, createVisitorState());
    expect(r.error).toBeUndefined();
  });
});
