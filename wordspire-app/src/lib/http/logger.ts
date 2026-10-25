import pino from "pino";
export function cleanMessage(message: string): string {
  let cleaned = message.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[数据库连接凭据已隐藏]")
    .replace(/Bearer\s+[^\s]+/gi, "Bearer [已隐藏]").replace(/\nparams:[\s\S]*/gi, "\nparams: [已隐藏]");
  for (const name of ["BETTER_AUTH_SECRET", "SESSION_SECRET", "CRON_SECRET", "LLM_API_KEY", "BLOB_READ_WRITE_TOKEN", "FCM_SERVER_KEY"]) {
    const secret = process.env[name];
    if (secret) cleaned = cleaned.replaceAll(secret, "[已隐藏]");
  }
  return cleaned;
}
export const logger = pino({
  level: "info",
  redact: ["password", "secret", "token", "cookie", "authorization", "headers.cookie", "headers.authorization"],
  serializers: {
    err(error: unknown) {
      if (!(error instanceof Error)) return { message: cleanMessage(String(error)) };
      const extra = error as Error & { code?: string; cause?: unknown };
      return { name: error.name, message: cleanMessage(error.message), code: extra.code,
        cause: extra.cause instanceof Error ? cleanMessage(extra.cause.message) : undefined };
    },
  },
});
