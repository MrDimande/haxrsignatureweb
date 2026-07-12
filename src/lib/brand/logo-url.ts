import { escapeHtml } from "@/lib/brevo/html";
import {
  isHorizontalLogoAvailable,
  resolveEmailLogoPath,
} from "@/lib/brand/brand-assets";

const BRAND_WORDMARK = "HAXR SIGNATURE";

export type EmailLogoUrlSource = "explicit" | "site_url" | "none";

export type EmailLogoDiagnostics = {
  resolvedUrl: string | null;
  source: EmailLogoUrlSource;
  safeForEmail: boolean;
  assetPath: string;
  fallbackMode: "image" | "text-only";
};

function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/$/, "");
}

function isPrivateOrInternalHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan") ||
    host.endsWith(".corp") ||
    host.endsWith(".home")
  ) {
    return true;
  }

  if (host === "127.0.0.1" || host === "0.0.0.0" || host.startsWith("127.")) {
    return true;
  }

  if (host === "::1") {
    return true;
  }

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const octets = ipv4.slice(1, 5).map((part) => Number(part));
    const [a, b] = octets;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
  }

  return false;
}

/**
 * Apenas URLs absolutas HTTPS públicas são seguras para clientes de email.
 */
export function isSafeEmailLogoUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) {
    return false;
  }

  const trimmed = url.trim();

  if (!trimmed.startsWith("https://")) {
    return false;
  }

  if (
    trimmed.includes("localhost") ||
    trimmed.includes("127.0.0.1") ||
    trimmed.includes("0.0.0.0")
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") {
      return false;
    }
    if (!parsed.hostname) {
      return false;
    }
    if (isPrivateOrInternalHost(parsed.hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Base URL pública do site para emails (apenas NEXT_PUBLIC_SITE_URL). */
export function getEmailSiteBaseUrl(): string | null {
  const trimmed = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!trimmed) {
    return null;
  }
  return normalizeBaseUrl(trimmed);
}

function buildSiteLogoUrl(baseUrl: string): string {
  return `${normalizeBaseUrl(baseUrl)}${resolveEmailLogoPath()}`;
}

/**
 * Resolve URL do logo para email.
 * Prioridade: HAXR_PUBLIC_LOGO_URL → NEXT_PUBLIC_SITE_URL + asset.
 * Sem fallback cego para domínio de produção.
 */
export function resolveEmailLogoUrl(): {
  url: string | null;
  source: EmailLogoUrlSource;
} {
  const explicit = process.env.HAXR_PUBLIC_LOGO_URL?.trim();
  if (explicit) {
    return {
      url: isSafeEmailLogoUrl(explicit) ? explicit : null,
      source: "explicit",
    };
  }

  const base = getEmailSiteBaseUrl();
  if (base?.startsWith("https://")) {
    const built = buildSiteLogoUrl(base);
    return {
      url: isSafeEmailLogoUrl(built) ? built : null,
      source: "site_url",
    };
  }

  return {
    url: null,
    source: "none",
  };
}

/** URL segura para <img> — null se insegura ou ausente */
export function getEmailLogoUrl(): string | null {
  return resolveEmailLogoUrl().url;
}

export function getEmailLogoDiagnostics(): EmailLogoDiagnostics {
  const assetPath = resolveEmailLogoPath();
  const explicit = process.env.HAXR_PUBLIC_LOGO_URL?.trim();

  let resolvedUrl: string | null = null;
  let source: EmailLogoUrlSource = "none";

  if (explicit) {
    source = "explicit";
    resolvedUrl = explicit;
  } else {
    const base = getEmailSiteBaseUrl();
    if (base?.startsWith("https://")) {
      source = "site_url";
      resolvedUrl = buildSiteLogoUrl(base);
    }
  }

  const safeForEmail = isSafeEmailLogoUrl(resolvedUrl);

  return {
    resolvedUrl,
    source,
    safeForEmail,
    assetPath,
    fallbackMode: safeForEmail ? "image" : "text-only",
  };
}

export type EmailBrandHeaderShell = "marketing" | "transactional";

export type EmailBrandHeaderOptions = {
  shell?: EmailBrandHeaderShell;
};

const SHELL_WORDMARK_STYLES: Record<EmailBrandHeaderShell, string> = {
  marketing:
    "margin:0 0 14px;font-size:10px;letter-spacing:0.42em;text-transform:uppercase;color:#d4bc82;font-family:Arial,Helvetica,sans-serif;",
  transactional:
    "margin:0;font-size:11px;letter-spacing:0.38em;text-transform:uppercase;color:#c9a962;font-family:Arial,Helvetica,sans-serif;",
};

function renderEmailWordmark(shell: EmailBrandHeaderShell): string {
  return `<p style="${SHELL_WORDMARK_STYLES[shell]}">${BRAND_WORDMARK}</p>`;
}

function renderEmailLogoImage(url: string): string {
  const useHorizontal = isHorizontalLogoAvailable();
  const width = useHorizontal ? 148 : 56;

  return `<img src="${escapeHtml(url)}" alt="" width="${width}" style="display:block;margin:0 auto 12px auto;width:${width}px;max-width:${width}px;height:auto;border:0;outline:none;text-decoration:none;" />`;
}

/**
 * Cabeçalho de marca unificado para todos os emails HAXR.
 * Imagem só quando a URL é segura; wordmark textual sempre presente.
 */
export function renderEmailBrandHeader(
  options: EmailBrandHeaderOptions = {}
): string {
  const shell = options.shell ?? "marketing";
  const safeUrl = getEmailLogoUrl();
  const imageBlock = safeUrl ? renderEmailLogoImage(safeUrl) : "";

  return `${imageBlock}${renderEmailWordmark(shell)}`;
}

/** @deprecated Usar renderEmailBrandHeader */
export function renderEmailLogoHtml(): string {
  return renderEmailBrandHeader({ shell: "marketing" });
}

export function getEmailLogoUrlStatus(): EmailLogoDiagnostics {
  return getEmailLogoDiagnostics();
}
