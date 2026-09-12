import { examApi, ExamApiError } from "./api";
import type { RequestApi } from "./api";
import { mutateSession, readSession } from "./storage";
import { sessionKey } from "./types";
import type { Ack, Attempt, Identity, Info, Session, Value } from "./types";
export interface View {
  session?: Session;
  busy: boolean;
  writing: number;
  message: string;
  authRequired: boolean;
  fatal: boolean;
  reviewing: boolean;
  connected: boolean;
}
const message = (e: unknown) =>
  e instanceof Error ? e.message : "Exam request failed.";
export class ExamController {
  private view: View = {
    busy: false,
    writing: 0,
    message: "",
    authRequired: false,
    fatal: false,
    reviewing: false,
    connected: false,
  };
  private listeners = new Set<() => void>();
  private writes: Promise<void> = Promise.resolve();
  private network: Promise<void> = Promise.resolve();
  private stopped = false;
  private anchor?: { server: number; monotonic: number };
  constructor(privateApi: RequestApi = examApi) {
    this.api = privateApi;
  }
  private api: RequestApi;
  snapshot = () => this.view;
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  private update(patch: Partial<View>) {
    this.view = { ...this.view, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  stop() {
    this.stopped = true;
  }
  suspendClock() {
    this.anchor = undefined;
    this.update({});
  }
  serverTime() {
    return this.anchor
      ? this.anchor.server + performance.now() - this.anchor.monotonic
      : null;
  }
  private observe(serverTime: string) {
    this.anchor = {
      server: Date.parse(serverTime),
      monotonic: performance.now(),
    };
  }
  private async persist(update: (s: Session) => Session) {
    const key = this.view.session!.key;
    const saved = await mutateSession(key, (s) => {
      if (!s) throw new Error("Local exam session is missing.");
      return update(s);
    });
    this.update({ session: saved });
    return saved;
  }
  private fail(e: unknown) {
    const auth =
      e instanceof ExamApiError && (e.status === 401 || e.status === 403);
    this.update({
      connected: false,
      authRequired: auth || this.view.authRequired,
      message:
        e instanceof ExamApiError
          ? e.message
          : "Connection interrupted. Answers saved on this device will retry automatically.",
    });
  }
  private exclusive(task: () => Promise<void>) {
    const result = this.network.then(async () => {
      if (!this.stopped) await task();
    });
    this.network = result.catch(() => {});
    return result;
  }
  async restore(key: string) {
    try {
      const session = await readSession(key);
      if (session)
        this.update({
          session,
          authRequired: !session.accessToken,
          message: session.attempt
            ? "Saved exam recovered. Connecting to verify time and status…"
            : "",
        });
      // Never trust wall-clock time after a process restart: require a new server-time sample before editing.
      if (session?.attemptToken) await this.refresh();
    } catch (e) {
      this.update({
        fatal: true,
        message: `Device storage unavailable: ${message(e)}`,
      });
    }
  }
  async login(identity: Identity, pin: string) {
    this.update({ busy: true, message: "" });
    try {
      const result = await this.api<{ accessToken: string }>(
        "/login",
        undefined,
        { ...identity, pin },
      );
      const key = sessionKey(identity);
      const saved = await mutateSession(key, (old) => ({
        ...(old ?? {
          key,
          identity,
          sequence: 0,
          pending: [],
          rejected: [],
          attemptToken: "",
        }),
        identity,
        accessToken: result.accessToken,
      }));
      this.update({ session: saved, authRequired: false });
      const info = await this.api<Info>("/exam", result.accessToken);
      this.observe(info.serverTime);
      await this.persist((s) => ({ ...s, info }));
      if (saved.attempt) await this.start();
      else this.update({ connected: true });
    } catch (e) {
      this.update({ message: message(e) });
    } finally {
      this.update({ busy: false });
    }
  }
  async leave() {
    this.update({ busy: true });
    await this.exclusive(async () => {
      await this.writes;
      if (this.view.fatal) {
        this.update({ busy: false });
        return;
      }
      await this.persist((s) => ({ ...s, accessToken: "", attemptToken: "" }));
      this.anchor = undefined;
      this.update({
        session: undefined,
        busy: false,
        reviewing: false,
        authRequired: false,
        message: "",
      });
    });
  }
  async start() {
    return this.exclusive(async () => {
      this.update({ busy: true, message: "" });
      try {
        const result = await this.api<{
          attempt: Attempt;
          attemptToken: string;
        }>("/start", this.view.session!.accessToken, {});
        this.observe(result.attempt.serverTime);
        await this.persist((s) => {
          const changed =
            s.attempt &&
            (s.attempt.id !== result.attempt.id ||
              s.attempt.sessionRevision !== result.attempt.sessionRevision);
          return {
            ...s,
            attempt: result.attempt,
            attemptToken: result.attemptToken,
            sequence: changed
              ? Math.max(
                  result.attempt.lastClientSequence ?? 0,
                  ...result.attempt.answers
                    .filter(
                      (a) =>
                        a.sessionRevision === result.attempt.sessionRevision,
                    )
                    .map((a) => a.clientSequence),
                )
              : Math.max(
                  s.sequence,
                  result.attempt.lastClientSequence ?? 0,
                  ...result.attempt.answers
                    .filter(
                      (a) =>
                        a.sessionRevision === result.attempt.sessionRevision,
                    )
                    .map((a) => a.clientSequence),
                ),
            pending: changed ? [] : s.pending,
            rejected: changed
              ? [
                  ...s.rejected,
                  ...s.pending.map((event) => ({
                    event,
                    reason:
                      "Device session or attempt changed. Ask the exam officer to review this unsynced answer.",
                    attemptId: s.attempt!.id,
                  })),
                ]
              : s.rejected,
          };
        });
        this.update({ connected: true, authRequired: false });
        await this.flush();
      } catch (e) {
        this.fail(e);
      } finally {
        this.update({ busy: false });
      }
    });
  }
  enqueue(questionId: string, value: Value, flagged: boolean) {
    if (this.view.reviewing || this.view.fatal) return;
    this.update({ writing: this.view.writing + 1 });
    this.writes = this.writes.then(async () => {
      try {
        await this.persist((s) => {
          if (!s.attempt) throw new Error("No active exam.");
          const event = {
            attemptQuestionId: questionId,
            value,
            flagged,
            clientSequence: s.sequence + 1,
            idempotencyKey: crypto.randomUUID(),
            clientTimestamp: new Date().toISOString(),
          };
          return {
            ...s,
            sequence: event.clientSequence,
            pending: [...s.pending, event],
          };
        });
      } catch (e) {
        this.update({
          fatal: true,
          message: `This change could not be saved on your device. Keep this page open and ask the invigilator for help. ${message(e)}`,
        });
      } finally {
        this.update({ writing: this.view.writing - 1 });
      }
    });
    void this.exclusive(async () => {
      try {
        await this.writes;
        await this.flush();
      } catch (e) {
        this.fail(e);
      }
    });
  }
  private async flush() {
    if (
      this.view.authRequired ||
      this.view.fatal ||
      this.view.session?.attempt?.status === "PAUSED"
    )
      return;
    while (this.view.session?.pending.length && !this.stopped) {
      const s = this.view.session;
      const event = s.pending[0];
      let ack: Ack;
      try {
        ack = await this.api<Ack>(
          `/attempts/${s.attempt!.id}/answers`,
          s.attemptToken,
          event,
        );
      } catch (e) {
        if (e instanceof ExamApiError && [400, 404, 409].includes(e.status)) {
          await this.persist((current) => ({
            ...current,
            pending: current.pending.filter(
              (x) => x.idempotencyKey !== event.idempotencyKey,
            ),
            rejected: [
              ...current.rejected,
              { event, reason: e.message, attemptId: s.attempt!.id },
            ],
          }));
          continue;
        }
        throw e;
      }
      this.observe(ack.serverTime);
      await this.persist((current) => {
        const a = current.attempt!;
        const accepted = ack.disposition === "ACCEPTED";
        const answers = accepted
          ? [
              ...a.answers.filter(
                (x) => x.attemptQuestionId !== event.attemptQuestionId,
              ),
              {
                attemptQuestionId: event.attemptQuestionId,
                value: event.value,
                flagged: event.flagged,
                clientSequence: event.clientSequence,
                sessionRevision: a.sessionRevision,
              },
            ]
          : a.answers;
        return {
          ...current,
          pending: current.pending.filter(
            (x) => x.idempotencyKey !== event.idempotencyKey,
          ),
          rejected: accepted
            ? current.rejected
            : [
                ...current.rejected,
                { event, reason: ack.disposition, attemptId: a.id },
              ],
          attempt: {
            ...a,
            answers,
            answerRevision: Math.max(a.answerRevision, ack.answerRevision),
            status: ack.status,
          },
        };
      });
      this.update({ connected: true, message: "" });
    }
  }
  async signal(type: string) {
    const s = this.view.session;
    if (!s?.attemptToken || s.attempt?.status !== "IN_PROGRESS") return;
    try {
      await this.api(`/attempts/${s.attempt.id}/signals`, s.attemptToken, {
        type,
        idempotencyKey: crypto.randomUUID(),
      });
    } catch {
      /* Behaviour signals never block answer persistence. */
    }
  }
  async refresh() {
    return this.exclusive(async () => {
      if (
        !this.view.session?.attemptToken ||
        this.view.authRequired ||
        this.view.reviewing
      )
        return;
      try {
        await this.writes;
        const s = this.view.session!;
        const attempt = await this.api<Attempt>(
          `/attempts/${s.attempt!.id}`,
          s.attemptToken,
        );
        this.observe(attempt.serverTime);
        await this.persist((current) => ({ ...current, attempt }));
        if (attempt.status !== "PAUSED") await this.flush();
        this.update({
          connected: true,
          message:
            attempt.status === "PAUSED"
              ? "Your exam is paused. Keep this page open; it will resume when the officer permits."
              : "",
        });
      } catch (e) {
        this.fail(e);
      }
    });
  }
  async navigate(questionId: string) {
    const question = this.view.session?.attempt?.questions.find(
      (q) => q.id === questionId,
    );
    if (
      this.view.session?.attempt?.configuration.navigationMode === "FREE" &&
      question?.navigationMode === "FREE"
    ) {
      await this.writes;
      await this.persist((s) => ({ ...s, selectedQuestionId: questionId }));
      return;
    }
    return this.exclusive(async () => {
      this.update({ busy: true });
      try {
        await this.writes;
        await this.flush();
        if (this.view.session!.pending.length)
          throw new Error("Wait for answers to sync.");
        const s = this.view.session!;
        const attempt = await this.api<Attempt>(
          `/attempts/${s.attempt!.id}/navigate`,
          s.attemptToken,
          { attemptQuestionId: questionId },
        );
        this.observe(attempt.serverTime);
        await this.persist((current) => ({
          ...current,
          attempt,
          selectedQuestionId: questionId,
        }));
        this.update({ connected: true, message: "" });
      } catch (e) {
        this.fail(e);
      } finally {
        this.update({ busy: false });
      }
    });
  }
  async review() {
    this.update({ reviewing: true, busy: true });
    await this.exclusive(async () => {
      try {
        await this.writes;
        await this.flush();
        if (
          this.view.authRequired ||
          this.view.fatal ||
          this.view.session!.pending.length
        )
          throw new Error("Reconnect and sync every answer before submitting.");
        const s = this.view.session!;
        const attempt = await this.api<Attempt>(
          `/attempts/${s.attempt!.id}`,
          s.attemptToken,
        );
        this.observe(attempt.serverTime);
        await this.persist((current) => ({ ...current, attempt }));
        this.update({
          connected: true,
          message: "",
          reviewing: attempt.status === "IN_PROGRESS",
        });
      } catch (e) {
        this.fail(e);
        this.update({ reviewing: false });
      } finally {
        this.update({ busy: false });
      }
    });
  }
  cancelReview() {
    this.update({ reviewing: false });
  }
  async submit() {
    if (
      !this.view.reviewing ||
      this.view.busy ||
      this.view.session!.pending.length ||
      this.view.writing
    )
      return;
    await this.exclusive(async () => {
      this.update({ busy: true });
      try {
        const s = this.view.session!;
        const attempt = await this.api<Attempt>(
          `/attempts/${s.attempt!.id}/submit`,
          s.attemptToken,
          { expectedRevision: s.attempt!.answerRevision },
        );
        this.observe(attempt.serverTime);
        await this.persist((current) => ({ ...current, attempt }));
        this.update({ reviewing: false, connected: true, message: "" });
      } catch (e) {
        this.fail(e);
        this.update({ reviewing: false });
      } finally {
        this.update({ busy: false });
      }
    });
  }
}
