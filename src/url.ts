/**
 * The `page`, `landing` and `referrer` objects Target exposes to profile scripts.
 * Same shape for all three: url, protocol, domain, query, param(name).
 *
 * Target documents `page.domain` as "everything before the first slash" and
 * `page.query` as "everything after the ?". Missing values are empty strings,
 * which is what scripts written against Target expect to test for.
 */
export interface TargetUrl {
  readonly url: string;
  readonly protocol: string;
  readonly domain: string;
  readonly query: string;
  param(name: string): string;
}

export function createTargetUrl(url: string | undefined | null): TargetUrl {
  const raw = url ?? "";
  let protocol = "";
  let domain = "";
  let query = "";
  let params: URLSearchParams = new URLSearchParams();

  if (raw) {
    try {
      const u = new URL(raw);
      protocol = u.protocol.replace(/:$/, "");
      domain = u.host;
      query = u.search.replace(/^\?/, "");
      params = u.searchParams;
    } catch {
      // Not an absolute URL. Keep the raw string and whatever query we can find,
      // the way Target keeps going instead of failing the script.
      const q = raw.indexOf("?");
      if (q >= 0) {
        query = raw.slice(q + 1);
        params = new URLSearchParams(query);
      }
    }
  }

  return Object.freeze({
    url: raw,
    protocol,
    domain,
    query,
    param(name: string): string {
      return params.get(name) ?? "";
    },
  });
}
