/**
 * PR.4 — valida refs origem/destino (sem imprimir URLs).
 */
import "./load-env.mjs";

const PRODUCTION_REF = "oxsrdmydlqyvnueedgtl";
const DRY_RUN_REF = "rkkxfrwtmsqzpnbkshnd";

export function validatePr4Env() {
  const source = process.env.PR4_SOURCE_DATABASE_URL?.trim() ?? "";
  const dest = process.env.PR4_DATABASE_URL?.trim() ?? "";

  const result = {
    sourceSet: Boolean(source),
    destSet: Boolean(dest),
    sourceHasProductionRef: source.includes(PRODUCTION_REF),
    destHasDryRunRef: dest.includes(DRY_RUN_REF),
    swapped:
      source.includes(DRY_RUN_REF) && dest.includes(PRODUCTION_REF),
    abort: false,
  };

  if (!result.sourceSet || !result.destSet) {
    result.abort = true;
    result.reason = "missing_env";
    return result;
  }

  if (result.swapped) {
    result.abort = true;
    result.reason = "refs_swapped";
    return result;
  }

  if (!result.sourceHasProductionRef || !result.destHasDryRunRef) {
    result.abort = true;
    result.reason = "invalid_refs";
    return result;
  }

  if (dest.includes(PRODUCTION_REF)) {
    result.abort = true;
    result.reason = "dest_points_to_production";
  }

  return result;
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  const v = validatePr4Env();
  console.log(
    JSON.stringify(
      {
        sourceSet: v.sourceSet,
        destSet: v.destSet,
        sourceHasProductionRef: v.sourceHasProductionRef,
        destHasDryRunRef: v.destHasDryRunRef,
        swapped: v.swapped,
        abort: v.abort,
        reason: v.reason ?? null,
      },
      null,
      2,
    ),
  );
  process.exit(v.abort ? 2 : 0);
}
