type BrandRubricProps = {
  className?: string;
  align?: "center" | "left";
};

export default function BrandRubric({
  className = "",
  align = "center",
}: BrandRubricProps) {
  const isLeft = align === "left";

  return (
    <div
      className={`flex flex-col ${isLeft ? "items-start text-left" : "items-center text-center"} ${className}`}
    >
      <p className="font-serif text-2xl md:text-3xl font-light tracking-[0.35em] text-white/85 mb-3">
        HAXR
      </p>
      <div
        className={`flex items-center gap-4 w-full ${isLeft ? "max-w-[240px]" : "max-w-[220px]"}`}
      >
        {!isLeft && (
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/25" />
        )}
        <p className="font-[family-name:var(--font-signature)] text-[2rem] md:text-[2.35rem] leading-none text-gold/75 -mb-1 shrink-0">
          Signature
        </p>
        <span
          className={`h-px flex-1 from-transparent to-gold/25 ${
            isLeft ? "bg-gradient-to-r" : "bg-gradient-to-l"
          }`}
        />
      </div>
    </div>
  );
}
