import Link from "next/link";

export default function VerifyEmailForm() {
  return <div className="haxr-auth-card rounded-[1.75rem] p-6 text-center backdrop-blur-xl sm:p-9"><h1 className="font-serif text-3xl font-light text-brand-text-dark">Active o vosso acesso</h1><p className="mt-4 font-sans text-sm font-light leading-relaxed text-brand-text-dark/70">A confirmação é concluída quando usam o link HAXR de activação de utilização única.</p><Link href="/activate-account" className="mt-7 inline-flex rounded-xl bg-brand-black px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white">Definir palavra-passe</Link></div>;
}
