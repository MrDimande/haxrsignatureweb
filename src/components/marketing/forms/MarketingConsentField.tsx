import type { UseFormRegister, FieldValues } from "react-hook-form";
import { MARKETING_CONSENT_TEXT } from "@/lib/email/marketing/marketing-contact";

type MarketingConsentFieldProps<T extends FieldValues> = {
  register: UseFormRegister<T>;
  error?: string;
  className?: string;
};

export default function MarketingConsentField<T extends FieldValues>({
  register,
  error,
  className = "",
}: MarketingConsentFieldProps<T>) {
  return (
    <div className={className}>
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 accent-[#c9a962] bg-transparent border border-grey/40"
          {...register("marketingConsent" as never)}
        />
        <span className="font-sans text-xs text-grey/70 leading-relaxed group-hover:text-grey transition-colors">
          {MARKETING_CONSENT_TEXT}
        </span>
      </label>
      {error ? (
        <p className="text-gold/60 text-xs mt-2 font-sans">{error}</p>
      ) : null}
    </div>
  );
}
