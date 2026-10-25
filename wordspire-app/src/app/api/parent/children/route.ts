import { requireGuardianSession } from "@/lib/auth/session";
import { listBoundChildren } from "@/lib/binding/service";
import { route } from "@/lib/http/route";
export const runtime = "nodejs";
export const GET = route(async request => Response.json({ items: await listBoundChildren((await requireGuardianSession(request)).userId) }));
