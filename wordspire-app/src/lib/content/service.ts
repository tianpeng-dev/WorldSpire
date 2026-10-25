import { asc, eq } from "drizzle-orm";
import type { DatabaseExecutor } from "../db";
import { courses, units, stages, questions } from "../db/schema";
import { COURSE_SEED, STAGE_SEED, QUESTION_SEED, getOptionsForQuestion, getCorrectIndex } from "../child/seed";
import { notConfigured } from "../http/errors";
import { getEnv } from "../config/env";

export async function seedContent(tx: DatabaseExecutor): Promise<void> {
  await tx.insert(courses).values({ id: COURSE_SEED.id, kind: COURSE_SEED.kind, title: COURSE_SEED.title, unitIds: [COURSE_SEED.unitId] }).onConflictDoNothing();
  await tx.insert(units).values({ id: COURSE_SEED.unitId, courseId: COURSE_SEED.id, title: COURSE_SEED.title, order: 1, stageIds: STAGE_SEED.map(stage => stage.id) }).onConflictDoNothing();
  await tx.insert(stages).values(STAGE_SEED.map(stage => ({ ...stage, unitId: COURSE_SEED.unitId }))).onConflictDoNothing();
  await tx.insert(questions).values(QUESTION_SEED.map(question => ({ id: question.id, stageId: question.stageId, type: question.type, difficulty: 1,
    targetWord: question.targetWord, promptAudioUrl: null, imageAssetUrl: null, options: getOptionsForQuestion(question).map(option => option.label), correctIndex: getCorrectIndex(question) }))).onConflictDoNothing();
}
export async function listCourses(tx: DatabaseExecutor) { return tx.select().from(courses).orderBy(asc(courses.id)); }
export async function getStagePackage(tx: DatabaseExecutor, stageId: string) {
  return { stageId, questions: await tx.select().from(questions).where(eq(questions.stageId, stageId)).orderBy(asc(questions.id)) };
}
export async function uploadAsset(path: string, body: Blob) {
  if (!getEnv().BLOB_READ_WRITE_TOKEN) notConfigured("内容资源存储");
  const { put } = await import("@vercel/blob");
  return put(path, body, { access: "public", token: getEnv().BLOB_READ_WRITE_TOKEN });
}
