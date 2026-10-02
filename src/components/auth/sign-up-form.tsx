import Link from "next/link";
import { buildSignInPath } from "@/lib/auth/client-app-middleware";
import AuthRoleToggle from "@/components/auth/auth-role-toggle";

export default function SignUpForm() {
  return (
    <div className="haxr-auth-card rounded-[1.75rem] p-6 text-center backdrop-blur-xl sm:p-9">
      <header className="space-y-4">
        <h1 className="font-serif text-3xl font-light leading-tight tracking-[-0.02em] text-brand-text-dark md:text-4xl">Active o vosso acesso</h1>
        <div className="flex justify-center"><AuthRoleToggle currentRole="couple" vendorHref="/for-pros" /></div>
        <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/65">O acesso ao Painel de Casamento é associado ao vosso perfil HAXR. Se já eram clientes, aguardem ou peçam o link de reactivação seguro.</p>
      </header>
      <div className="mt-8 rounded-2xl border border-brand-champagne/35 bg-brand-ivory/40 p-5 text-left"><p className="font-sans text-sm font-medium text-brand-text-dark">Ainda não tem acesso?</p><p className="mt-2 font-sans text-xs font-light leading-relaxed text-brand-text-dark/70">Contacte a equipa HAXR para criar o perfil e enviar um convite de activação. Nunca enviamos palavras-passe por email.</p></div>
      <p className="mt-7 font-sans text-xs font-light text-brand-text-dark/65">Já recebeu uma activação? <Link href="/activate-account" className="font-semibold text-brand-gold hover:underline">Definir palavra-passe</Link></p>
      <p className="mt-4 font-sans text-xs font-light text-brand-text-dark/65">Já tem conta activa? <Link href={buildSignInPath(null)} className="font-semibold text-brand-gold hover:underline">Iniciar sessão</Link></p>
    </div>
  );
}
