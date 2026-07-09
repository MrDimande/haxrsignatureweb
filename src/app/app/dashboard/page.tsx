import { Suspense } from "react";
import DashboardPageClient from "@/components/app/dashboard/DashboardPageClient";
import DashboardSkeleton from "@/components/app/dashboard/DashboardSkeleton";
import { getCurrentAppSession } from "@/lib/auth/app-session";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { DEFAULT_DASHBOARD_EVENT_ID } from "@/lib/dashboard/mock-dashboard-data";

type DashboardPageProps = {
  searchParams?: Promise<{ eventId?: string; demo?: string }>;
};

async function DashboardDemoContent({ eventId }: { eventId: string }) {
  const result = await getDashboardData(eventId);
  return <DashboardPageClient initialResult={result} eventId={eventId} demoMode />;
}

export default async function DashboardOverviewPage({ searchParams }: DashboardPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const isDemo = params?.demo === DEFAULT_DASHBOARD_EVENT_ID;
  const eventId = params?.eventId?.trim() || DEFAULT_DASHBOARD_EVENT_ID;
  const session = await getCurrentAppSession();

  if (isDemo) {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardDemoContent eventId={eventId} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPageClient
        eventId={eventId}
        profileActiveEventId={session.profile?.active_client_event_id ?? null}
      />
    </Suspense>
  );
}
