type HomeConciergeModuleArtProps = {
  moduleId: string;
  className?: string;
};

export default function HomeConciergeModuleArt({
  moduleId,
  className = "",
}: HomeConciergeModuleArtProps) {
  const base = `w-full max-w-[180px] mx-auto ${className}`;

  switch (moduleId) {
    case "vendors":
      return (
        <div className={base} aria-hidden>
          <div className="border border-brand-champagne/50 bg-white p-3 shadow-sm">
            <div className="h-2 w-16 bg-brand-gold/30 mb-3" />
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1.5 border-b border-brand-champagne/40">
                <div className="h-2 w-20 bg-brand-text-dark/20" />
                <div className="h-2 w-10 bg-brand-gold/40" />
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-brand-champagne/40">
                <div className="h-2 w-16 bg-brand-text-dark/15" />
                <div className="h-2 w-8 bg-brand-text-dark/10" />
              </div>
              <div className="flex justify-between items-center py-1.5">
                <div className="h-2 w-14 bg-brand-text-dark/15" />
                <span className="text-[8px] font-sans uppercase tracking-wider text-brand-gold px-1.5 py-0.5 border border-brand-gold/30">
                  Activo
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    case "guests":
      return (
        <div className={base} aria-hidden>
          <div className="border border-brand-champagne/50 bg-white p-3 shadow-sm">
            <div className="flex gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-brand-champagne/60 shrink-0" />
              <div className="flex-1 space-y-1 pt-0.5">
                <div className="h-2 w-full bg-brand-text-dark/20" />
                <div className="h-1.5 w-[66%] bg-brand-text-dark/10" />
              </div>
            </div>
            <div className="flex gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-brand-champagne/40 shrink-0" />
              <div className="flex-1 space-y-1 pt-0.5">
                <div className="h-2 w-[80%] bg-brand-text-dark/15" />
                <div className="h-1.5 w-[50%] bg-brand-text-dark/10" />
              </div>
            </div>
            <div className="text-[8px] font-sans text-brand-gold text-right">
              48 convidados
            </div>
          </div>
        </div>
      );
    case "budget":
      return (
        <div className={base} aria-hidden>
          <div className="border border-brand-champagne/50 bg-white p-3 shadow-sm">
            <div className="flex justify-between mb-2">
              <div className="h-2 w-12 bg-brand-text-dark/15" />
              <div className="font-serif text-sm text-brand-gold">62%</div>
            </div>
            <div className="h-2 w-full bg-brand-champagne/40 mb-3 overflow-hidden">
              <div className="h-full w-[62%] bg-brand-gold/70" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-1.5 bg-[#f7f1e8] border border-brand-champagne/30">
                <div className="h-1.5 w-8 bg-brand-text-dark/15 mb-1" />
                <div className="h-2 w-12 bg-brand-gold/50" />
              </div>
              <div className="p-1.5 bg-[#f7f1e8] border border-brand-champagne/30">
                <div className="h-1.5 w-8 bg-brand-text-dark/15 mb-1" />
                <div className="h-2 w-10 bg-brand-text-dark/20" />
              </div>
            </div>
          </div>
        </div>
      );
    case "moodboard":
      return (
        <div className={base} aria-hidden>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="aspect-square bg-[#EAD8B8] border border-brand-champagne/40" />
            <div className="aspect-square bg-[#F7F1E8] border border-brand-champagne/40" />
            <div className="aspect-square bg-[#B88A2A]/40 border border-brand-champagne/40" />
            <div className="aspect-square bg-brand-text-dark/10 border border-brand-champagne/40" />
          </div>
        </div>
      );
    case "checklist":
      return (
        <div className={base} aria-hidden>
          <div className="border border-brand-champagne/50 bg-white p-3 shadow-sm space-y-2">
            {["Convite digital", "Lista final", "QR check-in"].map((item, i) => (
              <div key={item} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 border shrink-0 ${
                    i === 0
                      ? "border-brand-gold bg-brand-gold/20"
                      : "border-brand-champagne"
                  }`}
                />
                <div
                  className={`h-2 flex-1 ${
                    i === 0 ? "bg-brand-text-dark/25" : "bg-brand-text-dark/12"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div className={`${base} h-24 bg-white/10 border border-white/10`} aria-hidden />
      );
  }
}
