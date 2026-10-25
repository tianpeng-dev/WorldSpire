import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export type SessionRole = "child" | "guardian";

export interface SessionClaims {
  userId: string;
  role: SessionRole;
  childProfileId?: string;
  issuedAt: number;
  expiresAt: number;
}

const claimsSchema = z.object({ userId: z.string().min(1).max(21), role: z.enum(["child", "guardian"]),
  childProfileId: z.string().min(1).max(21).optional(), issuedAt: z.number().int().nonnegative(), expiresAt: z.number().int().nonnegative() })
  .refine(value => value.expiresAt > value.issuedAt && (value.role !== "child" || !!value.childProfileId));

export function signSessionValue(payload: string, secret: string): string {
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifySessionValue(signed: string, secret: string, now = Date.now()): SessionClaims | null {
  const parts = signed.split(".");
  if (parts.length !== 2 || signed.length > 8192) return null;
  const [encoded, signature] = parts;
  if (!encoded || !signature) return null;
  const expected = createHmac("sha256", secret).update(encoded).digest("base64url");
  const left = Buffer.from(signature, "utf8");
  const right = Buffer.from(expected, "utf8");
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  try {
    const result = claimsSchema.safeParse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")));
    if (!result.success || result.data.expiresAt <= now || result.data.issuedAt > now + 5 * 60 * 1000) return null;
    return result.data;
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}
