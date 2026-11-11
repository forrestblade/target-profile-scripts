import vm from "node:vm";
import { createMbox, type TargetMbox } from "./mbox.js";
import { createProfile, type ProfileInput, type TargetProfile } from "./profile.js";
import { createTargetUrl, type TargetUrl } from "./url.js";
import { createUser, type TargetUser, type UserInput, type VisitorState } from "./user.js";

export interface ProfileScript {
  /** The script name in Target. Its return value becomes `user.<name>`. */
  name: string;
  source: string;
}

/** One location (mbox) request, the unit a profile script runs for. */
export interface RequestInput {
  mbox?: { name?: string; params?: Record<string, string> };
  page?: string;
  landing?: string;
  referrer?: string;
  profile?: ProfileInput;
  user?: UserInput;
  /** Fixed clock for `new Date()` and `Date.now()` inside the script, ms since epoch. */
  now?: number;
}

export interface RunOptions {
  /** Wall-clock cap for one script, independent of Target's instruction counter. */
  timeoutMs?: number;
}

export interface RunResult {
  name: string;
  /** What the script returned. `undefined` means it returned nothing and the attribute was left alone. */
  value: unknown;
  error?: Error;
  durationMs: number;
}

export interface Sandbox {
  page: TargetUrl;
  landing: TargetUrl;
  referrer: TargetUrl;
  mbox: TargetMbox;
  profile: TargetProfile;
  user: TargetUser;
}

export function createSandbox(scriptName: string, request: RequestInput, state: VisitorState): Sandbox {
  for (const [key, value] of Object.entries(request.mbox?.params ?? {})) {
    if (key.startsWith("profile.") && key.length > 8) {
      state.profileParams[key.slice(8)] = value;
    }
  }
  Object.assign(state.profileParams, request.profile?.params);

  return {
    page: createTargetUrl(request.page),
    landing: createTargetUrl(request.landing ?? request.page),
    referrer: createTargetUrl(request.referrer),
    mbox: createMbox(request.mbox?.name, request.mbox?.params),
    profile: createProfile({ ...request.profile, params: state.profileParams }),
    user: createUser(state, scriptName, request.user),
  };
}

// Replaces Date inside the sandbox so scripts see a fixed "now". Runs inside the
// vm context, so it must only touch that context's own globals.
const FIXED_CLOCK_PRELUDE = `
(function (fixedNow) {
  var RealDate = Date;
  function FakeDate() {
    if (!(this instanceof FakeDate)) return new RealDate(fixedNow).toString();
    if (arguments.length === 0) return new RealDate(fixedNow);
    return new (Function.prototype.bind.apply(RealDate, [null].concat(Array.prototype.slice.call(arguments))))();
  }
  FakeDate.prototype = RealDate.prototype;
  FakeDate.now = function () { return fixedNow; };
  FakeDate.UTC = RealDate.UTC;
  FakeDate.parse = RealDate.parse;
  Date = FakeDate;
})`;

/**
 * Runs one profile script for one request against a visitor's state, the way
 * Target runs every active script on every mbox call.
 *
 * The script body is wrapped in a function, so top-level `return` works. The
 * context holds only the documented objects plus ECMAScript built-ins: no
 * fetch, no require, no process, no timers. `console` exists and does nothing,
 * which is what Adobe documents for server-side scripts.
 *
 * For trusted local scripts only. Node's vm is not a security boundary.
 */
export function runScript(
  script: ProfileScript,
  request: RequestInput,
  state: VisitorState,
  options: RunOptions = {},
): RunResult {
  const sandbox = createSandbox(script.name, request, state);
  const context = vm.createContext({
    ...sandbox,
    console: Object.freeze({ log() {}, warn() {}, error() {}, info() {} }),
  });

  const started = performance.now();
  try {
    if (request.now !== undefined) {
      vm.runInContext(FIXED_CLOCK_PRELUDE, context)(request.now);
    }
    const value: unknown = vm.runInContext(`(function () {\n${script.source}\n})()`, context, {
      filename: `${script.name}.js`,
      timeout: options.timeoutMs ?? 100,
    });
    if (value !== undefined) {
      state.attributes[script.name] = value;
    }
    return { name: script.name, value, durationMs: performance.now() - started };
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    return { name: script.name, value: undefined, error, durationMs: performance.now() - started };
  }
}
