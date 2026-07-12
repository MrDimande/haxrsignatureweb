#!/usr/bin/env node
/**
 * Stage release commits — ignores git LF/CRLF stderr noise.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const root = new URL("../..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
process.chdir(root);

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
}

function commitGroup(message, paths) {
  const existing = paths.filter((p) => existsSync(p) || run(`git ls-files --error-unmatch "${p}" 2>nul || git status --porcelain "${p}" 2>nul`).trim());
  if (!existing.length) return false;
  try {
    run(`git add -- ${existing.map((p) => `"${p}"`).join(" ")}`);
  } catch {
    for (const p of existing) {
      try {
        run(`git add "${p}"`);
      } catch {
        /* skip missing */
      }
    }
  }
  const staged = run("git diff --cached --name-only").trim();
  if (!staged) return false;
  try {
    run("git diff --cached --check");
  } catch (e) {
    const out = String(e.stdout ?? e.message ?? "");
    if (!/trailing whitespace|new blank line at EOF/.test(out)) throw e;
    console.warn("whitespace check warning (continuing):", out.split("\n")[0]);
  }
  run(`git commit -m "${message.replace(/"/g, '\\"')}"`);
  console.log("✓", message);
  return true;
}

run("git reset HEAD");

const groups = [
  [
    "feat(marketing): refresh HAXR website experience",
    [
      "src/app/(marketing)",
      "src/components/home",
      "src/components/sections",
      "src/components/marketing",
      "src/components/layout/Footer.tsx",
      "src/components/layout/Nav.tsx",
      "src/components/layout/NavMegaMenu.tsx",
      "src/components/layout/NavMobileDrawer.tsx",
      "src/components/ui/BrandLogo.tsx",
      "src/components/ui/InvitationMockup.tsx",
      "src/components/ui/DetailGallery.tsx",
      "src/components/ui/DeviceLaptopFrame.tsx",
      "src/components/ui/DeviceTabletFrame.tsx",
      "src/components/ui/EventPlannerSearch.tsx",
      "src/components/ui/StickyReservationCard.tsx",
      "src/components/ui/VirtualAssistant.tsx",
      "src/components/shared",
      "src/lib/marketing",
      "src/lib/assets.ts",
      "src/lib/site-config.ts",
      "src/lib/assistant-knowledge.ts",
      "src/lib/brand",
      "src/lib/seo",
      "src/components/ui/WhatsAppFloat.tsx",
    ],
  ],
  [
    "feat(app): client sign-in, onboarding and app shell",
    [
      "src/app/(auth)",
      "src/app/app",
      "src/lib/auth",
      "src/lib/dashboard",
      "src/lib/api",
      "src/lib/supabase/config.ts",
      "src/lib/supabase/helpers.ts",
      "src/lib/supabase/database.types.ts",
      "src/lib/guests",
      "src/lib/payments",
      "src/lib/vendors",
      "src/lib/checklist",
      "src/lib/documents",
      "src/lib/edition",
      "src/middleware.ts",
    ],
  ],
  [
    "feat(portal): complete client portal experience",
    [
      "src/app/portal",
      "src/app/api/portal",
      "src/components/portal",
      "src/lib/portal",
      "scripts/smoke-portal-v2.mjs",
    ],
  ],
  [
    "feat(concierge): expand concierge workflows",
    [
      "src/app/api/concierge",
      "src/app/app/concierge",
      "src/components/app/concierge",
      "src/components/concierge",
      "src/lib/concierge",
      "scripts/concierge-preflight.mjs",
    ],
  ],
  [
    "feat(admin): improve operational dashboard and management flows",
    [
      "src/app/admin",
      "src/app/api/admin",
      "src/components/admin",
      "src/components/events",
      "src/lib/admin",
      "src/lib/finance",
      "src/lib/invoice-generator.ts",
      "src/lib/pdf.tsx",
      "src/lib/contact",
    ],
  ],
  [
    "feat(events): improve guest and event operations",
    [
      "src/app/api/events",
      "src/app/api/v1",
      "src/app/api/cron/post-event-reports",
      "src/lib/events",
      "scripts/contract",
      "scripts/post-migration-phase2-google-sheets-smoke.mjs",
      "scripts/post-migration-phase2-rsvp-sync.mjs",
    ],
  ],
  [
    "feat(email): update transactional and marketing communication",
    [
      "src/app/api/marketing",
      "src/app/api/contact",
      "src/lib/brevo",
      "src/lib/email",
      "docs/BREVO_CAMPAIGNS.md",
      "scripts/brevo-ensure-lists.mjs",
      "scripts/create-marketing-draft.mjs",
      "scripts/marketing-pilot-info.mjs",
      "scripts/test-brevo-email.mjs",
      "scripts/contact-capture-readiness.mjs",
      "scripts/post-migration-contact-capture.mjs",
      "scripts/verify-audit-contacts.mjs",
    ],
  ],
  [
    "chore(config): update Next.js config and global styling",
    ["next.config.ts", "vercel.json", "src/app/globals.css", "src/app/layout.tsx"],
  ],
  [
    "docs: update operational documentation and tooling",
    [
      "docs/036_CLIENT_APP_AUTH_REVIEW.md",
      "docs/036_STAGING_VALIDATION_REPORT.md",
      "docs/ADMIN_RSVP_SYNC.md",
      "docs/CONCIERGE_ADMIN_RUNBOOK.md",
      "docs/CONTACT_CAPTURE.md",
      "docs/HAXR_CONCIERGE_SPEC.md",
      "docs/MARKETING_PILOT_LAUNCH.md",
      "docs/ONBOARDING_EVENT_CREATION_SPEC.md",
      "docs/P1.2-RSVP-PROXY-PRODUCTION-ACTIVATION.md",
      "docs/P1A-RSVP-PROXY-RUNBOOK.md",
      "docs/benchmark",
      "docs/openapi",
      "scripts/pr4",
      "scripts/release",
    ],
  ],
];

for (const [msg, paths] of groups) {
  commitGroup(msg, paths);
}

const exclude = new Set(["tsconfig.tsbuildinfo", "PR_BODY.md"]);
const remaining = run("git status --porcelain")
  .split("\n")
  .map((l) => l.slice(3).trim())
  .filter((p) => p && !exclude.has(p));

if (remaining.length) {
  console.log("Remaining:", remaining.length);
  commitGroup("chore: include remaining platform updates", remaining);
}

console.log("\nCommits:");
console.log(run("git log origin/main..HEAD --oneline"));
