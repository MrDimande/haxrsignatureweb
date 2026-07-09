import type { User } from "@supabase/supabase-js";

export type ClientAppProfile = {
  id: string;
  full_name: string | null;
  app_role: string | null;
  active_client_event_id: string | null;
};

export type AppUserDisplay = {
  name: string;
  email: string;
  roleLabel: string;
  initials: string;
};

const ROLE_LABELS: Record<string, string> = {
  client: "Cliente",
  planner: "Planner",
  admin: "Admin",
};

function normalizeName(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function buildInitials(nameOrEmail: string): string {
  const source = nameOrEmail.trim();
  if (!source) return "HA";

  const [beforeAt] = source.split("@");
  const words = beforeAt
    .replace(/[^a-zA-ZÀ-ÿ0-9\s.-]/g, " ")
    .split(/[\s.-]+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return (words[0]?.slice(0, 2) || "HA").toUpperCase();
}

export function resolveAppRoleLabel(appRole: string | null | undefined): string {
  if (!appRole) return "Cliente";
  return ROLE_LABELS[appRole] ?? appRole;
}

export function buildAppUserDisplay(input: {
  user: Pick<User, "email" | "user_metadata"> | null;
  profile: Pick<ClientAppProfile, "full_name" | "app_role"> | null;
}): AppUserDisplay {
  const email = input.user?.email?.trim() || "utilizador autenticado";
  const metadataName =
    typeof input.user?.user_metadata?.full_name === "string"
      ? input.user.user_metadata.full_name
      : null;
  const name = normalizeName(input.profile?.full_name) ?? normalizeName(metadataName) ?? email;
  const roleLabel = resolveAppRoleLabel(input.profile?.app_role);

  return {
    name,
    email,
    roleLabel,
    initials: buildInitials(name || email),
  };
}
