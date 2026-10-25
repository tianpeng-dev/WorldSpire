import { openApiDocument } from "@/lib/http/openapi";
import { route } from "@/lib/http/route";
export const runtime = "nodejs";
export const GET = route(async () => Response.json(openApiDocument()));
