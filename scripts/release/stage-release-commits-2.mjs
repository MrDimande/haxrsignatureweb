#!/usr/bin/env node
import { execSync } from "node:child_process";
process.chdir(new URL("../..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
}

function commitGroup(message, paths) {
  for (const p of paths) {
    try { run(`git add "${p}"`); } catch { /* */ }
  }
  const staged = run("git diff --cached --name-only").trim();
  if (!staged) return;
  try { run("git diff --cached --check"); } catch { /* warn */ }
  run(`git commit -m "${message.replace(/"/g, '\\"')}"`);
  console.log("✓", message);
}

const groups = [
  ["feat(events): improve guest and event operations", [
    "src/app/api/events", "src/app/api/v1", "src/app/api/cron/post-event-reports",
    "src/lib/events", "scripts/contract", "scripts/post-migration-phase2-google-sheets-smoke.mjs",
    "scripts/post-migration-phase2-rsvp-sync.mjs",
  ]],
  ["feat(email): update transactional and marketing communication", [
    "src/app/api/marketing", "src/app/api/contact", "src/lib/brevo", "src/lib/email",
    "docs/BREVO_CAMPAIGNS.md", "scripts/brevo-ensure-lists.mjs", "scripts/create-marketing-draft.mjs",
    "scripts/marketing-pilot-info.mjs", "scripts/test-brevo-email.mjs", "scripts/contact-capture-readiness.mjs",
    "scripts/post-migration-contact-capture.mjs", "scripts/verify-audit-contacts.mjs",
  ]],
  ["chore(config): update Next.js config and global styling", [
    "next.config.ts", "vercel.json", "src/app/globals.css", "src/app/layout.tsx",
  ]],
  ["docs: update operational documentation and tooling", [
    "docs/036_CLIENT_APP_AUTH_REVIEW.md", "docs/036_STAGING_VALIDATION_REPORT.md", "docs/ADMIN_RSVP_SYNC.md",
    "docs/CONCIERGE_ADMIN_RUNBOOK.md", "docs/CONTACT_CAPTURE.md", "docs/HAXR_CONCIERGE_SPEC.md",
    "docs/MARKETING_PILOT_LAUNCH.md", "docs/ONBOARDING_EVENT_CREATION_SPEC.md",
    "docs/P1.2-RSVP-PROXY-PRODUCTION-ACTIVATION.md", "docs/P1A-RSVP-PROXY-RUNBOOK.md",
    "docs/benchmark", "docs/openapi", "scripts/pr4", "scripts/release",
  ]],
];

for (const [msg, paths] of groups) commitGroup(msg, paths);

const exclude = new Set(["tsconfig.tsbuildinfo", "PR_BODY.md", "with-next-image-working", "scripts/contract/_bypass-body.json"]);
const remaining = run("git status --porcelain").split("\n").map((l) => l.slice(3).trim()).filter((p) => p && !exclude.has(p));
if (remaining.length) {
  console.log("Remaining:", remaining.length);
  commitGroup("chore: include remaining platform updates", remaining);
}
console.log(run("git log origin/main..HEAD --oneline"));
