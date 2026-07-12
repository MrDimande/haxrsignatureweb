# Release staging helper — run from repo root on release/haxr-platform-current
$ErrorActionPreference = "Stop"
Set-Location (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)

function Commit-Group {
    param([string]$Message, [string[]]$Paths)
    if ($Paths.Count -eq 0) { return }
    git add -- @Paths 2>$null
    $staged = git diff --cached --name-only
    if (-not $staged) { return }
    git diff --cached --check
    if ($LASTEXITCODE -ne 0) { throw "whitespace check failed for $Message" }
    git commit -m $Message
}

# Exclude artifacts
git reset HEAD 2>$null
git clean -fd --dry-run tsconfig.tsbuildinfo 2>$null | Out-Null

# 1 Assets
Commit-Group "chore(assets): add production visual assets" @(
    "public/images/backgrounds",
    "public/images/brand/haxr-mark-gold.png",
    "public/images/categories",
    "public/images/hero",
    "public/images/magazine",
    "public/images/tools"
)

# 2 Marketing / site
Commit-Group "feat(marketing): refresh HAXR website experience" @(
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
    "src/components/ui/WhatsAppFloat.tsx"
)

# 3 Auth + client app
Commit-Group "feat(app): client sign-in, onboarding and app shell" @(
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
    "src/middleware.ts"
)

# 4 Portal
Commit-Group "feat(portal): complete client portal experience" @(
    "src/app/portal",
    "src/app/api/portal",
    "src/components/portal",
    "src/lib/portal",
    "scripts/smoke-portal-v2.mjs"
)

# 5 Concierge
Commit-Group "feat(concierge): expand concierge workflows" @(
    "src/app/api/concierge",
    "src/app/app/concierge",
    "src/components/app/concierge",
    "src/components/concierge",
    "src/lib/concierge",
    "scripts/concierge-preflight.mjs"
)

# 6 Admin
Commit-Group "feat(admin): improve operational dashboard and management flows" @(
    "src/app/admin",
    "src/app/api/admin",
    "src/components/admin",
    "src/components/events",
    "src/lib/admin",
    "src/lib/finance",
    "src/lib/invoice-generator.ts",
    "src/lib/pdf.tsx",
    "src/lib/contact"
)

# 7 Events / RSVP / Edition API
Commit-Group "feat(events): improve guest and event operations" @(
    "src/app/api/events",
    "src/app/api/v1",
    "src/app/api/cron/post-event-reports",
    "src/lib/events",
    "scripts/contract",
    "scripts/post-migration-phase2-google-sheets-smoke.mjs",
    "scripts/post-migration-phase2-rsvp-sync.mjs"
)

# 8 Email / Brevo / marketing API
Commit-Group "feat(email): update transactional and marketing communication" @(
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
    "scripts/verify-audit-contacts.mjs"
)

# 9 Config / global styles
Commit-Group "chore(config): update Next.js config and global styling" @(
    "next.config.ts",
    "vercel.json",
    "src/app/globals.css",
    "src/app/layout.tsx"
)

# 10 Docs + tooling scripts
Commit-Group "docs: update operational documentation and tooling" @(
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
    "scripts/pr4"
)

# Remaining catch-all
$remaining = git status --porcelain | ForEach-Object { $_.Substring(3).Trim() } | Where-Object {
    $_ -ne "tsconfig.tsbuildinfo" -and $_ -ne "PR_BODY.md"
}
if ($remaining) {
    Write-Host "Remaining files:" ($remaining -join ", ")
    Commit-Group "chore: include remaining platform updates" $remaining
}

Write-Host "Done. Log:"
git log origin/main..HEAD --oneline
