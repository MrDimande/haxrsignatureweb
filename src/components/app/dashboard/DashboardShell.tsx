import type { ReactNode } from "react";

type DashboardShellProps = {
  children: ReactNode;
};

export default function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="haxr-dashboard-shell select-none space-y-10 pb-12 text-left">
      {children}
    </div>
  );
}
