import Link from "next/link";
import ResendActivationForm from "@/components/auth/resend-activation-form";
import type { PortalTokenInspectionResult } from "@/lib/portal-auth/portal-auth.server";

type InvalidActivationReason = Exclude<PortalTokenInspectionResult, { valid: true }>["reason"];

type InvalidActivationLinkProps = {
  reason: InvalidActivationReason;
};

function getExplanation(reason: InvalidActivationReason): {
  title: string;
  description: string;
  showResend: boolean;
  showSignInOnly: boolean;
} {
  switch (reason) {
    case "account_already_active":
      return {
        title: "Conta já activada",
        description:
          "O vosso acesso HAXR Signature já foi activado anteriormente. Pode aceder directamente com a vossa palavra-passe.",
        showResend: false,
        showSignInOnly: true,
      };

    case "account_suspended":
      return {
        title: "Acesso indisponível",
        description:
          "Esta conta encontra-se actualmente suspensa. Por favor, contacte a equipa HAXR Signature para obter assistência.",
        showResend: false,
        showSignInOnly: false,
      };

    case "already_consumed":
      return {
        title: "Link já utilizado",
        description:
          "Este link de activação de utilização única já foi concluído com sucesso. Se já definiu a sua palavra-passe, pode iniciar sessão.",
        showResend: true,
        showSignInOnly: false,
      };

    case "expired":
      return {
        title: "Link expirado",
        description:
          "O link de activação expirou. Por motivos de segurança e protecção dos vossos dados, os links têm validade limitada. Pode solicitar um novo link abaixo.",
        showResend: true,
        showSignInOnly: false,
      };

    case "invalidated":
      return {
        title: "Link substituído",
        description:
          "Foi emitido um novo link de activação mais recente para este email. Por favor, utilize o link mais actual ou solicite um novo abaixo.",
        showResend: true,
        showSignInOnly: false,
      };

    case "missing_token":
    case "invalid_format":
    case "not_found":
    default:
      return {
        title: "Link inválido ou incompleto",
        description:
          "Não foi possível validar o link de activação. O endereço pode ter sido copiado de forma incompleta ou já não estar activo. Pode pedir um novo link abaixo.",
        showResend: true,
        showSignInOnly: false,
      };
  }
}

export default function InvalidActivationLink({ reason }: InvalidActivationLinkProps) {
  const { title, description, showResend, showSignInOnly } = getExplanation(reason);

  return (
    <div className="haxr-auth-card mx-auto w-full max-w-md rounded-[1.75rem] p-6 text-center backdrop-blur-xl sm:p-9">
      <h1 className="font-serif text-2xl font-light text-brand-text-dark sm:text-3xl">
        {title}
      </h1>

      <p className="mt-3 font-sans text-sm font-light leading-relaxed text-brand-text-dark/75">
        {description}
      </p>

      {showSignInOnly ? (
        <div className="mt-7">
          <Link
            href="/sign-in"
            className="inline-flex w-full items-center justify-center rounded-xl bg-brand-black px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-black/90"
          >
            Iniciar sessão
          </Link>
        </div>
      ) : null}

      {showResend ? (
        <div className="mt-7 border-t border-brand-champagne/40 pt-6">
          <h2 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-text-dark">
            Pedir novo link de activação
          </h2>
          <ResendActivationForm />
        </div>
      ) : null}

      <p className="mt-6 text-center text-xs text-brand-text-dark/70">
        <Link
          href="/sign-in"
          className="font-semibold text-brand-gold hover:underline"
        >
          Voltar ao início de sessão
        </Link>
      </p>
    </div>
  );
}
