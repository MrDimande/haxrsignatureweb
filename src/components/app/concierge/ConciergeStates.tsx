export function ConciergeSkeleton() {
  return (
    <div className="space-y-8 pb-12" aria-busy="true" aria-label="A carregar HAXR Concierge">
      <div className="space-y-3 border-b border-brand-champagne/10 pb-6">
        <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
        <div className="h-10 w-2/3 max-w-md animate-pulse rounded bg-white/10" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-white/5" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/5 bg-white/5" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-3xl border border-white/5 bg-white/5" />
        <div className="h-80 animate-pulse rounded-3xl border border-white/5 bg-white/5" />
      </div>
    </div>
  );
}

export function ConciergeEmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-gold/30 bg-brand-gold/5 px-6 py-16 text-center">
      <p className="font-serif text-xl text-white">Ainda não existem itens no HAXR Concierge.</p>
      <p className="mt-2 max-w-md font-sans text-sm text-zinc-400">
        Envie propostas, contratos, comprovativos ou links para começar a organizar o evento.
      </p>
      <button
        type="button"
        onClick={onUpload}
        className="mt-6 rounded-full bg-brand-gold px-6 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-black transition hover:bg-white"
      >
        Carregar primeiro ficheiro
      </button>
    </div>
  );
}

export function ConciergeErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-red-500/30 bg-red-500/5 px-6 py-16 text-center">
      <p className="font-serif text-xl text-white">
        {message || "Não foi possível carregar o HAXR Concierge."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-full border border-brand-gold/40 px-6 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-gold transition hover:bg-brand-gold/10"
      >
        Tentar novamente
      </button>
    </div>
  );
}
