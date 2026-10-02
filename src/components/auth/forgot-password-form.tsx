import Link from "next/link";

export default function ForgotPasswordForm() {
  return (
    <div className="haxr-auth-card rounded-[1.75rem] p-6 text-center backdrop-blur-xl sm:p-9">
      <h1 className="font-serif text-3xl font-light text-brand-text-dark">Recuperar acesso</h1>
      <p className="mt-4 font-sans text-sm font-light leading-relaxed text-brand-text-dark/70">Durante a reactivação HAXR, a recuperação é assistida pela equipa para que um link de utilização única possa ser emitido com segurança.</p>
      <Link href="/sign-up" className="mt-7 inline-flex rounded-xl bg-brand-black px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white">Pedir link de activação</Link>
      <p className="mt-6 text-xs text-brand-text-dark/65"><Link href="/sign-in" className="font-semibold text-brand-gold hover:underline">Voltar ao início de sessão</Link></p>
    </div>
  );
}
