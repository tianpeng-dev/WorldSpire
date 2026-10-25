import { auth, guestSchema } from "@/lib/auth/auth";
import { readJson, route } from "@/lib/http/route";
import { authResponse } from "@/lib/auth/response";

export const runtime = "nodejs";
export const POST = route(async request => {
  const body = await readJson(request, guestSchema);
  const url = new URL("/api/auth/guest", request.url);
  const incoming = new Headers(request.headers);
  incoming.set("Content-Type", "application/json"); incoming.delete("Content-Length");
  return authResponse(await auth.handler(new Request(url, { method: "POST", headers: incoming, body: JSON.stringify(body) })));
});
