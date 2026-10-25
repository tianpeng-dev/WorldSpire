import type { StageStatus } from "@/types";

export type StageTransition = "unlock" | "start" | "complete";

export function transitionStageStatus(status: StageStatus, transition: StageTransition): StageStatus {
  if (transition === "unlock") return status === "locked" ? "unlocked" : status;
  if (transition === "start") {
    if (status === "unlocked" || status === "in_progress") return "in_progress";
    throw new Error("STAGE_NOT_ENTERABLE");
  }
  if (status === "in_progress" || status === "completed") return "completed";
  throw new Error("STAGE_NOT_COMPLETEABLE");
}

export function canStartStage(status: StageStatus): boolean {
  return status === "unlocked" || status === "in_progress";
}
