import { requireChildSession } from "@/lib/auth/session";
import { createDuel } from "@/lib/battle/duel";
import { duelCreateSchema } from "@/lib/battle/duel-contract";
import { readJson, route } from "@/lib/http/route";

export const runtime = "nodejs";
export const POST = route(async request => {
  const { childProfileId } = await requireChildSession(request, true);
  const { stageId } = await readJson(request, duelCreateSchema);
  return Response.json(await createDuel(childProfileId, stageId), { status: 201 });
});
