export default function InvitationLoading() {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black">
      <div className="mb-6 h-px w-12 bg-gold/30" />
      <p className="font-mono text-[9px] tracking-[0.45em] uppercase text-grey/60 animate-pulse">
        A carregar experiência
      </p>
    </div>
  );
}
