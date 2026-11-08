import { requireChildSession } from "@/lib/auth/session";
import { operateDuel } from "@/lib/battle/duel";
import { duelAnswerSchema } from "@/lib/battle/duel-contract";
import { idSchema } from "@/lib/http/contracts";
import { readJson, route } from "@/lib/http/route";

export const runtime = "nodejs";
export const POST = route(async (request, context) => {
  const { childProfileId } = await requireChildSession(request, true);
  const id = idSchema.parse((await context.params).id);
  const answer = await readJson(request, duelAnswerSchema);
  return Response.json(await operateDuel(id, childProfileId, { kind: "answer", ...answer }));
});
