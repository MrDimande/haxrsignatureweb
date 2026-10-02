import { buildAppUserDisplay, type AppUserDisplay, type ClientAppProfile } from "@/lib/auth/app-user-display";
import { displayPortalSession, getCurrentPortalSession } from "@/lib/portal-auth/portal-auth.server";

export type CurrentAppSession = {
  user: { id: string; email: string | null } | null;
  profile: ClientAppProfile | null;
  display: AppUserDisplay;
};

function anonymousSession(): CurrentAppSession {
  return {
    user: null,
    profile: null,
    display: buildAppUserDisplay({ user: null, profile: null }),
  };
}

/** The only runtime identity source for /app is the private HAXR portal session. */
export async function getCurrentAppSession(): Promise<CurrentAppSession> {
  try {
    const session = await getCurrentPortalSession();
    if (!session) return anonymousSession();
    return {
      user: { id: session.profileId, email: session.email },
      profile: session.profile,
      display: displayPortalSession(session),
    };
  } catch {
    return anonymousSession();
  }
}
