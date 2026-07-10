import DashboardShell from "@/components/app/dashboard/DashboardShell";

export default function DashboardSkeleton() {
  return (
    <DashboardShell>
      <div className="animate-pulse space-y-10">
        <div className="flex flex-col justify-between gap-4 border-b border-brand-champagne/10 pb-6 md:flex-row">
          <div className="space-y-3">
            <div className="h-3 w-40 rounded bg-white/10" />
            <div className="h-9 w-72 max-w-full rounded bg-white/10" />
            <div className="h-4 w-96 max-w-full rounded bg-white/5" />
          </div>
          <div className="h-12 w-44 rounded-xl bg-white/5" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="h-56 rounded-3xl bg-white/5 lg:col-span-5" />
          <div className="h-56 rounded-3xl bg-white/5 lg:col-span-7" />
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-28 rounded-2xl bg-white/5" />
          ))}
        </div>

        <div className="h-48 rounded-3xl bg-white/5" />
        <div className="h-64 rounded-3xl bg-white/5" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="h-80 rounded-3xl bg-white/5 lg:col-span-5" />
          <div className="h-80 rounded-3xl bg-white/5 lg:col-span-4" />
          <div className="h-80 rounded-3xl bg-white/5 lg:col-span-3" />
        </div>
      </div>
    </DashboardShell>
  );
}
