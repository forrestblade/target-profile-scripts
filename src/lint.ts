import * as acorn from "acorn";

/**
 * Static checks for the limits Adobe documents for profile scripts:
 * Rhino / ES5 syntax, 1,300 characters, 50 loop iterations, roughly 2,000
 * instructions with every call costing 100, no dot-star regexes, no
 * dependence on other scripts (execution order is not guaranteed), and the
 * fact that scripts run server-side with no browser or network access.
 */
export type Severity = "error" | "warning" | "info";

export interface Problem {
  rule: string;
  severity: Severity;
  message: string;
  line?: number;
  column?: number;
}

export interface LintStats {
  length: number;
  estimatedInstructions: number;
  loops: number;
  regexes: number;
  calls: number;
}

export interface LintResult {
  name: string;
  /** True when there are no errors. Warnings do not fail a script. */
  ok: boolean;
  problems: Problem[];
  stats: LintStats;
}

export interface LintOptions {
  name?: string;
  /** Names of the other scripts in the same Target account, to flag dependent scripts. */
  otherScriptNames?: string[];
  maxLength?: number;
  maxLoopIterations?: number;
  maxInstructions?: number;
}

export const LIMITS = {
  maxLength: 1300,
  maxLoopIterations: 50,
  maxInstructions: 2000,
  callCost: 100,
} as const;

const FORBIDDEN_GLOBALS = new Set([
  "fetch",
  "XMLHttpRequest",
  "require",
  "process",
  "window",
  "document",
  "navigator",
  "localStorage",
  "sessionStorage",
  "setTimeout",
  "setInterval",
  "eval",
  "Function",
  "importScripts",
]);

type Node = acorn.Node & Record<string, unknown>;

function walk(node: unknown, visit: (n: Node, parent: Node | null) => void, parent: Node | null = null): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit, parent);
    return;
  }
  const n = node as Node;
  if (typeof n.type !== "string") return;
  visit(n, parent);
  for (const key of Object.keys(n)) {
    if (key === "type" || key === "start" || key === "end" || key === "loc") continue;
    walk(n[key], visit, n);
  }
}

function loc(n: Node, source: string): { line: number; column: number } {
  const before = source.slice(0, n.start);
  const line = before.split("\n").length;
  const column = n.start - before.lastIndexOf("\n");
  return { line, column };
}

function literalLoopBound(forNode: Node): number | null {
  // for (var i = 0; i < 10; i++) style: find a numeric literal on the test.
  const test = forNode.test as Node | null;
  if (!test || test.type !== "BinaryExpression") return null;
  const right = test.right as Node;
  const left = test.left as Node;
  const lit = right.type === "Literal" ? right : left.type === "Literal" ? left : null;
  return lit && typeof lit.value === "number" ? lit.value : null;
}

