export interface AttemptIdentity {
  sessionId: string;
  childProfileId: string;
  questionId: string;
}

export function sameAttempt(existing: AttemptIdentity, incoming: AttemptIdentity): boolean {
  return existing.sessionId === incoming.sessionId
    && existing.childProfileId === incoming.childProfileId
    && existing.questionId === incoming.questionId;
}
