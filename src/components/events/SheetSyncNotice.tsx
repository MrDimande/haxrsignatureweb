import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";

type SheetSyncNoticeProps = {
  variant: "idle" | "processing" | "success" | "error" | "info";
  title: string;
  message: string;
  hint?: string;
  detail?: ReactNode;
};

const styles = {
  idle: "border-grey-dark/60 bg-black-soft/40",
  processing: "border-admin-gold/30 bg-admin-gold/5",
  success: "border-emerald-500/25 bg-emerald-500/5",
  error: "border-red-500/25 bg-red-500/5",
  info: "border-blue-500/20 bg-blue-500/5",
};

const icons = {
  idle: Info,
  processing: Loader2,
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const iconColors = {
  idle: "text-grey/50",
  processing: "text-admin-gold animate-spin",
  success: "text-emerald-400/90",
  error: "text-red-400/90",
  info: "text-blue-300/80",
};

export default function SheetSyncNotice({
  variant,
  title,
  message,
  hint,
  detail,
}: SheetSyncNoticeProps) {
  const Icon = icons[variant];

  return (
    <div className={`border p-5 md:p-6 space-y-3 transition-all duration-500 ${styles[variant]}`}>
      <div className="flex items-start gap-4">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColors[variant]}`} />
        <div className="space-y-2 min-w-0">
          <p className="font-serif text-lg font-light text-white/90">{title}</p>
          <p className="text-sm text-grey/70 leading-relaxed">{message}</p>
          {hint ? (
            <p className="text-xs text-grey/50 leading-relaxed border-l border-admin-gold/30 pl-3 italic">
              {hint}
            </p>
          ) : null}
          {detail}
        </div>
      </div>
    </div>
  );
}
