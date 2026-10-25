import { z } from "zod";
import { auth, guestSchema } from "@/lib/auth/auth";
import { authResponse } from "@/lib/auth/response";
import { readJson, route } from "@/lib/http/route";
import { AppError } from "@/lib/http/errors";

export const runtime = "nodejs";
const paths = new Map([
  ["/api/auth/sign-up/email", "POST"], ["/api/auth/sign-in/email", "POST"],
  ["/api/auth/sign-out", "POST"], ["/api/auth/get-session", "GET"], ["/api/auth/guest", "POST"],
]);
const handler = route<{ all: string[] }>(async request => {
  const path = new URL(request.url).pathname;
  if (paths.get(path) !== request.method) throw new AppError("AUTH_CAPABILITY_UNAVAILABLE", 501);
  if (request.method === "POST") {
    const credentials = z.object({ email: z.email().max(254), password: z.string().min(8).max(128) });
    const schema = path.endsWith("/guest") ? guestSchema : path.includes("sign-up") ? credentials.extend({ name: z.string().min(1).max(64) }) : path.includes("sign-in") ? credentials : z.object({});
    const body = await readJson(request, schema, { allowEmpty: path.endsWith("/sign-out") });
    const incoming = new Headers(request.headers);
    incoming.set("Content-Type", "application/json"); incoming.delete("Content-Length");
    return authResponse(await auth.handler(new Request(request.url, { method: "POST", headers: incoming, body: JSON.stringify(body) })));
  }
  return authResponse(await auth.handler(request));
});
export const GET = handler;
export const POST = handler;
