/**
 * PR.3 — preflight read-only origem + destino (Session pooler).
 * Aborta antes de backup se falhar. Não imprime passwords.
 */
import { mainPreflightCli } from "./lib/pr3-preflight.mjs";

await mainPreflightCli();
