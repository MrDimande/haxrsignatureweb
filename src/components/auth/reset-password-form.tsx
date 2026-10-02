import Link from "next/link";

export default function ResetPasswordForm() {
  return (
    <div className="haxr-auth-card rounded-[1.75rem] p-6 text-center backdrop-blur-xl sm:p-9">
      <h1 className="font-serif text-3xl font-light text-brand-text-dark">Use o novo link seguro</h1>
      <p className="mt-4 font-sans text-sm font-light leading-relaxed text-brand-text-dark/70">Os links de recuperação anteriores foram descontinuados. Use o convite HAXR mais recente para definir uma nova palavra-passe.</p>
      <Link href="/activate-account" className="mt-7 inline-flex rounded-xl bg-brand-black px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white">Abrir activação</Link>
    </div>
  );
}