export function lint(source: string, options: LintOptions = {}): LintResult {
  const name = options.name ?? "script";
  const maxLength = options.maxLength ?? LIMITS.maxLength;
  const maxLoop = options.maxLoopIterations ?? LIMITS.maxLoopIterations;
  const maxInstructions = options.maxInstructions ?? LIMITS.maxInstructions;
  const others = new Set((options.otherScriptNames ?? []).filter((n) => n !== name));

  const problems: Problem[] = [];
  const stats: LintStats = { length: source.length, estimatedInstructions: 0, loops: 0, regexes: 0, calls: 0 };
  const push = (p: Problem) => problems.push(p);

  if (source.length > maxLength) {
    push({
      rule: "max-length",
      severity: "warning",
      message: `Script is ${source.length} characters; Adobe recommends staying under ${maxLength}.`,
    });
  }

  let ast: acorn.Node;
  try {
    ast = acorn.parse(source, { ecmaVersion: 5, sourceType: "script", allowReturnOutsideFunction: true });
  } catch (e) {
    const err = e as Error & { loc?: { line: number; column: number } };
    push({
      rule: "es5-syntax",
      severity: "error",
      message: `Not valid ES5 (Target runs Rhino): ${err.message.replace(/ \(\d+:\d+\)$/, "")}`,
      line: err.loc?.line,
      column: err.loc?.column !== undefined ? err.loc.column + 1 : undefined,
    });
    return { name, ok: false, problems, stats };
  }

  let hasReturn = false;
  let hasTry = false;
  const declaredFunctions = new Map<string, Node>();

  walk(ast, (n, parent) => {
    stats.estimatedInstructions += 1;

    switch (n.type) {
      case "ReturnStatement":
        hasReturn = true;
        break;
      case "TryStatement":
        hasTry = true;
        break;
      case "CallExpression":
      case "NewExpression": {
        stats.calls += 1;
        stats.estimatedInstructions += LIMITS.callCost - 1;
        const callee = n.callee as Node;
        if (n.type === "NewExpression" && callee.type === "Identifier" && callee.name === "RegExp") {
          stats.regexes += 1;
          push({ rule: "regex", severity: "warning", message: "Avoid regular expressions; even simple ones cost many instructions.", ...loc(n, source) });
        }
        if (callee.type === "MemberExpression") {
          const obj = callee.object as Node;
          const prop = callee.property as Node;
          if (obj.type === "Identifier" && obj.name === "console") {
            push({ rule: "console", severity: "warning", message: "console.* does nothing in a profile script; scripts run server-side. Use a response token or mboxTrace to debug.", ...loc(n, source) });
          }
          if (obj.type === "Identifier" && obj.name === "user" && prop.type === "Identifier" && prop.name === "get") {
            const arg = (n.arguments as Node[])[0];
            if (arg?.type === "Literal" && typeof arg.value === "string") {
              const ref = arg.value.replace(/^user\./, "");
              if (ref !== name && others.has(ref)) {
                push({ rule: "dependent-script", severity: "warning", message: `Reads another profile script (user.${ref}); execution order is not guaranteed, so the value may be stale.`, ...loc(n, source) });
              }
            }
          }
        }
        break;
      }
      case "Identifier": {
        const id = n.name as string;
        const isPropertyName = parent?.type === "MemberExpression" && parent.property === n && !parent.computed;
        const isKey = parent?.type === "Property" && parent.key === n;
        if (FORBIDDEN_GLOBALS.has(id) && !isPropertyName && !isKey) {
          push({ rule: "forbidden-global", severity: "error", message: `${id} does not exist in Target's script runtime; the script would throw and be disabled.`, ...loc(n, source) });
        }
        break;
      }
      case "Literal": {
        const regex = n.regex as { pattern: string } | undefined;
        if (regex) {
          stats.regexes += 1;
          if (/^\.\*/.test(regex.pattern) || /\|\.\*/.test(regex.pattern)) {
            push({ rule: "regex-dot-star", severity: "error", message: `Regex /${regex.pattern}/ starts an alternative with .*; Adobe says this can interrupt the script on long input.`, ...loc(n, source) });
          } else {
            push({ rule: "regex", severity: "warning", message: "Avoid regular expressions; even simple ones cost many instructions.", ...loc(n, source) });
          }
        }
        break;
      }
      case "WhileStatement":
      case "DoWhileStatement":
      case "ForInStatement":
        stats.loops += 1;
        push({ rule: "open-ended-loop", severity: "warning", message: `${n.type === "ForInStatement" ? "for-in" : "while"} loop has no fixed bound; Adobe asks for limited for loops (50 iterations max).`, ...loc(n, source) });
        break;
      case "ForStatement": {
        stats.loops += 1;
        const bound = literalLoopBound(n);
        if (bound === null) {
          push({ rule: "open-ended-loop", severity: "warning", message: "for loop bound is not a literal; keep loops to a fixed, small count (50 iterations max).", ...loc(n, source) });
        } else if (bound > maxLoop) {
          push({ rule: "loop-iterations", severity: "warning", message: `for loop runs up to ${bound} times; Adobe's limit is ${maxLoop}.`, ...loc(n, source) });
        }
        break;
      }
      case "FunctionDeclaration":
        declaredFunctions.set((n.id as Node).name as string, n);
        break;
    }
  });

  for (const [fnName, fn] of declaredFunctions) {
    walk(fn.body, (n) => {
      if (n.type === "CallExpression" && (n.callee as Node).type === "Identifier" && (n.callee as Node).name === fnName) {
        push({ rule: "recursion", severity: "warning", message: `${fnName}() calls itself; Adobe says to avoid recursion.`, ...loc(n, source) });
      }
    });
  }

  if (!hasReturn) {
    push({ rule: "no-return", severity: "warning", message: "Script never returns, so user.<name> is never set." });
  }
  if (!hasTry) {
    push({ rule: "no-try-catch", severity: "info", message: "No try/catch. Adobe suggests wrapping the script so a bad input fails gracefully instead of disabling the script." });
  }
  if (stats.estimatedInstructions > maxInstructions) {
    push({
      rule: "instruction-estimate",
      severity: "warning",
      message: `Estimated ${stats.estimatedInstructions} instructions (calls cost 100 each); Target disables scripts over ${maxInstructions}. The real count depends on input data.`,
    });
  }

  return { name, ok: !problems.some((p) => p.severity === "error"), problems, stats };
}
