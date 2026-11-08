import { and, eq, sql } from "drizzle-orm";
import { db, type Transaction } from "@/lib/db";
import { duelAnswers, duelRooms, stages } from "@/lib/db/schema";
import { getStageQuestions, questionToDto } from "@/lib/child/server";
import { AppError } from "@/lib/http/errors";
import { newId } from "@/lib/utils";
import { calcRoundScore } from "./bot";
import { DUEL_ROUND_MS, DUEL_ROUNDS, type DuelState } from "./duel-contract";

const WAIT_MS = 15 * 60_000;
const OFFLINE_MS = 45_000;
type Room = typeof duelRooms.$inferSelect;
type Answer = typeof duelAnswers.$inferSelect;
type Operation = { kind: "join" | "ready" | "presence" | "leave" } |
  { kind: "answer"; roundIndex: number; optionId: string };

export async function createDuel(playerId: string, stageId: string) {
  const [stage] = await db.select({ id: stages.id }).from(stages).where(eq(stages.id, stageId));
  if (!stage) throw new AppError("STAGE_NOT_FOUND", 404);
  const id = newId();
  await db.insert(duelRooms).values({
    id, hostId: playerId, stageId,
    hostSeenAt: sql`clock_timestamp()`, expiresAt: sql`clock_timestamp() + interval '1 millisecond' * ${WAIT_MS}`,
  });
  return { id };
}

function expired(room: Room, now: number) {
  if (room.status === "waiting" && now >= +room.expiresAt) return "waiting_timeout";
  if (room.status === "playing" &&
      (now - +room.hostSeenAt >= OFFLINE_MS || (room.guestSeenAt && now - +room.guestSeenAt >= OFFLINE_MS))) {
    return "disconnected";
  }
  return null;
}

function roundStart(room: Room) {
  if (!room.roundStartedAt) throw new Error("真人对战缺少回合开始时间");
  return +room.roundStartedAt;
}

function roundQuestion(room: Room) {
  const item = room.questionPlan?.[room.roundIndex - 1];
  if (!item) throw new Error("真人对战缺少当前回合的题目配置");
  return item;
}

async function serverNow(tx: Transaction) {
  const [{ now }] = (await tx.execute<{ now: number }>(sql`select floor(extract(epoch from clock_timestamp()) * 1000)::double precision as now`)).rows;
  return now;
}

async function update(tx: Transaction, room: Room, values: Partial<Room>) {
  await tx.update(duelRooms).set(values).where(eq(duelRooms.id, room.id));
  Object.assign(room, values);
}

function score(answers: Answer[], playerId: string | null, round: number) {
  return answers.find(answer => answer.playerId === playerId && answer.roundIndex === round)?.score ?? 0;
}

async function advance(tx: Transaction, room: Room, answers: Answer[], now: number) {
  while (room.status === "playing") {
    const deadline = roundStart(room) + DUEL_ROUND_MS;
    const complete = answers.filter(answer => answer.roundIndex === room.roundIndex).length === 2;
    if (!complete && now < deadline) return;
    if (room.roundIndex === DUEL_ROUNDS) {
      let wins = 0;
      for (let round = 1; round <= DUEL_ROUNDS; round++) {
        wins += Math.sign(score(answers, room.hostId, round) - score(answers, room.guestId, round));
      }
      await update(tx, room, { status: "finished", winnerId: wins > 0 ? room.hostId : wins < 0 ? room.guestId : null });
      return;
    }
    await update(tx, room, { roundIndex: room.roundIndex + 1, roundStartedAt: new Date(complete ? now : deadline) });
  }
}

function view(room: Room, playerId: string, answers: Answer[], now: number): DuelState {
  const host = room.hostId === playerId;
  const playing = room.status === "playing";
  const answered = answers.some(answer => answer.playerId === playerId && answer.roundIndex === room.roundIndex);
  const revealed = answers.filter(answer => !playing || answer.roundIndex < room.roundIndex);
  const total = (id: string | null) => revealed.reduce((sum, answer) => sum + (answer.playerId === id ? answer.score : 0), 0);
  return {
    id: room.id, status: room.status as DuelState["status"], endedReason: room.endedReason,
    hasOpponent: room.guestId !== null, ready: host ? room.hostReady : room.guestReady,
    opponentReady: host ? room.guestReady : room.hostReady, roundIndex: room.roundIndex, answered,
    question: playing ? roundQuestion(room).question : null,
    remainingMs: playing ? Math.max(0, roundStart(room) + DUEL_ROUND_MS - now) : 0,
    score: total(playerId), opponentScore: total(host ? room.guestId : room.hostId),
    result: room.status !== "finished" ? null : room.winnerId === null ? "draw" : room.winnerId === playerId ? "win" : "loss",
  };
}

