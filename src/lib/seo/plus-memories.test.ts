import assert from "node:assert/strict";
import test from "node:test";
import {
  footerLinkGroups,
  navGroups,
} from "@/lib/marketing/navigation";
import { marketingPagesSeo } from "@/lib/marketing/seo";
import { buildMarketingSitemapEntries } from "@/lib/seo/sitemap-config";

test("Plus Memories stays discoverable through SEO and navigation", () => {
  assert.equal(marketingPagesSeo.plusMemories.path, "/plus-memories");

  const sitemapEntry = buildMarketingSitemapEntries().find(
    (entry) => entry.path === "/plus-memories"
  );
  assert.deepEqual(sitemapEntry, {
    path: "/plus-memories",
    priority: 0.93,
    changeFrequency: "weekly",
    tier: "service",
  });

  const services = navGroups.find((group) => group.id === "servicos");
  assert.ok(services?.links.some((link) => link.href === "/plus-memories"));
  assert.ok(
    footerLinkGroups.some((group) =>
      group.links.some((link) => link.href === "/plus-memories")
    )
  );
});
