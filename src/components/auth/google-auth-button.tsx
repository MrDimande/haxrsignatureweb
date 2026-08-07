"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { buildAuthCallbackUrl, resolveDefaultAuthCallbackNext } from "@/lib/auth/auth-redirect";
import {
  readStashedPostAuthReturn,
  stashPostAuthReturn,
} from "@/lib/auth/client-app-middleware";
import { signInWithGoogle } from "@/lib/auth/oauth-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

type GoogleAuthButtonProps = {
  fromParam?: string | null;
  disabled?: boolean;
  onError?: (message: string) => void;
};

export default function GoogleAuthButton({
  fromParam = null,
  disabled = false,
  onError,
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    stashPostAuthReturn(fromParam);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const next =
        fromParam ?? readStashedPostAuthReturn() ?? resolveDefaultAuthCallbackNext();
      const redirectTo = buildAuthCallbackUrl({
        origin: window.location.origin,
        next,
      });

      const result = await signInWithGoogle(supabase, redirectTo);
      if (!result.ok) {
        onError?.(result.formError);
        setLoading(false);
      }
    } catch {
      onError?.("Não foi possível continuar com Google. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={disabled || loading}
      className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-brand-champagne/55 bg-white px-4 py-3 font-sans text-sm text-brand-text-dark/85 transition-colors hover:border-brand-gold hover:bg-brand-champagne/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          <span>A redireccionar...</span>
        </>
      ) : (
        <>
          <GoogleIcon className="h-4 w-4 shrink-0" />
          <span>Continuar com Google</span>
        </>
      )}
    </button>
  );
}
