import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cwd = fileURLToPath(new URL("../", import.meta.url));
const cli = (...args: string[]) => spawnSync(process.execPath, ["--import", "tsx", "src/cli.ts", ...args], {
  cwd,
  encoding: "utf8",
  timeout: 10_000,
});

describe("CLI", () => {
  it("lints a valid script with exit code 0", () => {
    const result = cli("lint", "scripts/visitCount.js");
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("0 errors, 0 warnings");
  });

  it("fails non-ES5 syntax with exit code 1", () => {
    const result = cli("lint", "test/fixtures/non-es5.js");
    expect(result.status, result.stderr).toBe(1);
    expect(result.stdout).toContain("es5-syntax");
  });

  it("replays the example journey and emits machine-readable JSON", () => {
    const result = cli("run", "scripts/purchaseCount.js", "--requests", "examples/requests.json", "--json");
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ purchaseCount: 2 });
  });

  it("rejects an unknown command with exit code 2", () => {
    const result = cli("unknown");
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("unknown command");
  });
});
