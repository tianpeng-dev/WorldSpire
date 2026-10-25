import { eq } from "drizzle-orm";
import { requireChildSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { childProfiles } from "@/lib/db/schema";
import { route } from "@/lib/http/route";
export const runtime = "nodejs";
export const GET = route(async request => {
  const session = await requireChildSession(request);
  const child = (await db.select().from(childProfiles).where(eq(childProfiles.id, session.childProfileId)))[0];
  return Response.json({ code: child.friendCode });
});
