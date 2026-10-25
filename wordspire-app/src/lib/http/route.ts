import { NextResponse } from "next/server";
import { z } from "zod";
import { isAPIError } from "better-auth/api";
import { AppError } from "./errors";
import { logger } from "./logger";
import { getEnv } from "../config/env";

const domainStatuses: Record<string, number> = {
  UNAUTHORIZED: 401, FORBIDDEN: 403, PRIMARY_DEVICE_REQUIRED: 403,
  CHILD_NOT_FOUND: 404, SESSION_NOT_FOUND: 404, QUESTION_NOT_FOUND: 404, STAGE_NOT_FOUND: 404, BATTLE_NOT_FOUND: 404,
  INVALID_OPTION: 400, INVALID_BODY: 400,
  IDEMPOTENCY_CONFLICT: 409, SESSION_COMPLETED: 409, SESSION_INCOMPLETE: 409, QUESTION_OUT_OF_ORDER: 409,
  STAGE_LOCKED: 409, STAGE_EMPTY: 409, ALREADY_UNLOCKED: 409, INSUFFICIENT_STARS: 409, BATTLE_NOT_ACCEPTABLE: 409,
};
export async function readJson<T extends z.ZodTypeAny>(request: Request, schema: T, options: { allowEmpty?: boolean } = {}): Promise<z.infer<T>> {
  if (Number(request.headers.get("content-length") ?? 0) > 1024 * 1024) throw new AppError("BODY_TOO_LARGE", 413);
  const source = await request.text();
  if (Buffer.byteLength(source) > 1024 * 1024) throw new AppError("BODY_TOO_LARGE", 413);
  let value: unknown;
  try { value = options.allowEmpty && source.trim() === "" ? {} : JSON.parse(source); }
  catch (error) {
    if (error instanceof SyntaxError) throw new AppError("INVALID_JSON", 400);
    throw error;
  }
  return schema.parse(value);
}
export function checkOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(getEnv().BETTER_AUTH_URL).origin) throw new AppError("INVALID_ORIGIN", 403);
}
export function route<P extends Record<string, string | string[]> = Record<string, string>>(handler: (request: Request, context: { params: Promise<P> }) => Promise<Response>) {
  return async (request: Request, context: { params: Promise<P> }): Promise<Response> => {
    const requestId = crypto.randomUUID();
    try {
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) checkOrigin(request);
      const response = await handler(request, context);
      response.headers.set("X-Request-Id", requestId);
      response.headers.set("Cache-Control", "no-store");
      return response;
    } catch (error) {
      const status = error instanceof z.ZodError ? 400 : error instanceof AppError ? error.status : isAPIError(error) ? error.statusCode :
        error instanceof Error ? domainStatuses[error.message] ?? 500 : 500;
      if (status >= 500) logger.error({ err: error, requestId, path: new URL(request.url).pathname }, "请求失败");
      const code = error instanceof z.ZodError ? "INVALID_BODY" : error instanceof AppError ? error.code : isAPIError(error) && status < 500 ? error.body?.code ?? error.body?.message ?? "AUTH_FAILED" :
        status < 500 && error instanceof Error ? error.message : "INTERNAL";
      return NextResponse.json({ error: code, requestId,
        message: error instanceof AppError ? error.message : undefined,
        issues: error instanceof z.ZodError ? error.issues : undefined }, { status, headers: { "X-Request-Id": requestId, "Cache-Control": "no-store" } });
    }
  };
}
