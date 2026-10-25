export type SyncVersionDecision = "accept" | "idempotent" | "stale" | "conflict";

export function decideSyncVersion(input: {
  incomingVersion: number;
  currentVersion: number | null;
  incomingDeviceId: string;
  currentDeviceId?: string | null;
}): SyncVersionDecision {
  if (input.currentVersion === null) return "accept";
  if (input.incomingVersion > input.currentVersion) return "accept";
  if (input.incomingVersion < input.currentVersion) return "stale";
  return input.incomingDeviceId === input.currentDeviceId ? "idempotent" : "conflict";
}
