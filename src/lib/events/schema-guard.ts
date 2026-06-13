export function isEventsSchemaMissingError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("could not find the table") &&
    msg.includes("events")
  );
}
