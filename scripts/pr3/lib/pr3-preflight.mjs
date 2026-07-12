import {
  CLONE_REF,
  PRODUCTION_REF,
  resolvePr3PoolerEnv,
  sanitizePoolerEndpoint,
  validatePr3Env,
} from "./pr3-guards.mjs";
import { resolvePgBin, runCapture } from "./pr3-tools.mjs";

const PREFLIGHT_SQL =
  "SELECT current_database() AS current_database, current_user AS current_user, session_user AS session_user;";

function runPsqlPreflight(libpqUrl, password, readOnly) {
  const psql = resolvePgBin("psql");
  const args = ["-X", "-v", "ON_ERROR_STOP=1", "-t", "-A", "-F", "|", "-c", PREFLIGHT_SQL, libpqUrl];
  if (readOnly) {
    process.env.PGOPTIONS = "-c default_transaction_read_only=on";
  }
  const result = runCapture(psql, args, { PGPASSWORD: password });
  delete process.env.PGOPTIONS;

  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "").trim();
    throw new Error(err.slice(0, 1500) || "psql preflight failed");
  }

  const line = result.stdout.trim().split(/\r?\n/).find((l) => l.includes("|"));
  if (!line) {
    throw new Error("psql preflight returned no data");
  }
  const [current_database, current_user, session_user] = line.split("|");
  return { current_database, current_user, session_user };
}

export async function runPreflight({ sourceUrl, destUrl, sourcePw, destPw, readOnlySource = true }) {
  const source = runPsqlPreflight(sourceUrl, sourcePw, readOnlySource);
  const dest = runPsqlPreflight(destUrl, destPw, false);

  const sourceOk =
    source.current_user === `postgres.${PRODUCTION_REF}` ||
    source.session_user === `postgres.${PRODUCTION_REF}` ||
    source.current_user === "postgres";
  const destOk =
    dest.current_user === `postgres.${CLONE_REF}` ||
    dest.session_user === `postgres.${CLONE_REF}` ||
    dest.current_user === "postgres";

  return {
    source: { ...source, pass: sourceOk, expectedRef: PRODUCTION_REF },
    dest: { ...dest, pass: destOk, expectedRef: CLONE_REF },
    pass: sourceOk && destOk,
  };
}

export async function mainPreflightCli() {
  const pooler = resolvePr3PoolerEnv();
  if (pooler.abort) {
    console.log(JSON.stringify({ pass: false, reason: pooler.reason }, null, 2));
    process.exit(2);
  }

  const env = validatePr3Env();
  if (env.abort) {
    console.log(JSON.stringify({ pass: false, phase: "validate", reason: env.reason, env }, null, 2));
    process.exit(2);
  }

  const endpoints = {
    source: sanitizePoolerEndpoint(
      process.env.PR3_SOURCE_POOLER_HOST,
      process.env.PR3_SOURCE_POOLER_USER,
    ),
    dest: sanitizePoolerEndpoint(
      process.env.PR3_DEST_POOLER_HOST,
      process.env.PR3_DEST_POOLER_USER,
    ),
  };

  try {
    const result = await runPreflight({
      sourceUrl: process.env.PR3_SOURCE_DATABASE_URL.trim(),
      destUrl: process.env.PR3_DEST_DATABASE_URL.trim(),
      sourcePw: process.env.PR3_SOURCE_PGPASSWORD.trim(),
      destPw: process.env.PR3_DEST_PGPASSWORD.trim(),
    });

    console.log(
      JSON.stringify(
        {
          pass: result.pass,
          productionTouched: false,
          endpoints,
          preflight: result,
        },
        null,
        2,
      ),
    );
    process.exit(result.pass ? 0 : 1);
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          pass: false,
          productionTouched: false,
          endpoints,
          error: error.message,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }
}
