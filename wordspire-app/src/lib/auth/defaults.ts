import { asc, eq } from "drizzle-orm";
import type { DatabaseExecutor } from "../db";
import { childProfiles, collectionItems, stageProgress, starWallets, stages } from "../db/schema";
import { customAlphabet, nanoid } from "nanoid";

const friendCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);
export async function initializeChild(tx: DatabaseExecutor, userId: string, deviceId: string, age = 7, grade = "一年级") {
  const existing = (await tx.select().from(childProfiles).where(eq(childProfiles.userId, userId)).limit(1))[0];
  if (existing) {
    if (!existing.primaryDeviceId) {
      return (await tx.update(childProfiles).set({ primaryDeviceId: deviceId }).where(eq(childProfiles.id, existing.id)).returning())[0];
    }
    return existing;
  }
  const stageRows = await tx.select().from(stages).orderBy(asc(stages.order));
  if (!stageRows.length) throw new Error("课程内容尚未初始化，请运行 db:seed。");
  const profile = (await tx.insert(childProfiles).values({ id: nanoid(), userId, age, grade, friendCode: friendCode(), primaryDeviceId: deviceId }).returning())[0];
  await tx.insert(starWallets).values({ id: nanoid(), childProfileId: profile.id });
  await tx.insert(stageProgress).values(stageRows.map((stage, index) => ({ id: nanoid(), childProfileId: profile.id, stageId: stage.id, status: index === 0 ? "unlocked" : "locked" })));
  await tx.insert(collectionItems).values({ id: nanoid(), childProfileId: profile.id, kind: "character", itemKey: "apple", itemName: "小苹果" });
  return profile;
}
