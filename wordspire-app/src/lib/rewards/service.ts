import { eq, sql } from "drizzle-orm";
import type { Transaction } from "../db";
import { starWallets } from "../db/schema";
import { recordSyncChange } from "../db/sync-records";

export async function creditStars(tx: Transaction, childProfileId: string, amount: number) {
  if (!Number.isInteger(amount) || amount < 0) throw new Error("奖励数量无效");
  const wallet = (await tx.update(starWallets).set({ balance: sql`${starWallets.balance} + ${amount}`, totalEarned: sql`${starWallets.totalEarned} + ${amount}` })
    .where(eq(starWallets.childProfileId, childProfileId)).returning())[0];
  if (!wallet) throw new Error("儿童钱包缺失");
  await recordSyncChange(tx, { childProfileId, entity: "wallets", entityId: wallet.id, op: "update", payload: { balance: wallet.balance, totalEarned: wallet.totalEarned } });
  return wallet;
}
