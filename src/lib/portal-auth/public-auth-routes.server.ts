import "server-only";

import { NextResponse } from "next/server";
import { activatePortalAccount, createPortalLoginResponse } from "@/lib/portal-auth/portal-auth.server";
import {
  hashPortalRateLimitIdentifier,
  normalizePortalEmail,
} from "@/lib/portal-auth/credentials";
import { executePortalRegistration } from "@/lib/portal-auth/portal-registration.server";
import { executePortalResendActivation } from "@/lib/portal-auth/portal-resend-activation.server";
import { persistentRateLimit } from "@/lib/security/persistent-rate-limit";
import { getRequestIp, rateLimitResponse, RATE_LIMITS } from "@/lib/security/rate-limit";

type RateLimitDependency = typeof persistentRateLimit;

function isTrustedSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const host = request.headers.get("host");
  try {
    const originUrl = new URL(origin);
    if (host && (originUrl.host === host || originUrl.host === host.split(":")[0])) return true;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (siteUrl && originUrl.origin === new URL(siteUrl).origin) return true;
    if (process.env.VERCEL_URL && originUrl.host === process.env.VERCEL_URL) return true;
    if (process.env.VERCEL_BRANCH_URL && originUrl.host === process.env.VERCEL_BRANCH_URL) return true;
    return originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export type PortalLoginRouteDependencies = {
  createLoginResponse?: typeof createPortalLoginResponse;
  getIp?: typeof getRequestIp;
  hashIdentifier?: typeof hashPortalRateLimitIdentifier;
  rateLimit?: RateLimitDependency;
};

export function createPortalLoginHandler(dependencies: PortalLoginRouteDependencies = {}) {
  const createLoginResponse = dependencies.createLoginResponse ?? createPortalLoginResponse;
  const getIp = dependencies.getIp ?? getRequestIp;
  const hashIdentifier = dependencies.hashIdentifier ?? hashPortalRateLimitIdentifier;
  const limitRequest = dependencies.rateLimit ?? persistentRateLimit;

  return async function POST(request: Request) {
    const ip = getIp(request);
    const ipLimit = await limitRequest(`portal-login:${ip}`, RATE_LIMITS.portalLogin, {
      increment: false,
      failClosed: true,
    });
    if (!ipLimit.allowed) return rateLimitResponse(ipLimit, { error: "too_many_login_attempts" });

    let body: { email?: unknown; password?: unknown; rememberMe?: unknown };
    try {
      body = (await request.json()) as { email?: unknown; password?: unknown; rememberMe?: unknown };
    } catch {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }

    const normalizedEmail = normalizePortalEmail(body.email);
    let emailKey: string | null = null;
    try {
      emailKey = normalizedEmail ? `portal-login-email:${hashIdentifier(normalizedEmail)}` : null;
    } catch (error) {
      console.error("[portal-auth:login-rate-limit-key-unavailable]", {
        error: error instanceof Error ? error.message : "unknown_error",
      });
      return NextResponse.json(
        { error: "A autenticação está temporariamente indisponível." },
        { status: 503 },
      );
    }

    if (emailKey) {
      const emailLimit = await limitRequest(emailKey, RATE_LIMITS.portalLogin, {
        increment: false,
        failClosed: true,
      });
      if (!emailLimit.allowed) return rateLimitResponse(emailLimit, { error: "too_many_login_attempts" });
    }

    try {
      const result = await createLoginResponse({
        email: body.email,
        password: body.password,
        rememberMe: body.rememberMe === true,
      });
      if (result.kind === "denied") {
        const failedIpLimit = await limitRequest(`portal-login:${ip}`, RATE_LIMITS.portalLogin, {
          increment: true,
          failClosed: true,
        });
        if (!failedIpLimit.allowed) {
          return rateLimitResponse(failedIpLimit, { error: "too_many_login_attempts" });
        }
        if (emailKey) {
          const failedEmailLimit = await limitRequest(emailKey, RATE_LIMITS.portalLogin, {
            increment: true,
            failClosed: true,
          });
          if (!failedEmailLimit.allowed) {
            return rateLimitResponse(failedEmailLimit, { error: "too_many_login_attempts" });
          }
        }
      }
      return result.response;
    } catch {
      return NextResponse.json(
        { error: "A autenticação está temporariamente indisponível." },
        { status: 503 },
      );
    }
  };
}

export type PortalRegisterRouteDependencies = {
  executeRegistration?: typeof executePortalRegistration;
  getIp?: typeof getRequestIp;
  rateLimit?: RateLimitDependency;
};

export function createPortalRegisterHandler(dependencies: PortalRegisterRouteDependencies = {}) {
  const executeRegistration = dependencies.executeRegistration ?? executePortalRegistration;
  const getIp = dependencies.getIp ?? getRequestIp;
  const limitRequest = dependencies.rateLimit ?? persistentRateLimit;

  return async function POST(request: Request) {
    if (!isTrustedSameOrigin(request)) {
      return NextResponse.json({ error: "Origem não autorizada." }, { status: 403 });
    }

    const limit = await limitRequest(`portal-register:${getIp(request)}`, RATE_LIMITS.portalRegister, {
      failClosed: true,
    });
    if (!limit.allowed) return rateLimitResponse(limit, { error: "too_many_registration_attempts" });

    let body: { fullName?: unknown; email?: unknown; termsAccepted?: unknown };
    try {
      body = (await request.json()) as {
        fullName?: unknown;
        email?: unknown;
        termsAccepted?: unknown;
      };
    } catch {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }

    try {
      const result = await executeRegistration({
        fullName: body.fullName,
        email: body.email,
        termsAccepted: body.termsAccepted,
      });
      if (!result.success) {
        return NextResponse.json(
          { error: result.error, fieldErrors: result.fieldErrors },
          { status: 400 },
        );
      }
      return NextResponse.json({ success: true, message: result.message });
    } catch {
      return NextResponse.json(
        { error: "O serviço de registo está temporariamente indisponível." },
        { status: 503 },
      );
    }
  };
}

export type PortalResendActivationRouteDependencies = {
  executeResendActivation?: typeof executePortalResendActivation;
  getIp?: typeof getRequestIp;
  hashIdentifier?: typeof hashPortalRateLimitIdentifier;
  rateLimit?: RateLimitDependency;
};

export function createPortalResendActivationHandler(
  dependencies: PortalResendActivationRouteDependencies = {},
) {
  const executeResendActivation = dependencies.executeResendActivation ?? executePortalResendActivation;
  const getIp = dependencies.getIp ?? getRequestIp;
  const hashIdentifier = dependencies.hashIdentifier ?? hashPortalRateLimitIdentifier;
  const limitRequest = dependencies.rateLimit ?? persistentRateLimit;

  return async function POST(request: Request) {
    if (!isTrustedSameOrigin(request)) {
      return NextResponse.json({ error: "Origem não autorizada." }, { status: 403 });
    }

    const ipLimit = await limitRequest(
      `portal-resend-activation-ip:${getIp(request)}`,
      RATE_LIMITS.portalResendActivationIp,
      { failClosed: true },
    );
    if (!ipLimit.allowed) return rateLimitResponse(ipLimit, { error: "too_many_attempts" });

    let body: { email?: unknown };
    try {
      body = (await request.json()) as { email?: unknown };
    } catch {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }

    const normalizedEmail = normalizePortalEmail(typeof body.email === "string" ? body.email.trim() : "");
    if (!normalizedEmail) {
      return NextResponse.json({ error: "Introduza um endereço de email válido." }, { status: 400 });
    }

    let emailHash: string;
    try {
      emailHash = hashIdentifier(normalizedEmail);
    } catch (error) {
      console.error("[portal-auth:resend-rate-limit-key-unavailable]", {
        error: error instanceof Error ? error.message : "unknown_error",
      });
      return NextResponse.json(
        { error: "O serviço está temporariamente indisponível." },
        { status: 503 },
      );
    }

    const emailLimit = await limitRequest(
      `portal-resend-activation-email:${emailHash}`,
      RATE_LIMITS.portalResendActivationEmail,
      { failClosed: true },
    );
    if (!emailLimit.allowed) return rateLimitResponse(emailLimit, { error: "too_many_attempts" });

    try {
      const result = await executeResendActivation({ email: normalizedEmail });
      if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ success: true, message: result.message });
    } catch (error) {
      console.error("[portal-auth:resend-activation-route-exception]", {
        error: error instanceof Error ? error.message : "unknown_error",
      });
      return NextResponse.json(
        { error: "O serviço está temporariamente indisponível." },
        { status: 503 },
      );
    }
  };
}

