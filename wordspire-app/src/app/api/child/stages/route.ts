import { requireChildSession } from "@/lib/auth/session";
import { listChildStages } from "@/lib/child/server";
import { route } from "@/lib/http/route";
export const runtime = "nodejs";
export const GET = route(async request => Response.json({ stages: await listChildStages((await requireChildSession(request)).childProfileId) }));
