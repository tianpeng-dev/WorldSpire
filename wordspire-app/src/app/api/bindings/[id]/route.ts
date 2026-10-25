import { z } from "zod";
import { requireSession, requireChildSession } from "@/lib/auth/session";
import { changeBinding } from "@/lib/binding/service";
import { readJson, route } from "@/lib/http/route";
export const runtime = "nodejs";
export const POST = route(async (request, context) => {
  const { action } = await readJson(request, z.object({ action: z.enum(["confirm", "revoke"]) }));
  const session = await requireSession(request);
  if (session.role === "child") await requireChildSession(request, true);
  return Response.json({ binding: await changeBinding(session, (await context.params).id, action) });
});
