import { requireChildSession, requireChildAccess } from "@/lib/auth/session";
import { getChildOverview } from "@/lib/child/server";
import { route } from "@/lib/http/route";
export const runtime = "nodejs";
export const GET = route(async request => {
  let childProfileId = new URL(request.url).searchParams.get("childProfileId");
  if (childProfileId) await requireChildAccess(childProfileId, request);
  else childProfileId = (await requireChildSession(request)).childProfileId;
  return Response.json({ overview: await getChildOverview(childProfileId) });
});
