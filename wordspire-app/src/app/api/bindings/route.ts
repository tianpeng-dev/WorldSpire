import { z } from "zod";
import { requireSession, requireGuardianSession } from "@/lib/auth/session";
import { listBindings, requestBinding } from "@/lib/binding/service";
import { readJson, route } from "@/lib/http/route";
export const runtime = "nodejs";
const bindingSchema = z.object({ code: z.string().regex(/^[A-Z0-9]{8}$/) });
export const GET = route(async request => Response.json({ items: await listBindings(await requireSession(request)) }));
export const POST = route(async request => {
  const session = await requireGuardianSession(request);
  const { code } = await readJson(request, bindingSchema);
  return Response.json({ binding: await requestBinding(session.userId, code) });
});
