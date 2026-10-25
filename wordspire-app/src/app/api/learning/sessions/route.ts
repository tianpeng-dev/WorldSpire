import { requireChildSession } from "@/lib/auth/session";
import { createLearningSession } from "@/lib/learning/service";
import { startSchema } from "@/lib/http/contracts";
import { readJson, route } from "@/lib/http/route";
export const runtime = "nodejs";
export const POST = route(async request => {
  const session = await requireChildSession(request, true);
  return Response.json({ session: await createLearningSession({ childProfileId: session.childProfileId, ...await readJson(request, startSchema) }) }, { status: 201 });
});
