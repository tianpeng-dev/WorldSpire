import { requireSession } from "@/lib/auth/session";
import { listNotifications, markNotificationsRead } from "@/lib/push/service";
import { notifySchema } from "@/lib/http/contracts";
import { readJson, route } from "@/lib/http/route";
export const runtime = "nodejs";
export const GET = route(async request => Response.json({ items: await listNotifications((await requireSession(request)).userId) }));
export const POST = route(async request => {
  await markNotificationsRead((await requireSession(request)).userId, (await readJson(request, notifySchema)).ids);
  return Response.json({ ok: true });
});
