import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { ExamController } from "./controller";
import { ExamApiError } from "./api";
import type { RequestApi } from "./api";
import { mutateSession, readSession } from "./storage";
import type { Ack, Attempt, Event, Session } from "./types";
import { effectiveAnswers } from "./types";
function fixture(): Session {
  const key = crypto.randomUUID();
  const q = crypto.randomUUID();
  const attempt: Attempt = {
    id: crypto.randomUUID(),
    examId: "exam",
    status: "IN_PROGRESS",
    attemptNumber: 1,
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    submittedAt: null,
    serverTime: new Date().toISOString(),
    remainingSeconds: 3600,
    answerRevision: 0,
    sessionRevision: 1,
    currentPosition: 0,
    configuration: {
      name: "Math",
      instructions: "Answer all",
      navigationMode: "FREE",
      allowReview: true,
    },
    questions: [
      {
        id: q,
        position: 0,
        sectionPosition: 0,
        marks: 1,
        availableFrom: new Date(Date.now() - 1000).toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        questionType: "ESSAY",
        questionText: "Explain",
        topic: "Numbers",
        sectionName: "A",
        navigationMode: "FREE",
        options: [],
      },
    ],
    navigator: [],
    answers: [],
  };
  attempt.navigator = attempt.questions;
  return {
    key,
    identity: {
      tenantId: key,
      examId: "exam",
      studentId: "12345678",
      deviceId: "device-0000000000001",
    },
    accessToken: "access",
    attemptToken: "attempt",
    sequence: 0,
    pending: [],
    rejected: [],
    attempt,
  };
}
function backend(s: Session) {
  const server = {
    attempt: structuredClone(s.attempt!),
    offline: false,
    loseAck: false,
    auth: false,
    reject: false,
    disposition: "ACCEPTED",
    calls: [] as Event[],
    receipts: new Map<string, Ack>(),
    submits: 0,
  };
  const api = (async (path: string, _token?: string, body?: unknown) => {
    if (server.offline) throw new TypeError("Network down");
    if (server.auth) throw new ExamApiError(401, "Sign in again");
    if (path === "/start")
      return {
        attempt: structuredClone(server.attempt),
        attemptToken: "new-token",
      };
    if (path.endsWith("/answers")) {
      const e = body as Event;
      server.calls.push(structuredClone(e));
      if (server.reject) throw new ExamApiError(409, "Sequence conflict");
      const old = server.receipts.get(e.idempotencyKey);
      if (old) return { ...old, duplicate: true };
      const ack: Ack = {
        eventId: crypto.randomUUID(),
        disposition: server.disposition,
        duplicate: false,
        answerRevision: ++server.attempt.answerRevision,
        status: server.attempt.status,
        serverTime: new Date().toISOString(),
      };
      server.receipts.set(e.idempotencyKey, ack);
      if (server.disposition === "ACCEPTED")
        server.attempt.answers = [
          { ...e, sessionRevision: server.attempt.sessionRevision },
        ];
      if (server.loseAck) {
        server.loseAck = false;
        server.offline = true;
        throw new TypeError("Response lost");
      }
      return ack;
    }
    if (path.endsWith("/submit")) {
      server.submits++;
      server.attempt.status = "SUBMITTED";
      return structuredClone(server.attempt);
    }
    return {
      ...structuredClone(server.attempt),
      serverTime: new Date().toISOString(),
    };
  }) as RequestApi;
  return { server, api };
}
async function setup() {
  const s = fixture();
  await mutateSession(s.key, () => s);
  const { server, api } = backend(s);
  const controller = new ExamController(api);
  await controller.restore(s.key);
  return { s, server, api, controller };
}
describe("durable exam queue", () => {
  it("commits changes locally while offline and restores them after a browser restart", async () => {
    const { s, server, api, controller } = await setup();
    server.offline = true;
    controller.enqueue(s.attempt!.questions[0].id, "My answer", true);
    await controller.refresh();
    const saved = await readSession(s.key);
    expect(saved!.pending).toHaveLength(1);
    expect(saved!.sequence).toBe(1);
    const recovered = new ExamController(api);
    await recovered.restore(s.key);
    expect(
      effectiveAnswers(recovered.snapshot().session!).get(
        s.attempt!.questions[0].id,
      )?.value,
    ).toBe("My answer");
    expect(recovered.serverTime()).toBeNull();
    server.offline = false;
    await recovered.refresh();
    expect(server.calls[0].idempotencyKey).toBe(
      saved!.pending[0].idempotencyKey,
    );
    expect((await readSession(s.key))!.pending).toHaveLength(0);
    expect(recovered.snapshot().session!.attempt!.answers[0].value).toBe(
      "My answer",
    );
  });
  it("retries a lost acknowledgement using exactly the same event and never duplicates the server write", async () => {
    const { s, server, controller } = await setup();
    server.loseAck = true;
    controller.enqueue(s.attempt!.questions[0].id, "Answer", false);
    await controller.refresh();
    expect((await readSession(s.key))!.pending).toHaveLength(1);
    server.offline = false;
    await controller.refresh();
    expect(server.calls[0]).toEqual(server.calls[1]);
    expect(server.receipts.size).toBe(1);
    expect((await readSession(s.key))!.pending).toHaveLength(0);
  });
  it("allocates monotonic sequences and persists every rapid edit without replacing pending events", async () => {
    const { s, server, controller } = await setup();
    server.offline = true;
    for (const text of ["a", "ab", "abc"])
      controller.enqueue(s.attempt!.questions[0].id, text, false);
    await controller.refresh();
    const saved = (await readSession(s.key))!;
    expect(saved.pending.map((e) => e.clientSequence)).toEqual([1, 2, 3]);
    expect(saved.pending.map((e) => e.value)).toEqual(["a", "ab", "abc"]);
    server.offline = false;
    await controller.refresh();
    expect(server.attempt.answers[0].value).toBe("abc");
  });
  it("retains rejected events for recovery and never labels them accepted", async () => {
    const { s, server, controller } = await setup();
    server.disposition = "EXPIRED";
    controller.enqueue(s.attempt!.questions[0].id, "Late answer", false);
    await controller.refresh();
    const saved = (await readSession(s.key))!;
    expect(saved.rejected[0].event.value).toBe("Late answer");
    expect(saved.rejected[0].reason).toBe("EXPIRED");
    expect(saved.attempt!.answers).toHaveLength(0);
  });
  it("preserves pending work when tokens expire and does not clear unrelated sessions", async () => {
    const { s, server, controller } = await setup();
    server.auth = true;
    controller.enqueue(s.attempt!.questions[0].id, "Offline work", false);
    await controller.refresh();
    expect(controller.snapshot().authRequired).toBe(true);
    expect((await readSession(s.key))!.pending).toHaveLength(1);
    expect((await readSession(s.key))!.accessToken).toBe("access");
  });
  it("quarantines old-device events rather than resending them under a new device revision", async () => {
    const { s, server, controller } = await setup();
    server.offline = true;
    controller.enqueue(s.attempt!.questions[0].id, "Old device answer", false);
    await controller.refresh();
    server.offline = false;
    server.attempt.sessionRevision = 2;
    await controller.start();
    const saved = (await readSession(s.key))!;
    expect(saved.pending).toHaveLength(0);
    expect(saved.rejected).toHaveLength(1);
    expect(server.calls).toHaveLength(0);
  });
  it("does not submit while offline or with unsynced work, and requires a separate confirmation", async () => {
    const { s, server, controller } = await setup();
    server.offline = true;
    controller.enqueue(s.attempt!.questions[0].id, "Answer", false);
    await controller.review();
    await controller.submit();
    expect(server.submits).toBe(0);
    expect(controller.snapshot().reviewing).toBe(false);
    server.offline = false;
    await controller.review();
    expect(server.submits).toBe(0);
    expect(controller.snapshot().session!.pending).toHaveLength(0);
    await controller.submit();
    expect(server.submits).toBe(1);
    expect(controller.snapshot().session!.attempt!.status).toBe("SUBMITTED");
  });
  it("leaves no credentials behind after sign-out while retaining unsent answers for reauthentication", async () => {
    const { s, server, controller } = await setup();
    server.offline = true;
    controller.enqueue(s.attempt!.questions[0].id, "Saved", false);
    await controller.refresh();
    await controller.leave();
    const saved = (await readSession(s.key))!;
    expect(saved.pending).toHaveLength(1);
    expect(saved.accessToken).toBe("");
    expect(saved.attemptToken).toBe("");
    expect(controller.snapshot().session).toBeUndefined();
  });
  it("uses the server event counter when recovering a lost local sequence", async () => {
    const { server, controller } = await setup();
    server.attempt.lastClientSequence = 20;
    await controller.start();
    expect(controller.snapshot().session!.sequence).toBe(20);
  });
  it("persists free navigation offline, while keeping time unknown after suspension", async () => {
    const { s, server, controller } = await setup();
    server.offline = true;
    await controller.navigate(s.attempt!.questions[0].id);
    expect((await readSession(s.key))!.selectedQuestionId).toBe(
      s.attempt!.questions[0].id,
    );
    controller.suspendClock();
    expect(controller.serverTime()).toBeNull();
  });
  it("holds locally saved changes while paused and syncs them after resume", async () => {
    const { s, server, controller } = await setup();
    server.attempt.status = "PAUSED";
    server.attempt.pausedAt = new Date().toISOString();
    await controller.refresh();
    controller.enqueue(s.attempt!.questions[0].id, "Held answer", false);
    await controller.refresh();
    expect((await readSession(s.key))!.pending).toHaveLength(1);
    expect(server.calls).toHaveLength(0);
    server.attempt.status = "IN_PROGRESS";
    server.attempt.pausedAt = null;
    await controller.refresh();
    expect((await readSession(s.key))!.pending).toHaveLength(0);
    expect(server.calls).toHaveLength(1);
  });
});
