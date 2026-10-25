"use server";
import { requireChildSession } from "@/lib/auth/session";
import { resolveBattle, submitBattleRound } from "@/lib/battle/service";
import { roundSchema, idSchema } from "@/lib/http/contracts";
import { action } from "@/lib/http/action";

export async function submitRoundAction(formData: FormData) {
  return action(async request => {
    const session = await requireChildSession(request, true);
    const body = roundSchema.parse({ battleId: formData.get("battleId"), questionId: formData.get("questionId"), optionId: formData.get("optionId"),
      latencyMs: Number(formData.get("latencyMs")), roundIndex: Number(formData.get("roundIndex")) });
    return submitBattleRound({ ...body, childProfileId: session.childProfileId });
  });
}
export async function resolveBattleAction(battleId: string) {
  return action(async request => resolveBattle(idSchema.parse(battleId), (await requireChildSession(request, true)).childProfileId));
}
