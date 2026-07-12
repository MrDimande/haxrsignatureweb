import { getPortalDashboardData } from "@/lib/portal/services/portal-dashboard.service";

export async function loadPortalPage(token: string) {
  return getPortalDashboardData(token);
}

export function PortalSectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-8 space-y-2">
      <h2 className="font-serif text-2xl md:text-3xl font-light">{title}</h2>
      {description ? <p className="text-sm text-grey/55 max-w-2xl">{description}</p> : null}
    </header>
  );
}
