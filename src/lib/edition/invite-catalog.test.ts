import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  AUTHORIZED_EDITION_HOSTS,
  buildEditionInviteUrl,
  getEditionInviteRef,
  isAuthorizedEditionInviteUrl,
  resolveEditionInviteAssociation,
  resolveEditionInviteSlug,
} from "./invite-catalog";

describe("Edition invite catalog", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_EDITION_SITE_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("maps jessica-samuel-wedding to public slug jessicasamuelwedding", () => {
    assert.equal(
      resolveEditionInviteSlug("jessica-samuel-wedding"),
      "jessicasamuelwedding"
    );
    assert.equal(
      buildEditionInviteUrl("jessica-samuel-wedding"),
      "https://edition.haxrsignature.com/jessicasamuelwedding"
    );
    assert.equal(
      resolveEditionInviteSlug("jessica-samuel"),
      "jessicasamuelwedding"
    );
  });
  it("maps queen-kailane-luz-da-graca to public slug queenkailanecrisma as active invitation", () => {
    assert.equal(
      resolveEditionInviteSlug("queen-kailane-luz-da-graca"),
      "queenkailanecrisma"
    );
    const ref = getEditionInviteRef("queen-kailane-luz-da-graca");
    assert.ok(ref);
    assert.equal(ref.registryKey, "queen-kailane-luz-da-graca");
    assert.equal(ref.inviteSlug, "queenkailanecrisma");
    assert.equal(ref.status, "active");
    assert.equal(ref.experienceType, "invitation");
    assert.equal(ref.label, "Edition · Crisma · Queen Kailane Cande");
    assert.equal(
      buildEditionInviteUrl("queen-kailane-luz-da-graca"),
      "https://edition.haxrsignature.com/queenkailanecrisma"
    );
  });

  it("maps nian-night-of-the-web to public slug nianwebnight as active invitation", () => {
    assert.equal(
      resolveEditionInviteSlug("nian-night-of-the-web"),
      "nianwebnight"
    );
    const ref = getEditionInviteRef("nian-night-of-the-web");
    assert.ok(ref);
    assert.equal(ref.registryKey, "nian-night-of-the-web");
    assert.equal(ref.inviteSlug, "nianwebnight");
    assert.equal(ref.status, "active");
    assert.equal(ref.experienceType, "invitation");
    assert.equal(ref.label, "Edition · Aniversário · Nian");
    assert.equal(
      buildEditionInviteUrl("nian-night-of-the-web"),
      "https://edition.haxrsignature.com/nianwebnight"
    );
  });
  it("maps traditional-wedding to jessicaesamueltraditionalwedding", () => {
    assert.equal(
      resolveEditionInviteSlug("traditional-wedding"),
      "jessicaesamueltraditionalwedding"
    );
    assert.equal(
      buildEditionInviteUrl("traditional-wedding"),
      "https://edition.haxrsignature.com/jessicaesamueltraditionalwedding"
    );
  });

  it("never resolves traditional-wedding to rose-elegance or lingerie slug", () => {
    const slug = resolveEditionInviteSlug("traditional-wedding");
    assert.notEqual(slug, "jessicachadelingerie");
    assert.notEqual(slug, "rose-elegance");
    const ref = getEditionInviteRef("traditional-wedding");
    assert.ok(ref);
    assert.notEqual(ref.inviteSlug, "jessicachadelingerie");
  });

  it("keeps rose-elegance independent of traditional-wedding", () => {
    assert.equal(resolveEditionInviteSlug("rose-elegance"), "jessicachadelingerie");
    assert.notEqual(
      resolveEditionInviteSlug("traditional-wedding"),
      resolveEditionInviteSlug("rose-elegance")
    );
  });

  it("unknown registry returns null without fallback", () => {
    assert.equal(resolveEditionInviteSlug("unknown-registry-xyz"), null);
    assert.equal(buildEditionInviteUrl("unknown-registry-xyz"), null);
    const association = resolveEditionInviteAssociation("unknown-registry-xyz");
    assert.equal(association.state, "unknown_registry");
    assert.equal(association.inviteUrl, null);
  });

  it("missing registry key yields missing state", () => {
    const association = resolveEditionInviteAssociation("");
    assert.equal(association.state, "missing");
  });

  it("builds URL only on authorized Edition domain", () => {
    const url = buildEditionInviteUrl("traditional-wedding");
    assert.ok(url);
    assert.ok(url.startsWith("https://edition.haxrsignature.com/"));
    assert.ok(isAuthorizedEditionInviteUrl(url));
    assert.equal(
      AUTHORIZED_EDITION_HOSTS.includes("edition.haxrsignature.com"),
      true
    );
  });

  it("rejects arbitrary domains for preview URLs", () => {
    assert.equal(
      isAuthorizedEditionInviteUrl("https://evil.example/jessicaesamueltraditionalwedding"),
      false
    );
    process.env.NEXT_PUBLIC_EDITION_SITE_URL = "https://evil.example";
    assert.equal(buildEditionInviteUrl("traditional-wedding"), null);
    const association = resolveEditionInviteAssociation("traditional-wedding");
    assert.equal(association.state, "invalid_config");
  });

  it("allows localhost Edition origin for local admin preview", () => {
    process.env.NEXT_PUBLIC_EDITION_SITE_URL = "http://localhost:3001";
    assert.equal(
      buildEditionInviteUrl("traditional-wedding"),
      "http://localhost:3001/jessicaesamueltraditionalwedding"
    );
  });
});
