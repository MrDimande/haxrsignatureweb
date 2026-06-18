import { isBrevoConfigured } from "@/lib/brevo/config";

const BREVO_API = "https://api.brevo.com/v3";

export type BrevoApiResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

function getApiKey(): string | null {
  const key = process.env.BREVO_API_KEY?.trim();
  return key || null;
}

export async function brevoFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<BrevoApiResult<T>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { ok: false, status: 0, error: "BREVO_API_KEY não configurada" };
  }

  const response = await fetch(`${BREVO_API}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
      ...init?.headers,
    },
  });

  const text = await response.text();
  let data: T | undefined;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = text as T;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : text || response.statusText;
    return { ok: false, status: response.status, error: message };
  }

  return { ok: true, data: data as T };
}

export function brevoReady(): boolean {
  return isBrevoConfigured();
}
