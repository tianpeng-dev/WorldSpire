import { headers } from "next/headers";
import { route } from "./route";
import { getEnv } from "../config/env";

export async function action<T>(operation: (request: Request) => Promise<T>): Promise<T | { error: string; requestId: string; issues?: unknown }> {
  const request = new Request(new URL("/server-action", getEnv().BETTER_AUTH_URL), { method: "POST", headers: await headers() });
  const response = await route(async incoming => Response.json(await operation(incoming)))(request, { params: Promise.resolve({}) });
  return response.json();
}
