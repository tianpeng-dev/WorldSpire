import { eq } from "drizzle-orm";
import { db, type Transaction } from ".";
import { childProfiles } from "./schema";
import { AppError } from "../http/errors";

export async function lockChild(tx: Transaction, childProfileId: string) {
  const child = (await tx.select().from(childProfiles).where(eq(childProfiles.id, childProfileId)).for("update"))[0];
  if (!child) throw new AppError("CHILD_NOT_FOUND", 404);
  return child;
}

export async function childTransaction<T>(childProfileId: string, fn: (tx: Transaction) => Promise<T>, tx?: Transaction): Promise<T> {
  if (tx) return fn(tx);
  return db.transaction(async current => { await lockChild(current, childProfileId); return fn(current); });
}
