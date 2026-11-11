/**
 * The `mbox` object: the location request the script is running for.
 * `mbox.name` and `mbox.param(name)`, per Adobe's reference.
 */
export interface TargetMbox {
  readonly name: string;
  param(name: string): string;
}

export function createMbox(name: string | undefined, params: Record<string, string> = {}): TargetMbox {
  return Object.freeze({
    name: name ?? "",
    param(key: string): string {
      return Object.prototype.hasOwnProperty.call(params, key) ? params[key] : "";
    },
  });
}
