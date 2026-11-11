/**
 * The `user` object: persistent `user.*` attributes (the values profile scripts
 * return), per-script locals (`user.setLocal` / `user.getLocal`), and the
 * built-in session and browser profiles from Adobe's glossary.
 *
 * Attributes and locals live in a VisitorState that outlives one request, so a
 * sequence of mbox calls can be replayed against the same visitor.
 */
export interface VisitorState {
  /** `user.<name>` values. Script results land here under the script's name. */
  attributes: Record<string, unknown>;
  /** `user.setLocal` values, scoped by the script that set them. */
  locals: Record<string, Record<string, unknown>>;
}

export function createVisitorState(attributes: Record<string, unknown> = {}): VisitorState {
  return { attributes: { ...attributes }, locals: {} };
}

export interface UserInput {
  activeCampaigns?: number[];
  activeActivities?: number[];
  pcId?: string;
  sessionId?: string;
  categoryAffinity?: string;
  categoryAffinities?: string[];
  isFirstSession?: boolean;
  isNewSession?: boolean;
  daysSinceLastVisit?: number;
  /** Full user-agent string. `user.browser` in Target. */
  browser?: string;
  /** Browser family, lowercase in Target ("chrome", "safari", ...). */
  browserType?: string;
  /** Request headers for `user.header(name)`. Looked up case-insensitively. */
  headers?: Record<string, string>;
}

export interface TargetUser {
  get(name: string): unknown;
  getLocal(name: string): unknown;
  setLocal(name: string, value: unknown): void;
  header(name: string): string | null;
  readonly activeCampaigns: readonly number[];
  readonly activeActivities: readonly number[];
  readonly pcId: string;
  readonly sessionId: string;
  readonly categoryAffinity: string | null;
  readonly categoryAffinities: readonly string[];
  readonly isFirstSession: boolean;
  readonly isNewSession: boolean;
  readonly daysSinceLastVisit: number;
  readonly browser: string | null;
  readonly browserType: string | null;
}

function stripUserPrefix(name: string): string {
  return name.startsWith("user.") ? name.slice(5) : name;
}

export function createUser(state: VisitorState, scriptName: string, input: UserInput = {}): TargetUser {
  const headers = Object.fromEntries(
    Object.entries(input.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
  );
  const locals = (state.locals[scriptName] ??= {});

  return Object.freeze({
    get(name: string): unknown {
      const key = stripUserPrefix(name);
      return Object.prototype.hasOwnProperty.call(state.attributes, key) ? state.attributes[key] : null;
    },
    getLocal(name: string): unknown {
      return Object.prototype.hasOwnProperty.call(locals, name) ? locals[name] : null;
    },
    setLocal(name: string, value: unknown): void {
      locals[name] = value;
    },
    header(name: string): string | null {
      const key = name.toLowerCase();
      return Object.prototype.hasOwnProperty.call(headers, key) ? headers[key] : null;
    },
    activeCampaigns: Object.freeze([...(input.activeCampaigns ?? [])]),
    activeActivities: Object.freeze([...(input.activeActivities ?? input.activeCampaigns ?? [])]),
    pcId: input.pcId ?? "",
    sessionId: input.sessionId ?? "",
    categoryAffinity: input.categoryAffinity ?? null,
    categoryAffinities: Object.freeze([...(input.categoryAffinities ?? [])]),
    isFirstSession: input.isFirstSession ?? false,
    isNewSession: input.isNewSession ?? false,
    daysSinceLastVisit: input.daysSinceLastVisit ?? 0,
    browser: input.browser ?? input.headers?.["user-agent"] ?? headers["user-agent"] ?? null,
    browserType: input.browserType ?? null,
  });
}
