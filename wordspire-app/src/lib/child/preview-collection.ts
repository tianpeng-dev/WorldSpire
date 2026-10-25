import { z } from "zod";
import { DEMO_COLLECTION } from "./catalog";
import type { CollectionDTO } from "@/types";

const STORAGE_KEY = "ws_ui_preview_collection";
const previewSchema = z.object({
  balance: z.number().int().nonnegative(),
  unlocked: z.array(z.string()),
});

export function getPreviewCollection(): CollectionDTO {
  const stored = window.sessionStorage.getItem(STORAGE_KEY);
  const state = stored ? previewSchema.parse(JSON.parse(stored)) : {
    balance: DEMO_COLLECTION.balance,
    unlocked: [],
  };
  return {
    balance: state.balance,
    characters: DEMO_COLLECTION.characters.map((item) => ({
      ...item,
      unlocked: item.unlocked || state.unlocked.includes(item.itemKey),
    })),
    badges: DEMO_COLLECTION.badges.map((item) => ({ ...item })),
  };
}

export function unlockPreviewCharacter(itemKey: string): CollectionDTO {
  const collection = getPreviewCollection();
  const entry = collection.characters.find((item) => item.itemKey === itemKey);
  if (!entry) throw new Error("PREVIEW_ITEM_NOT_FOUND");
  if (entry.unlocked) return collection;
  if (collection.balance < entry.unlockCost) throw new Error("PREVIEW_INSUFFICIENT_STARS");
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
    balance: collection.balance - entry.unlockCost,
    unlocked: collection.characters.filter((item) => item.unlocked || item.itemKey === itemKey).map((item) => item.itemKey),
  }));
  return getPreviewCollection();
}

export function resetPreviewCollection(): void {
  window.sessionStorage.removeItem(STORAGE_KEY);
}
