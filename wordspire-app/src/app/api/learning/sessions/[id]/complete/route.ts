import { requireChildSession } from "@/lib/auth/session";
import { completeLearningSession } from "@/lib/learning/service";
import { route } from "@/lib/http/route";
export const runtime = "nodejs";
export const POST = route(async (request, context) => {
  const session = await requireChildSession(request, true);
  return Response.json(await completeLearningSession((await context.params).id, session.childProfileId));
});
