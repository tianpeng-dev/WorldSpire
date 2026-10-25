import { and, eq, sql } from "drizzle-orm";
import { collectionItems, starWallets } from "../db/schema";
import { childTransaction } from "../db/transaction";
import { recordSyncChange } from "../db/sync-records";
import { collectionSeedEntry } from "../child/server";
import { AppError } from "../http/errors";
import { newId } from "../utils";

export async function unlockCollection(childProfileId: string, itemKey: string) {
  const entry = collectionSeedEntry(itemKey);
  if (!entry) throw new AppError("ITEM_NOT_FOUND", 404);
  if (entry.unlockCost <= 0) throw new AppError("ITEM_NOT_PURCHASABLE", 409);
  return childTransaction(childProfileId, async tx => {
    const wallet = (await tx.select().from(starWallets).where(eq(starWallets.childProfileId, childProfileId)))[0];
    if (!wallet) throw new Error("儿童钱包缺失");
    const existing = (await tx.select().from(collectionItems).where(and(eq(collectionItems.childProfileId, childProfileId), eq(collectionItems.kind, entry.kind), eq(collectionItems.itemKey, itemKey))))[0];
    if (existing) return { itemKey, balance: wallet.balance };
    if (wallet.balance < entry.unlockCost) throw new AppError("INSUFFICIENT_STARS", 409);
    const updated = (await tx.update(starWallets).set({ balance: sql`${starWallets.balance} - ${entry.unlockCost}` }).where(eq(starWallets.id, wallet.id)).returning())[0];
    const item = (await tx.insert(collectionItems).values({ id: newId(), childProfileId, kind: entry.kind, itemKey, itemName: entry.itemName }).returning())[0];
    await recordSyncChange(tx, { childProfileId, entity: "wallets", entityId: wallet.id, op: "update", payload: { balance: updated.balance, totalEarned: updated.totalEarned } });
    await recordSyncChange(tx, { childProfileId, entity: "collection", entityId: item.id, op: "insert", payload: { kind: item.kind, itemKey, itemName: item.itemName, unlockedAt: item.unlockedAt.getTime() } });
    return { itemKey, balance: updated.balance };
  });
}
