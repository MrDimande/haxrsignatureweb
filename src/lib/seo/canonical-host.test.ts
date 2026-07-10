import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  CANONICAL_HOST,
  isCanonicalHost,
  isVercelPreviewDeployment,
  shouldRedirectToCanonical,
} from "./canonical-host";

const PREVIEW_HOST = "haxrsignatureweb-git-rebuild-h-800603-alberto-dimandes-projects.vercel.app";

function withVercelEnv(value: string | undefined, fn: () => void): void {
  const previous = process.env.VERCEL_ENV;
  if (value === undefined) {
    delete process.env.VERCEL_ENV;
  } else {
    process.env.VERCEL_ENV = value;
  }

  try {
    fn();
  } finally {
    if (previous === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = previous;
    }
  }
}

afterEach(() => {
  delete process.env.VERCEL_ENV;
});

describe("canonical-host", () => {
  it("isCanonicalHost matches www.haxrsignature.com only", () => {
    assert.equal(isCanonicalHost(CANONICAL_HOST), true);
    assert.equal(isCanonicalHost("haxrsignature.com"), false);
    assert.equal(isCanonicalHost(PREVIEW_HOST), false);
  });

  it("isVercelPreviewDeployment is true only when VERCEL_ENV=preview", () => {
    withVercelEnv("preview", () => {
      assert.equal(isVercelPreviewDeployment(), true);
    });
    withVercelEnv("production", () => {
      assert.equal(isVercelPreviewDeployment(), false);
    });
    withVercelEnv(undefined, () => {
      assert.equal(isVercelPreviewDeployment(), false);
    });
  });

  it("shouldRedirectToCanonical returns false for *.vercel.app on preview deployment", () => {
    withVercelEnv("preview", () => {
      assert.equal(shouldRedirectToCanonical(PREVIEW_HOST), false);
      assert.equal(shouldRedirectToCanonical("haxrsignature.vercel.app"), false);
    });
  });

  it("shouldRedirectToCanonical returns true for *.vercel.app on production deployment", () => {
    withVercelEnv("production", () => {
      assert.equal(shouldRedirectToCanonical(PREVIEW_HOST), true);
      assert.equal(shouldRedirectToCanonical("haxrsignature.vercel.app"), true);
    });
  });

  it("shouldRedirectToCanonical returns true for non-canonical hosts on production", () => {
    withVercelEnv("production", () => {
      assert.equal(shouldRedirectToCanonical("haxrsignature.com"), true);
    });
  });

  it("shouldRedirectToCanonical returns false for canonical host on production", () => {
    withVercelEnv("production", () => {
      assert.equal(shouldRedirectToCanonical(CANONICAL_HOST), false);
    });
  });

  it("without VERCEL_ENV preserves safe local behaviour", () => {
    withVercelEnv(undefined, () => {
      assert.equal(shouldRedirectToCanonical("localhost:3000"), false);
      assert.equal(shouldRedirectToCanonical(PREVIEW_HOST), true);
      assert.equal(shouldRedirectToCanonical(CANONICAL_HOST), false);
    });
  });
});
