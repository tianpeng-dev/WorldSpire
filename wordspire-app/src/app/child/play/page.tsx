"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChildShell,
  ErrorState,
  LoadingState,
  AudioButton,
  OptionCard,
  StarBadge,
  WSCard,
} from "@/components/child/ChildShell";
import { addQuery, useChildQuery } from "@/components/child/useChildQuery";
import { apiRequest, isNetworkError } from "@/lib/child/api";
import { getDemoQuestion } from "@/lib/child/catalog";
import { speak } from "@/lib/child/audio";
import { enqueueSync, getLocalDB, getLocalSession, saveLocalAttempt } from "@/store/local-db";
import type { Attempt, LearningSessionDTO, QuestionDTO } from "@/types";

export default function PlayQuestionPage() {
  const router = useRouter();
  const { ready, demo, params } = useChildQuery();
  const [question, setQuestion] = useState<QuestionDTO | null>(null);
  const [session, setSession] = useState<LearningSessionDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answering, setAnswering] = useState(false);
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());

  const sessionId = params?.get("sessionId") ?? "demo-session";
  const index = Number(params?.get("index") ?? 0);
  const displayIndex = session?.currentIndex !== undefined ? session.currentIndex + 1 : index + 1;
  const totalQuestions = session?.totalQuestions ?? 5;

  useEffect(() => {
    if (!ready || !params) return;
    setAnswering(false);
    setError(null);
    setStartedAt(Date.now());
    if (demo) {
      setQuestion(getDemoQuestion(index));
      setSession({ id: sessionId, stageId: params.get("stageId") ?? "stage-fruit-2", currentIndex: index, totalQuestions: 5, earnedStars: 2, question: getDemoQuestion(index) });
      return;
    }
    void apiRequest<LearningSessionDTO | { session: LearningSessionDTO }>(`/api/learning/sessions/${encodeURIComponent(sessionId)}`)
      .then((payload) => {
        const next = "session" in payload ? payload.session : payload;
        setSession(next);
        setQuestion(next.question);
      })
      .catch(async (loadError) => {
        if (!isNetworkError(loadError) && (typeof navigator === "undefined" || navigator.onLine)) {
          setError("题目暂时没有准备好，请回地图再试一次。");
          return;
        }
        const localSession = await getLocalSession(sessionId);
        const cachedSession = window.sessionStorage.getItem(`ws_session_${sessionId}`);
        const cachedQuestion = window.sessionStorage.getItem(`ws_question_${sessionId}`);
        if (!localSession || !cachedQuestion) {
          setError("当前题目还没有缓存，请联网后再试一次。");
          return;
        }
        const nextQuestion = JSON.parse(cachedQuestion) as QuestionDTO;
        const fallbackSession = cachedSession ? JSON.parse(cachedSession) as LearningSessionDTO : {
          id: sessionId,
          stageId: nextQuestion.stageId,
          currentIndex: index,
          totalQuestions: 5,
          earnedStars: 0,
          question: nextQuestion,
        };
        setSession({ ...fallbackSession, question: nextQuestion });
        setQuestion(nextQuestion);
      });
  }, [demo, index, params, ready, sessionId]);

  const optionToQuestion = useMemo(() => {
    if (!question) return new Map<string, string>();
    return new Map(question.options.map((option) => [option.id, option.label]));
  }, [question]);

  async function answer(optionId: string) {
    if (!question || answering) return;
    setAnswering(true);
    const optionLabel = optionToQuestion.get(optionId);
    const correct = optionLabel === question.translation;
    const nextIndex = index + 1;
    if (demo) {
      const path = correct ? "/child/play/correct" : "/child/play/wrong";
      router.push(addQuery(path, {
        sessionId,
        index: correct ? nextIndex : index,
        word: question.targetWord,
        translation: question.translation,
        visual: question.options.find((option) => option.id === optionId)?.visual,
        correctVisual: question.options.find((option) => option.label === question.translation)?.visual,
        stageId: question.stageId,
        complete: correct && nextIndex >= totalQuestions ? "1" : undefined,
      }, true));
      return;
    }

    const idempotencyKey = `${sessionId}:${question.id}:${optionId}`;
    const answeredAt = Date.now();
    const latencyMs = Math.max(0, answeredAt - startedAt);
    try {
      const result = await apiRequest<{
        correct: boolean;
        targetWord: string;
        translation: string;
        correctOption: { id: string; visual: string; label: string };
        earnedStars: number;
        sessionComplete: boolean;
        nextQuestion: QuestionDTO | null;
      }>(`/api/learning/sessions/${encodeURIComponent(sessionId)}/attempts`, {
        method: "POST",
        body: {
          questionId: question.id,
          optionId,
          latencyMs,
          idempotencyKey,
        },
      });
      router.push(addQuery(result.correct ? "/child/play/correct" : "/child/play/wrong", {
        sessionId,
        index: nextIndex,
        word: result.targetWord,
        translation: result.translation,
        visual: question.options.find((option) => option.id === optionId)?.visual,
        correctVisual: result.correctOption.visual,
        complete: result.sessionComplete ? "1" : undefined,
      }));
    } catch (submitError) {
      if (isNetworkError(submitError) || (typeof navigator !== "undefined" && !navigator.onLine)) {
        const childProfileId = window.sessionStorage.getItem("ws_child_profile_id");
        if (childProfileId) {
          try {
            const { deviceId } = await getLocalDB();
            const attempt: Attempt = {
              id: idempotencyKey,
              sessionId,
              questionId: question.id,
              correct,
              latencyMs,
              answeredAt,
              syncStatus: "local_dirty",
            };
            await saveLocalAttempt(attempt);
            await enqueueSync({
              childProfileId,
              entity: "attempts",
              entityId: attempt.id,
              op: "insert",
              version: Math.floor(answeredAt / 1000),
              deviceId,
              status: "local_dirty",
              payload: {
                sessionId,
                questionId: question.id,
                correct,
                latencyMs,
                answeredAt,
                selectedIndex: question.options.findIndex((option) => option.id === optionId),
                optionId,
                idempotencyKey,
                targetWord: question.targetWord,
              },
            });
            router.push(addQuery(correct ? "/child/play/correct" : "/child/play/wrong", {
              sessionId,
              index: nextIndex,
              word: question.targetWord,
              translation: question.translation,
              visual: question.options.find((option) => option.id === optionId)?.visual,
              correctVisual: question.options.find((option) => option.label === question.translation)?.visual,
              offline: "1",
            }));
            return;
          } catch {
            // Fall through to the visible retry state when local storage is unavailable.
          }
        }
      }
      setAnswering(false);
      setError("答案没有送出去，请检查网络后再试一次。" );
    }
  }

  if (!ready || (!question && !error)) return <ChildShell active="map"><LoadingState label="小塔正在出题…" /></ChildShell>;
  if (error || !question) return <ChildShell active="map"><ErrorState message={error ?? undefined} /></ChildShell>;

  return (
    <ChildShell active="map">
      <section className="quiz-question" aria-label="闯关答题">
        <header className="quiz-header">
          <span className="ws-badge">第 {displayIndex} / {totalQuestions} 题</span>
          <StarBadge>{session?.earnedStars ?? 2} 星</StarBadge>
        </header>
        <WSCard className="quiz-prompt">
          <p>点击正确的图片</p>
          <h2 className="ws-title">{question.targetWord}</h2>
          <AudioButton onClick={() => speak(question.targetWord, question.promptAudioUrl)} />
        </WSCard>
        <div className="quiz-options" aria-label="答案选项">
          {question.options.map((option) => (
            <OptionCard
              key={option.id}
              visual={option.visual}
              label={option.label}
              disabled={answering}
              onClick={() => void answer(option.id)}
            />
          ))}
        </div>
      </section>
    </ChildShell>
  );
}