export async function operateDuel(id: string, playerId: string, operation: Operation): Promise<DuelState> {
  return db.transaction(async tx => {
    const [room] = await tx.select().from(duelRooms).where(eq(duelRooms.id, id)).for("update");
    if (!room) throw new AppError("DUEL_NOT_FOUND", 404);
    const host = room.hostId === playerId;
    const member = host || room.guestId === playerId;
    if (!member && operation.kind !== "join") throw new AppError("DUEL_NOT_FOUND", 404);
    const now = await serverNow(tx);
    const reason = expired(room, now);
    if (operation.kind === "join" && !member) {
      if (room.status !== "waiting" || reason || room.guestId) throw new AppError("DUEL_NOT_JOINABLE", 409);
      await update(tx, room, { guestId: playerId, guestSeenAt: new Date(now) });
    }

    if (operation.kind === "answer") {
      if (room.status !== "playing" || reason) throw new AppError("DUEL_NOT_ACTIVE", 409);
      if (operation.roundIndex !== room.roundIndex) throw new AppError("QUESTION_OUT_OF_ORDER", 409);
      const item = roundQuestion(room);
      const option = item.question.options.findIndex(entry => entry.id === operation.optionId);
      if (option < 0) throw new AppError("INVALID_OPTION", 400);
      const latencyMs = now - roundStart(room);
      if (latencyMs < 0 || latencyMs >= DUEL_ROUND_MS) throw new AppError("DUEL_ROUND_TIMEOUT", 409);
      const [existing] = await tx.select().from(duelAnswers).where(and(eq(duelAnswers.roomId, id),
        eq(duelAnswers.playerId, playerId), eq(duelAnswers.roundIndex, room.roundIndex)));
      if (existing) throw new AppError("DUEL_ALREADY_ANSWERED", 409);
      await tx.insert(duelAnswers).values({ roomId: id, playerId, roundIndex: room.roundIndex,
        optionId: operation.optionId, latencyMs, score: calcRoundScore(option === item.correctIndex, latencyMs) });
    } else if (reason || (operation.kind === "leave" && (room.status === "waiting" || room.status === "playing"))) {
      await update(tx, room, { status: "closed", endedReason: reason ?? "left" });
    }

    if (room.status === "waiting") {
      const hostReady = (room.hostReady && now - +room.hostSeenAt < OFFLINE_MS) || (host && operation.kind === "ready");
      const guestReady = (room.guestReady && room.guestSeenAt !== null && now - +room.guestSeenAt < OFFLINE_MS) ||
        (!host && operation.kind === "ready");
      await update(tx, room, { hostReady, guestReady, ...(host ? { hostSeenAt: new Date(now) } : { guestSeenAt: new Date(now) }) });
      if (room.guestId && hostReady && guestReady) {
        const configured = await getStageQuestions(room.stageId, tx);
        if (!configured.length) throw new AppError("STAGE_EMPTY", 409);
        const questionPlan = Array.from({ length: DUEL_ROUNDS }, (_, i) => {
          const question = configured[i % configured.length];
          return { question: questionToDto(question), correctIndex: question.correctIndex };
        });
        const started = new Date(await serverNow(tx));
        await update(tx, room, { status: "playing", questionPlan, roundStartedAt: started, hostSeenAt: started, guestSeenAt: started });
        return view(room, playerId, [], +started);
      }
    } else if (room.status === "playing") {
      await update(tx, room, host ? { hostSeenAt: new Date(now) } : { guestSeenAt: new Date(now) });
    }

    const answers = await tx.select().from(duelAnswers).where(eq(duelAnswers.roomId, id));
    await advance(tx, room, answers, now);
    return view(room, playerId, answers, now);
  });
}
