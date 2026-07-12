import Link from "next/link";
import AuthShell from "@/components/auth/auth-shell";

export const metadata = {
  title: "Recuperar Palavra-passe | HAXR Signature",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <div className="rounded-2xl border border-brand-champagne/40 bg-white/80 p-6 shadow-[0_12px_40px_rgba(28,26,23,0.06)] backdrop-blur-sm sm:p-8">
        <header className="mb-6 space-y-2 text-left">
          <h1 className="font-serif text-2xl font-light text-brand-text-dark">
            Recuperar acesso
          </h1>
          <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/70">
            Em breve poderá redefinir a palavra-passe por email. Entretanto, fale com a
            equipa HAXR para assistência imediata.
          </p>
        </header>

        {/* TODO: Integrate password reset flow with auth provider. */}
        <Link
          href="/contacto"
          className="inline-flex w-full items-center justify-center rounded-xl bg-brand-black px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        >
          Contactar suporte
        </Link>

        <p className="mt-6 text-center font-sans text-xs font-light text-brand-text-dark/60">
          <Link href="/sign-in" className="font-semibold text-brand-gold hover:underline">
            Voltar ao início de sessão
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
