#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { lint, type Problem } from "./lint.js";
import { loadScripts } from "./load.js";
import type { RequestInput } from "./run.js";
import { simulate } from "./simulate.js";

const USAGE = `tps: Adobe Target profile scripts, locally

  tps lint <script.js>...                 check scripts against Target's limits (exit 1 on errors)
  tps run <script.js>... --requests f.json  replay a JSON array of requests through the scripts

Options for run:
  --requests <file>   JSON array of requests: { mbox: {name, params}, page, landing, referrer, profile, user, now }
  --json              print the final user.* attributes as JSON only
`;

function fmt(p: Problem): string {
  const where = p.line ? `:${p.line}:${p.column ?? 1}` : "";
  return `  ${p.severity.padEnd(7)} ${p.rule.padEnd(20)} ${p.message}${where ? `  (${where.slice(1)})` : ""}`;
}

function cmdLint(files: string[]): number {
  if (files.length === 0) {
    console.error(USAGE);
    return 2;
  }
  const scripts = loadScripts(files);
  const names = scripts.map((s) => s.name);
  let failed = 0;
  for (const script of scripts) {
    const r = lint(script.source, { name: script.name, otherScriptNames: names });
    const errors = r.problems.filter((p) => p.severity === "error").length;
    const warnings = r.problems.filter((p) => p.severity === "warning").length;
    console.log(`${r.ok ? "ok  " : "FAIL"} ${script.name}  ${r.stats.length} chars, ~${r.stats.estimatedInstructions} instructions, ${errors} errors, ${warnings} warnings`);
    for (const p of r.problems) console.log(fmt(p));
    if (!r.ok) failed += 1;
  }
  return failed ? 1 : 0;
}

function cmdRun(files: string[], requestsFile: string | undefined, json: boolean): number {
  if (files.length === 0 || !requestsFile) {
    console.error(USAGE);
    return 2;
  }
  const scripts = loadScripts(files);
  const requests = JSON.parse(readFileSync(requestsFile, "utf8")) as RequestInput[];
  const sim = simulate(scripts, requests);
  if (json) {
    console.log(JSON.stringify(sim.state.attributes, null, 2));
  } else {
    sim.steps.forEach((step, i) => {
      console.log(`#${i + 1} ${step.request.mbox?.name ?? "(no mbox)"}  ${step.request.page ?? ""}`);
      for (const r of step.results) {
        const v = r.error ? `ERROR ${r.error.message}` : r.value === undefined ? "(no change)" : JSON.stringify(r.value);
        console.log(`   ${r.name} -> ${v}`);
      }
    });
    console.log("final user.*:", JSON.stringify(sim.state.attributes));
  }
  return sim.errors.length ? 1 : 0;
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { requests: { type: "string" }, json: { type: "boolean", default: false }, help: { type: "boolean", short: "h" } },
});
const [command, ...files] = positionals;

let code: number;
if (values.help || !command) {
  console.log(USAGE);
  code = command ? 0 : 2;
} else if (command === "lint") {
  code = cmdLint(files);
} else if (command === "run") {
  code = cmdRun(files, values.requests, values.json ?? false);
} else {
  console.error(`unknown command: ${command}\n${USAGE}`);
  code = 2;
}
process.exit(code);
