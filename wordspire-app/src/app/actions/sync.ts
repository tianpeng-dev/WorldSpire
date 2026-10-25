"use server";
import { requireChildSession } from "@/lib/auth/session";
import { mergeSync, syncSchema } from "@/lib/db/sync";
import { action } from "@/lib/http/action";
import { AppError } from "@/lib/http/errors";
import type { SyncRequest } from "@/types";
export async function syncAction(input: SyncRequest) {
  return action(async request => {
    const session = await requireChildSession(request, true);
    const body = syncSchema.parse(input);
    if (body.childProfileId !== session.childProfileId || body.deviceId !== session.deviceId) throw new AppError("FORBIDDEN", 403);
    return mergeSync(body);
  });
}
