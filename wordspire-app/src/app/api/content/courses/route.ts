import { requireSession } from "@/lib/auth/session";
import { listCourses } from "@/lib/content/service";
import { db } from "@/lib/db";
import { route } from "@/lib/http/route";
export const runtime = "nodejs";
export const GET = route(async request => { await requireSession(request); return Response.json({ items: await listCourses(db) }); });
