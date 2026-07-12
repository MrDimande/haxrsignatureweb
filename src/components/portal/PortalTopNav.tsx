import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import { portalTopNavLinks } from "@/lib/portal/dashboard-content";

type PortalTopNavProps = {
  /** Preview embutido — links desactivados visualmente */
  embedded?: boolean;
};

export default function PortalTopNav({ embedded = true }: PortalTopNavProps) {
  return (
    <header className="flex items-center justify-between gap-4 px-4 md:px-6 py-3 border-b border-brand-champagne/40 bg-white">
      <Link
        href="/"
        className="shrink-0"
        aria-label="HAXR Signature"
        tabIndex={embedded ? -1 : undefined}
      >
        <BrandLogo variant="navbar" className="h-7 w-auto" />
      </Link>

      <nav
        className="hidden lg:flex items-center gap-5 xl:gap-6"
        aria-label="Navegação do portal"
      >
        {portalTopNavLinks.map((link) => (
          <span
            key={link.id}
            className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-brand-text-dark/55"
          >
            {link.label}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden sm:inline font-sans text-[11px] font-medium uppercase tracking-wider text-brand-text-dark/50 px-3 py-2">
          Entrar
        </span>
        <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-white bg-brand-text-dark px-4 py-2.5">
          Começar
        </span>
      </div>
    </header>
  );
}
