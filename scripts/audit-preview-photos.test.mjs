import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import test from "node:test";

const ROOT = process.cwd();

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    return entry.isDirectory()
      ? filesUnder(fullPath)
      : /\.(?:ts|tsx|mts|cts|mjs|cjs)$/.test(entry.name)
        ? [fullPath]
        : [];
  });
}

function runtimeSourceFiles() {
  return filesUnder(join(ROOT, "src")).filter(
    (file) => !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file),
  );
}

function hasValueImportOfDatabaseTypes(source) {
  const specifier = "@/lib/supabase/database.types";
  let index = source.indexOf(specifier);

  while (index >= 0) {
    const importStart = source.lastIndexOf("import", index);
    const declaration = source.slice(importStart, index);
    if (!/^import\s+type\b/.test(declaration)) return true;
    index = source.indexOf(specifier, index + specifier.length);
  }

  return false;
}

test("zero Supabase runtime boundary", () => {
  const packageJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const declared = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  assert.equal(declared["@supabase/ssr"], undefined);
  assert.equal(declared["@supabase/supabase-js"], undefined);
  assert.equal(declared.supabase, undefined);

  const lockfile = readFileSync(join(ROOT, "package-lock.json"), "utf8");
  assert.equal(lockfile.includes('"node_modules/@supabase/ssr"'), false);
  assert.equal(lockfile.includes('"node_modules/@supabase/supabase-js"'), false);

  const sourceFiles = runtimeSourceFiles();
  const sdkImportViolations = sourceFiles
    .filter((file) =>
      /(?:from\s*["']@supabase\/|import\s*\(\s*["']@supabase\/|require\(\s*["']@supabase\/)/.test(
        readFileSync(file, "utf8"),
      ),
    )
    .map((file) => relative(ROOT, file));

  assert.deepEqual(sdkImportViolations, []);

  const retiredAdapterFiles = sourceFiles
    .filter((file) => /\.supabase\.[cm]?[jt]sx?$/.test(basename(file)))
    .map((file) => relative(ROOT, file));
  assert.deepEqual(retiredAdapterFiles, []);

  const legacyFacadeFiles = [
    "src/lib/supabase/browser.ts",
    "src/lib/supabase/config.ts",
    "src/lib/supabase/middleware-auth.ts",
    "src/lib/supabase/server-auth.ts",
    "src/lib/supabase/server.ts",
  ];
  assert.deepEqual(
    legacyFacadeFiles.filter((file) => existsSync(join(ROOT, file))),
    [],
  );

  const facadeImportViolations = sourceFiles
    .filter((file) => {
      const source = readFileSync(file, "utf8");
      return /(?:from\s*["']@\/lib\/supabase\/(?!database\.types["'])|import\s*\(\s*["']@\/lib\/supabase\/|require\(\s*["']@\/lib\/supabase\/)/.test(
        source,
      );
    })
    .map((file) => relative(ROOT, file));
  assert.deepEqual(facadeImportViolations, []);

  const nonTypeMetadataImports = sourceFiles
    .filter((file) => {
      const source = readFileSync(file, "utf8");
      return hasValueImportOfDatabaseTypes(source);
    })
    .map((file) => relative(ROOT, file));
  assert.deepEqual(nonTypeMetadataImports, []);

  const legacyEnvironmentReferences = sourceFiles
    .filter((file) => /(?:NEXT_PUBLIC_SUPABASE_|SUPABASE_SERVICE_ROLE_KEY)/.test(readFileSync(file, "utf8")))
    .map((file) => relative(ROOT, file));
  assert.deepEqual(legacyEnvironmentReferences, []);
});
