export function shouldUseNeonAuthInBrowser(): boolean {
  return process.env.NEXT_PUBLIC_HAXR_AUTH_PROVIDER?.trim().toLowerCase() === "neon";
}
