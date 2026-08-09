import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const hookSource = readFileSync(
  new URL("../../hooks/use-app-event.ts", import.meta.url),
  "utf8"
);

test("initial app event state remains hydration-safe", () => {
  assert.match(
    hookSource,
    /useState<AppEventState>\(INITIAL_APP_EVENT_STATE\)/,
    "the first browser render must reuse the server-safe event state"
  );
  assert.doesNotMatch(
    hookSource,
    /useState<AppEventState>\(\(\) => resolveAppEvent\(\)\)/,
    "browser storage must not be read from the initial state initializer"
  );
});
