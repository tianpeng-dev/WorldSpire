import { requireCron, scanRisk } from "@/lib/cron/service";
import { route } from "@/lib/http/route";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = route(async request => { requireCron(request); return Response.json(await scanRisk()); });
