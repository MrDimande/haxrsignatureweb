/** Retired write entrypoint. Kept only to fail closed for old commands. */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function main() {
  throw new Error("photo_apply_disabled_use_read_only_audit");
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  console.error("[gate-2c-photos] blocked photo_apply_disabled_use_read_only_audit");
  process.exitCode = 1;
}
