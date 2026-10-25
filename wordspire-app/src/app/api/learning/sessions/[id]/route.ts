import { requireChildSession } from "@/lib/auth/session";
import { getLearningSession } from "@/lib/child/server";
import { route } from "@/lib/http/route";
import { AppError } from "@/lib/http/errors";
export const runtime = "nodejs";
export const GET = route(async (request, context) => {
  const session = await requireChildSession(request);
  const result = await getLearningSession((await context.params).id, session.childProfileId);
  if (!result) throw new AppError("SESSION_NOT_FOUND", 404);
  return Response.json({ session: result });
});
