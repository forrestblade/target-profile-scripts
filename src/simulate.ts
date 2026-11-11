import { runScript, type ProfileScript, type RequestInput, type RunOptions, type RunResult } from "./run.js";
import { createVisitorState, type VisitorState } from "./user.js";

export interface StepResult {
  request: RequestInput;
  results: RunResult[];
  /** Snapshot of `user.*` after this request. */
  attributes: Record<string, unknown>;
}

export interface Simulation {
  state: VisitorState;
  steps: StepResult[];
  /** Every error any script produced, with the step index it happened on. */
  errors: { step: number; result: RunResult }[];
}

/**
 * Replays requests in order against one visitor, running every script on every
 * request, which is how Target behaves. Adobe says script execution order is
 * not guaranteed, so scripts are run in the order given here and should not
 * depend on each other.
 */
export interface SimulateOptions extends RunOptions {
  /** `user.*` values the visitor already has before the first request. */
  initialAttributes?: Record<string, unknown>;
}

export function simulate(scripts: ProfileScript[], requests: RequestInput[], options: SimulateOptions = {}): Simulation {
  const state = createVisitorState(options.initialAttributes);
  const steps: StepResult[] = [];
  const errors: Simulation["errors"] = [];

  requests.forEach((request, i) => {
    const results = scripts.map((script) => runScript(script, request, state, options));
    results.filter((r) => r.error).forEach((result) => errors.push({ step: i, result }));
    steps.push({ request, results, attributes: { ...state.attributes } });
  });

  return { state, steps, errors };
}

/** A visitor's journey as a small builder, for readable tests. */
export class Journey {
  private readonly requests: RequestInput[] = [];
  private clock: number;
  private landing?: string;
  private inSession = false;

  constructor(startAt: number | Date = Date.UTC(2026, 0, 1)) {
    this.clock = typeof startAt === "number" ? startAt : startAt.getTime();
  }

  /** Advance the clock. */
  wait(ms: number): this {
    this.clock += ms;
    return this;
  }

  days(n: number): this {
    return this.wait(n * 86_400_000);
  }

  /** A new session: landing page resets to this request's page. */
  session(): this {
    this.inSession = false;
    this.landing = undefined;
    return this;
  }

  /** One mbox request. The first request of a session sets the landing page. */
  hit(mbox: string, input: Omit<RequestInput, "mbox" | "now"> & { params?: Record<string, string> } = {}): this {
    const { params, ...rest } = input;
    const isNewSession = !this.inSession;
    this.inSession = true;
    if (isNewSession) this.landing = rest.page;
    this.requests.push({
      ...rest,
      mbox: { name: mbox, params },
      landing: rest.landing ?? this.landing,
      user: { isNewSession, isFirstSession: isNewSession && this.requests.length === 0, ...rest.user },
      now: this.clock,
    });
    return this;
  }

  build(): RequestInput[] {
    return [...this.requests];
  }

  run(scripts: ProfileScript[], options?: SimulateOptions): Simulation {
    return simulate(scripts, this.build(), options);
  }
}
