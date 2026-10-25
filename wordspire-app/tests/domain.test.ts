import test from "node:test";
import assert from "node:assert/strict";
import { updateProficiency, pickDifficulty, isStuck } from "../src/lib/adaptive/engine.ts";
import { calcRoundScore, determineWinner } from "../src/lib/battle/bot.ts";
import { signSessionValue, verifySessionValue } from "../src/lib/auth/session-codec.ts";
import { decideSyncVersion } from "../src/lib/db/sync-policy.ts";
import { transitionStageStatus } from "../src/lib/child/stage-state.ts";
import { sameAttempt } from "../src/lib/learning/idempotency.ts";
import { spendStars } from "../src/lib/child/rewards.ts";

test("BKT mastery rises on a correct answer and stays bounded", () => {
  const next = updateProficiency(null, true);
  assert.equal(next.attempts, 1);
  assert.equal(next.p, 0.296);
  assert.ok(next.p >= 0.01 && next.p <= 0.99);
  assert.equal(pickDifficulty(next.p), 1);
});

test("BKT mastery decays after an incorrect answer and detects a stuck learner", () => {
  const next = updateProficiency({ id: "p", childProfileId: "c", targetWord: "Apple", p: 0.8, attempts: 2, lastSeenAt: Date.now() }, false);
  assert.equal(next.attempts, 3);
  assert.equal(next.p, 0.752);
  assert.equal(isStuck(3), true);
});

test("battle scoring is server-deterministic", () => {
  assert.equal(calcRoundScore(false, 100), 0);
  assert.equal(calcRoundScore(true, 1000), 180);
  const winner = determineWinner(
    [{ id: "1", battleId: "b", roundIndex: 1, playerId: "c", questionId: "q", correct: true, latencyMs: 1000, score: 180 }],
    [{ id: "2", battleId: "b", roundIndex: 1, playerId: "o", questionId: "q", correct: false, latencyMs: 1000, score: 0 }],
  );
  assert.deepEqual(winner, { childScore: 180, opponentScore: 0, winner: "child" });
});

test("session signatures reject tampering, expiry, and invalid roles", () => {
  const secret = "test-secret-with-enough-entropy";
  const now = 1_700_000_000_000;
  const payload = JSON.stringify({ userId: "u1", role: "child", childProfileId: "c1", issuedAt: now, expiresAt: now + 60_000 });
  const signed = signSessionValue(payload, secret);
  assert.equal(verifySessionValue(signed, secret, now)?.childProfileId, "c1");
  assert.equal(verifySessionValue(`${signed}x`, secret, now), null);
  assert.equal(verifySessionValue(`${signed}.extra`, secret, now), null);
  assert.equal(verifySessionValue(signed, secret, now + 61_000), null);
  const invalidRole = signSessionValue(payload.replace('"child"', '"admin"'), secret);
  assert.equal(verifySessionValue(invalidRole, secret, now), null);
});

test("sync versions accept newer writes, retry identical writes, and reject conflicts", () => {
  assert.equal(decideSyncVersion({ incomingVersion: 8, currentVersion: 7, incomingDeviceId: "a", currentDeviceId: "b" }), "accept");
  assert.equal(decideSyncVersion({ incomingVersion: 7, currentVersion: 7, incomingDeviceId: "a", currentDeviceId: "a" }), "idempotent");
  assert.equal(decideSyncVersion({ incomingVersion: 6, currentVersion: 7, incomingDeviceId: "a", currentDeviceId: "b" }), "stale");
  assert.equal(decideSyncVersion({ incomingVersion: 7, currentVersion: 7, incomingDeviceId: "a", currentDeviceId: "b" }), "conflict");
});

test("stage transitions keep locked stages inaccessible and unlock the next stage", () => {
  assert.equal(transitionStageStatus("locked", "unlock"), "unlocked");
  assert.equal(transitionStageStatus("unlocked", "start"), "in_progress");
  assert.equal(transitionStageStatus("in_progress", "complete"), "completed");
  assert.throws(() => transitionStageStatus("locked", "start"), /STAGE_NOT_ENTERABLE/);
});

test("attempt identity is idempotent only for the same session, child, and question", () => {
  const identity = { sessionId: "s", childProfileId: "c", questionId: "q" };
  assert.equal(sameAttempt(identity, identity), true);
  assert.equal(sameAttempt(identity, { ...identity, questionId: "other" }), false);
});

test("star spending never produces a negative balance", () => {
  assert.equal(spendStars(50, 20), 30);
  assert.throws(() => spendStars(10, 20), /INSUFFICIENT_STARS/);
});
