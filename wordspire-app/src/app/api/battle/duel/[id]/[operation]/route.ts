import { z } from "zod";
import { requireChildSession } from "@/lib/auth/session";
import { operateDuel } from "@/lib/battle/duel";
import { idSchema } from "@/lib/http/contracts";
import { route } from "@/lib/http/route";

export const runtime = "nodejs";
const operations = z.enum(["join", "ready", "presence", "leave"]);
export const POST = route(async (request, context) => {
  const { childProfileId } = await requireChildSession(request, true);
  const params = await context.params;
  const id = idSchema.parse(params.id);
  const kind = operations.parse(params.operation);
  return Response.json(await operateDuel(id, childProfileId, { kind }));
});
