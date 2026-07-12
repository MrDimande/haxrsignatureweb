import type { DashboardData } from "@/lib/dashboard/types";
import ChecklistTemplates from "@/components/app/dashboard/ChecklistTemplates";
import ConciergeSummaryCard from "@/components/app/dashboard/ConciergeSummaryCard";
import DashboardHeader from "@/components/app/dashboard/DashboardHeader";
import DashboardShell from "@/components/app/dashboard/DashboardShell";
import EventOverviewCard from "@/components/app/dashboard/EventOverviewCard";
import FinanceSnapshotCard from "@/components/app/dashboard/FinanceSnapshot";
import GuestSnapshotCard from "@/components/app/dashboard/GuestSnapshot";
import ModulesGrid from "@/components/app/dashboard/ModulesGrid";
import NextActions from "@/components/app/dashboard/NextActions";
import ProgressOverview from "@/components/app/dashboard/ProgressOverview";
import RecentActivity from "@/components/app/dashboard/RecentActivity";
import StatCard from "@/components/app/dashboard/StatCard";
import VendorSnapshot from "@/components/app/dashboard/VendorSnapshot";

type DashboardOverviewProps = {
  data: DashboardData;
};

export default function DashboardOverview({ data }: DashboardOverviewProps) {
  const checklistHref = `/app/events/${data.eventOverview.slug}/checklist`;

  return (
    <DashboardShell>
      <DashboardHeader meta={data.meta} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <EventOverviewCard event={data.eventOverview} />
        </div>
        <div className="lg:col-span-7">
          <ProgressOverview items={data.progress} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {data.stats.map((stat) => (
          <StatCard
            key={stat.id}
            stat={stat}
            currency={data.financeSnapshot.currency}
          />
        ))}
      </div>

      <ConciergeSummaryCard summary={data.conciergeSummary} />

      <ChecklistTemplates
        templates={data.checklistTemplates}
        eventName={data.eventOverview.name}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <NextActions actions={data.nextActions} checklistHref={checklistHref} />
        </div>

        <div className="flex flex-col justify-between space-y-6 lg:col-span-4">
          <FinanceSnapshotCard finance={data.financeSnapshot} />
          <GuestSnapshotCard guests={data.guestSnapshot} />
        </div>

        <div className="lg:col-span-3">
          <RecentActivity items={data.recentActivity} />
        </div>
      </div>

      <VendorSnapshot vendors={data.vendorSnapshot} />

      <ModulesGrid modules={data.modules} />
    </DashboardShell>
  );
}
