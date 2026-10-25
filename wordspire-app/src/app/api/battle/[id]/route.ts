import { requireChildAccess, requireSession } from "@/lib/auth/session";
import { getBattle } from "@/lib/battle/service";
import { route } from "@/lib/http/route";
export const runtime = "nodejs";
export const GET = route(async (request, context) => {
  await requireSession(request);
  const result = await getBattle((await context.params).id);
  await requireChildAccess(result.battle.childProfileId, request);
  return Response.json(result);
});
