export type ClientAppAuthEnvironmentCheck = { ok: true } | { ok: false; message: string };

/** Browser code never receives database or identity-provider configuration. */
export function validateClientAppAuthEnvironment(): ClientAppAuthEnvironmentCheck {
  return { ok: true };
}
