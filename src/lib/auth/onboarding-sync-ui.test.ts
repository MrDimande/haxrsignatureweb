import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(
  new URL("../../components/app/OnboardingSyncController.tsx", import.meta.url),
  "utf8",
);

test("onboarding sync notices clear the 72px app header", () => {
  assert.doesNotMatch(source, /\btop-16\b/);
  assert.equal(source.match(/top-\[84px\]/g)?.length, 2);
});
