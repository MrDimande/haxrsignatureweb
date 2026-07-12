import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

export function resolvePgBin(name) {
  const pg17 = `C:\\Program Files\\PostgreSQL\\17\\bin\\${name}.exe`;
  if (existsSync(pg17)) return pg17;
  const result = spawnSync(name, ["--version"], { encoding: "utf8", stdio: "pipe" });
  const version = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (result.status === 0 && version.includes("(PostgreSQL)")) {
    return name;
  }
  throw new Error(`ABORT: ${name} PostgreSQL 17 não encontrado.`);
}

export function runCapture(bin, args, env) {
  const result = spawnSync(bin, args, {
    encoding: "utf8",
    stdio: "pipe",
    env: { ...process.env, PGSSLMODE: "require", ...env },
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

export function sha256File(filePath) {
  const hash = createHash("sha256");
  hash.update(readFileSync(filePath));
  return hash.digest("hex").toUpperCase();
}

export function fileMeta(filePath) {
  const st = statSync(filePath);
  return { bytes: st.size, sha256: sha256File(filePath) };
}

export function buildPgClientConfig(libpqUrl, password) {
  const parsed = new URL(libpqUrl);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 5432),
    database: (parsed.pathname || "/postgres").replace(/^\//, "") || "postgres",
    user: decodeURIComponent(parsed.username),
    password: password == null ? "" : String(password),
    ssl: { rejectUnauthorized: false },
  };
}

export async function withPgClient(libpqUrl, password, readOnly, fn) {
  const client = new pg.Client(buildPgClientConfig(libpqUrl, password));
  if (readOnly) {
    process.env.PGOPTIONS = "-c default_transaction_read_only=on";
  }
  await client.connect();
  if (readOnly) {
    await client.query("SET TRANSACTION READ ONLY");
  }
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => undefined);
    delete process.env.PGOPTIONS;
  }
}

export function buildNodeUrl(libpqUrl) {
  const parsed = new URL(libpqUrl);
  parsed.searchParams.set("uselibpqcompat", "true");
  return parsed.toString();
}

export function writeChecksumsManifest(backupDir, manifest) {
  const lines = [];
  for (const artefact of manifest.artefacts) {
    lines.push(`${artefact.sha256}  ${artefact.name}`);
  }
  writeFileSync(resolve(backupDir, "checksums.sha256"), `${lines.join("\n")}\n`, "utf8");
}

export function sanitizeCommand(argv) {
  return argv
    .map((part) => {
      if (/^postgres(ql)?:\/\//i.test(part)) {
        try {
          const u = new URL(part);
          return `${u.protocol}//${u.username}@${u.host}${u.pathname}`;
        } catch {
          return "<connection-string>";
        }
      }
      return part;
    })
    .join(" ");
}
