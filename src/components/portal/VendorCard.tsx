import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import type { VendorCardData } from "@/lib/portal/dashboard-content";

type VendorCardProps = {
  vendor: VendorCardData;
  interactive?: boolean;
};

export default function VendorCard({
  vendor,
  interactive = true,
}: VendorCardProps) {
  const content = (
    <>
      <div
        className={`relative aspect-[4/3] bg-gradient-to-br ${vendor.imageGradient} border-b border-brand-champagne/50`}
      >
        <button
          type="button"
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/90 border border-brand-champagne/60 text-brand-text-dark/50 hover:text-brand-gold transition-colors"
          aria-label="Guardar fornecedor"
          tabIndex={interactive ? 0 : -1}
        >
          <Heart className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <span className="absolute bottom-3 left-3 font-sans text-[10px] font-semibold uppercase tracking-wider text-brand-text-dark/70 bg-white/85 px-2 py-1">
          {vendor.category}
        </span>
      </div>

      <div className="p-4 md:p-5">
        <h3 className="font-serif text-lg text-brand-text-dark mb-1.5">
          {vendor.name}
        </h3>
        <p className="flex items-center gap-1.5 font-sans text-xs text-brand-text-dark/55 mb-3">
          <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
          {vendor.location}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {vendor.styleTags.map((tag) => (
            <span
              key={tag}
              className="font-sans text-[10px] uppercase tracking-wider text-brand-text-dark/55 border border-brand-champagne px-2 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </>
  );

  const className =
    "block border border-brand-champagne/60 bg-white overflow-hidden hover:border-brand-gold/30 hover:shadow-[0_12px_40px_rgba(8,7,6,0.08)] transition-all";

  if (interactive) {
    return (
      <Link href={vendor.href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
