import { requireChildSession } from "@/lib/auth/session";
import { mergeSync, syncSchema } from "@/lib/db/sync";
import { readJson, route } from "@/lib/http/route";
import { AppError } from "@/lib/http/errors";
export const runtime = "nodejs";
export const POST = route(async request => {
  const session = await requireChildSession(request, true);
  const body = await readJson(request, syncSchema);
  if (body.childProfileId !== session.childProfileId || body.deviceId !== session.deviceId) throw new AppError("FORBIDDEN", 403);
  return Response.json(await mergeSync(body));
});
