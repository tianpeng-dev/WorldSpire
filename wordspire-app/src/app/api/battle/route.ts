import { requireChildSession } from "@/lib/auth/session";
import { acceptParentBattle, createAiBattle, getBattleLobby, resolveBattle, submitBattleRound } from "@/lib/battle/service";
import { battleSchema } from "@/lib/http/contracts";
import { readJson, route } from "@/lib/http/route";
export const runtime = "nodejs";
export const GET = route(async request => Response.json({ lobby: await getBattleLobby((await requireChildSession(request)).childProfileId) }));
export const POST = route(async request => {
  const session = await requireChildSession(request, true);
  const body = await readJson(request, battleSchema);
  const childProfileId = session.childProfileId;
  if (body.action === "create-ai") return Response.json(await createAiBattle({ childProfileId, stageId: body.stageId }), { status: 201 });
  if (body.action === "accept-parent") return Response.json(await acceptParentBattle({ battleId: body.battleId, childProfileId }));
  if (body.action === "submit-round") return Response.json(await submitBattleRound({ ...body, childProfileId }));
  return Response.json(await resolveBattle(body.battleId, childProfileId));
});
