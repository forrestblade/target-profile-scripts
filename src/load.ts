import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import type { ProfileScript } from "./run.js";

/** Reads a .js file as a profile script. The script name is the file name without extension. */
export function loadScript(path: string): ProfileScript {
  return { name: basename(path, extname(path)), source: readFileSync(path, "utf8") };
}

export function loadScripts(paths: string[]): ProfileScript[] {
  return paths.map(loadScript);
}
