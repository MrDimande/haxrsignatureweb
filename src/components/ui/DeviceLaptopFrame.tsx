type DeviceLaptopFrameProps = {
  children: React.ReactNode;
  className?: string;
};

export default function DeviceLaptopFrame({
  children,
  className = "",
}: DeviceLaptopFrameProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="rounded-t-xl border border-white/15 bg-[#1a1816] shadow-[0_32px_80px_rgba(0,0,0,0.45)] overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/10 bg-[#12100e]">
          <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <span className="ml-3 font-sans text-[10px] text-white/40 tracking-wide">
            HAXR · Dashboard do Evento
          </span>
        </div>
        <div className="aspect-[16/10] w-full min-h-[200px] bg-[#0e0d0b]">
          {children}
        </div>
      </div>
      <div className="mx-auto w-[92%] h-3 rounded-b-lg bg-gradient-to-b from-[#2a2724] to-[#1a1816] border-x border-b border-white/10" />
      <div className="mx-auto w-[38%] h-1.5 rounded-b-md bg-[#2a2724]" />
    </div>
  );
}
