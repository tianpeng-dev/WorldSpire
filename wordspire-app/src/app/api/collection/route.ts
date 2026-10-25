import { requireChildSession } from "@/lib/auth/session";
import { getCollection } from "@/lib/child/server";
import { unlockCollection } from "@/lib/collection/service";
import { unlockSchema } from "@/lib/http/contracts";
import { readJson, route } from "@/lib/http/route";
export const runtime = "nodejs";
export const GET = route(async request => Response.json({ collection: await getCollection((await requireChildSession(request)).childProfileId) }));
export const POST = route(async request => {
  const session = await requireChildSession(request, true);
  return Response.json(await unlockCollection(session.childProfileId, (await readJson(request, unlockSchema)).itemKey));
});
