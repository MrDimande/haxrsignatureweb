import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getPortfolioR2StorageConfig,
  isR2PortfolioStorageConfigured,
} from "./portfolio-storage";

const portfolioVariables = [
  "CLOUDFLARE_R2_PORTFOLIO_ENDPOINT",
  "CLOUDFLARE_R2_PORTFOLIO_REVIEW_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_PORTFOLIO_REVIEW_SECRET_ACCESS_KEY",
  "CLOUDFLARE_R2_PORTFOLIO_REVIEW_BUCKET",
  "CLOUDFLARE_R2_PORTFOLIO_PUBLIC_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_PORTFOLIO_PUBLIC_SECRET_ACCESS_KEY",
  "CLOUDFLARE_R2_PORTFOLIO_PUBLIC_BUCKET",
] as const;

test("R2 do portfólio exige configuração explícita e separada por visibilidade", () => {
  const previous = new Map(portfolioVariables.map((name) => [name, process.env[name]]));

  try {
    for (const name of portfolioVariables) delete process.env[name];
    assert.equal(isR2PortfolioStorageConfigured("review"), false);
    assert.equal(isR2PortfolioStorageConfigured("public"), false);

    process.env.CLOUDFLARE_R2_PORTFOLIO_ENDPOINT = "https://account.r2.cloudflarestorage.com";
    process.env.CLOUDFLARE_R2_PORTFOLIO_REVIEW_ACCESS_KEY_ID = "review-key";
    process.env.CLOUDFLARE_R2_PORTFOLIO_REVIEW_SECRET_ACCESS_KEY = "review-secret";
    process.env.CLOUDFLARE_R2_PORTFOLIO_REVIEW_BUCKET = "portfolio-review";

    assert.equal(isR2PortfolioStorageConfigured("review"), true);
    assert.equal(isR2PortfolioStorageConfigured("public"), false);
    assert.equal(getPortfolioR2StorageConfig("review")?.bucket, "portfolio-review");

    process.env.CLOUDFLARE_R2_PORTFOLIO_PUBLIC_ACCESS_KEY_ID = "public-key";
    process.env.CLOUDFLARE_R2_PORTFOLIO_PUBLIC_SECRET_ACCESS_KEY = "public-secret";
    process.env.CLOUDFLARE_R2_PORTFOLIO_PUBLIC_BUCKET = "portfolio-public";

    assert.equal(isR2PortfolioStorageConfigured("public"), true);
    assert.equal(getPortfolioR2StorageConfig("public")?.bucket, "portfolio-public");
  } finally {
    for (const name of portfolioVariables) {
      const value = previous.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
