/** Domínio canónico indexável — resultados Google devem mostrar HAXR Signature, não Vercel. */
export const CANONICAL_SITE_URL = "https://www.haxrsignature.com";
export const CANONICAL_HOST = "www.haxrsignature.com";

const NON_CANONICAL_HOSTS = new Set([
  "haxrsignature.com",
  "haxrsignature.vercel.app",
]);

const VERCEL_PREVIEW_SUFFIX = ".vercel.app";

export function isCanonicalHost(host: string): boolean {
  const normalized = host.toLowerCase().split(":")[0] ?? host;
  return normalized === CANONICAL_HOST;
}

/** Hosts que devem redireccionar 308 para o domínio oficial. */
export function shouldRedirectToCanonical(host: string): boolean {
  const normalized = host.toLowerCase().split(":")[0] ?? host;
  if (NON_CANONICAL_HOSTS.has(normalized)) return true;
  return normalized.endsWith(VERCEL_PREVIEW_SUFFIX);
}

/** Deploys de preview Vercel — nunca indexar. */
export function isPreviewDeployment(): boolean {
  return process.env.VERCEL_ENV === "preview";
}
