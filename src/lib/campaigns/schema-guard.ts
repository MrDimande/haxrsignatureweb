export function isCampaignsSchemaMissingError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const normalized = message.toLowerCase();
  return (
    normalized.includes("invitation_campaigns") ||
    normalized.includes("sender_profiles") ||
    normalized.includes("campaign_recipients") ||
    normalized.includes("delivery_attempts") ||
    normalized.includes("could not find the table") ||
    normalized.includes("does not exist") ||
    normalized.includes("schema cache")
  );
}
