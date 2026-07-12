type DeviceTabletFrameProps = {
  children: React.ReactNode;
  className?: string;
};

export default function DeviceTabletFrame({
  children,
  className = "",
}: DeviceTabletFrameProps) {
  return (
    <div
      className={`relative rounded-[1.25rem] border-[10px] border-[#1c1a17] bg-[#1c1a17] shadow-[0_24px_56px_rgba(0,0,0,0.4)] overflow-hidden ${className}`}
    >
      <div className="aspect-[4/3] w-[220px] md:w-[260px] bg-[#0e0d0b]">
        {children}
      </div>
    </div>
  );
}
