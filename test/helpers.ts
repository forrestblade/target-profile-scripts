import { fileURLToPath } from "node:url";
import { loadScript } from "../src/load.js";
import type { ProfileScript } from "../src/run.js";

export function script(name: string): ProfileScript {
  return loadScript(fileURLToPath(new URL(`../scripts/${name}.js`, import.meta.url)));
}
