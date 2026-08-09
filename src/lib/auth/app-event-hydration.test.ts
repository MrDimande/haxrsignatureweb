import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildAppNavigation } from "@/lib/event-modules/module-config";

const hookSource = readFileSync(
  new URL("../../hooks/use-app-event.ts", import.meta.url),
  "utf8"
);

test("initial app event state remains hydration-safe", () => {
  assert.match(
    hookSource,
    /useState<AppEventState>\(\(\) =>\s*createInitialAppEventState\(initialEventId\)/,
    "the first browser render must use only the server-provided event id",
  );
  assert.doesNotMatch(
    hookSource,
    /useState<AppEventState>\(\(\) => resolveAppEvent\(\)\)/,
    "browser storage must not be read from the initial state initializer",
  );
});

test("event-scoped navigation stays inert until the active event is resolved", () => {
  const pendingItems = buildAppNavigation(null).flatMap((group) => group.items);
  const disabledItems = pendingItems.filter((item) => item.disabled);

  assert.ok(disabledItems.length > 0);
  assert.ok(disabledItems.every((item) => item.href === "/app/dashboard"));

  const eventId = "d396c066-a0b5-4658-a101-6f0778fb82fc";
  const resolvedItems = buildAppNavigation(eventId).flatMap((group) => group.items);
  assert.ok(resolvedItems.every((item) => !item.disabled));
  assert.ok(
    resolvedItems.some((item) => item.href === `/app/events/${eventId}/guests`),
  );
});
