import { requireChildSession } from "@/lib/auth/session";
import { submitLearningAttempt } from "@/lib/learning/service";
import { attemptSchema } from "@/lib/http/contracts";
import { readJson, route } from "@/lib/http/route";
export const runtime = "nodejs";
export const POST = route(async (request, context) => {
  const session = await requireChildSession(request, true);
  return Response.json(await submitLearningAttempt({ sessionId: (await context.params).id, childProfileId: session.childProfileId, ...await readJson(request, attemptSchema) }));
});