export type PortalActivateRouteDependencies = {
  activateAccount?: typeof activatePortalAccount;
  getIp?: typeof getRequestIp;
  rateLimit?: RateLimitDependency;
};

export function createPortalActivateHandler(dependencies: PortalActivateRouteDependencies = {}) {
  const activateAccount = dependencies.activateAccount ?? activatePortalAccount;
  const getIp = dependencies.getIp ?? getRequestIp;
  const limitRequest = dependencies.rateLimit ?? persistentRateLimit;

  return async function POST(request: Request) {
    const limit = await limitRequest(`portal-activate:${getIp(request)}`, RATE_LIMITS.portalActivate, {
      failClosed: true,
    });
    if (!limit.allowed) return rateLimitResponse(limit, { error: "too_many_attempts" });

    let body: { token?: unknown; password?: unknown };
    try {
      body = (await request.json()) as { token?: unknown; password?: unknown };
    } catch {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }
    if (typeof body.token !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }

    try {
      const result = await activateAccount({ token: body.token, password: body.password });
      if (!result.ok) {
        console.warn("[portal-auth:activate-rejected]", { reason: result.reason });
        return NextResponse.json(
          {
            error:
              result.reason === "invalid_password"
                ? "A palavra-passe não cumpre os requisitos de segurança."
                : "O link de activação expirou ou já não é válido.",
          },
          { status: 400 },
        );
      }
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("[portal-auth:activate-exception]", {
        error: error instanceof Error ? error.message : "unknown_error",
      });
      return NextResponse.json({ error: "Não foi possível activar a conta." }, { status: 503 });
    }
  };
}
