export function safeAdminRedirectPath(from: string | null | undefined): string {
  if (!from || !from.startsWith("/admin/") || from.startsWith("//")) {
    return "/admin/dashboard";
  }
  return from;
}
