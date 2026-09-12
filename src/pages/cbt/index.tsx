import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useParams } from "react-router-dom";
import { ExamController } from "../../lib/cbt/controller";
import { answered, effectiveAnswers } from "../../lib/cbt/types";
import { Button } from "../../components/ui/button";
import { QuestionInput } from "./question-input";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
export default function StudentExamPage() {
  const { tenantId = "", examId = "" } = useParams();
  const [controller] = useState(() => new ExamController());
  const view = useSyncExternalStore(controller.subscribe, controller.snapshot);
  const [lock, setLock] = useState<"loading" | "owned" | "blocked">("loading");
  const [ready, setReady] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tick, setTick] = useState(0);
  const [font, setFont] = useState(18);
  const confirming = useRef<HTMLDialogElement>(null);
  const pointer = `cbt-session:${tenantId}:${examId}`;
  const validLink = uuid.test(tenantId) && uuid.test(examId);
  useEffect(() => {
    const previous = document.title;
    document.title = "Classfun — Student examination";
    return () => {
      document.title = previous;
    };
  }, []);
  useEffect(() => {
    let release: (() => void) | undefined;
    let cancelled = false;
    if (!navigator.locks) {
      queueMicrotask(() => setLock("blocked"));
      return;
    }
    void navigator.locks
      .request(
        "classfun-student-exam",
        { ifAvailable: true },
        async (owned) => {
          if (cancelled) return;
          if (!owned) {
            setLock("blocked");
            return;
          }
          setLock("owned");
          const held = new Promise<void>((resolve) => {
            release = resolve;
          });
          try {
            const key = localStorage.getItem(pointer);
            if (key) void controller.restore(key);
          } catch {
            setLoginError(
              "Device storage is unavailable. Enable storage before starting an exam.",
            );
          }
          if (!cancelled) await held;
        },
      )
      .catch(() => setLock("blocked"));
    return () => {
      cancelled = true;
      release?.();
    };
  }, [controller, pointer]);
  useEffect(() => {
    if (lock !== "owned") return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    const poll = setInterval(() => {
      void controller.refresh();
    }, 10000);
    let lastSignal = 0;
    const report = (type: string) => {
      if (performance.now() - lastSignal < 5000) return;
      lastSignal = performance.now();
      void controller.signal(type);
    };
    const blur = () => report("WINDOW_BLUR");
    const copy = () => report("COPY");
    const paste = () => report("PASTE");
    const fullscreen = () => {
      if (!document.fullscreenElement) report("FULLSCREEN_EXIT");
    };
    addEventListener("blur", blur);
    document.addEventListener("copy", copy);
    document.addEventListener("paste", paste);
    document.addEventListener("fullscreenchange", fullscreen);
    const reconnect = () => {
      void controller.refresh();
    };
    const visibility = () => {
      if (document.hidden) {
        controller.suspendClock();
        report("TAB_HIDDEN");
      } else void controller.refresh();
    };
    const leave = (e: BeforeUnloadEvent) => {
      if (
        ["IN_PROGRESS", "PAUSED"].includes(
          controller.snapshot().session?.attempt?.status ?? "",
        )
      ) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    addEventListener("online", reconnect);
    document.addEventListener("visibilitychange", visibility);
    addEventListener("beforeunload", leave);
    return () => {
      removeEventListener("blur", blur);
      document.removeEventListener("copy", copy);
      document.removeEventListener("paste", paste);
      document.removeEventListener("fullscreenchange", fullscreen);
      clearInterval(timer);
      clearInterval(poll);
      removeEventListener("online", reconnect);
      document.removeEventListener("visibilitychange", visibility);
      removeEventListener("beforeunload", leave);
    };
  }, [controller, lock]);
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker
      .register("/cbt-sw.js", { scope: "/cbt/" })
      .then(() => navigator.serviceWorker.ready)
      .then(() => setReady(true))
      .catch(() => setReady(false));
  }, []);
  useEffect(() => {
    try {
      if (view.session) localStorage.setItem(pointer, view.session.key);
    } catch {
      queueMicrotask(() =>
        setLoginError(
          "Your browser could not remember this session. Keep this tab open.",
        ),
      );
    }
  }, [view.session, pointer]);
  useEffect(() => {
    if (
      view.reviewing &&
      !view.busy &&
      view.session?.attempt?.status === "IN_PROGRESS"
    )
      confirming.current?.showModal();
    else confirming.current?.close();
  }, [view.reviewing, view.busy, view.session?.attempt?.status]);
  const s = view.session;
  const attempt = s?.attempt;
  const now = controller.serverTime();
  void tick;
  const remaining =
    now !== null && attempt
      ? Math.max(
          0,
          Math.ceil(
            (Date.parse(attempt.expiresAt) -
              (attempt.pausedAt ? Date.parse(attempt.pausedAt) : now)) /
              1000,
          ),
        )
      : null;
  const active = (from: string, until: string) =>
    now !== null && Date.parse(from) <= now && now < Date.parse(until);
  const q =
    attempt?.questions.find(
      (q) =>
        q.id === s?.selectedQuestionId && active(q.availableFrom, q.expiresAt),
    ) ??
    attempt?.questions.find(
      (q) =>
        q.position === attempt.currentPosition &&
        active(q.availableFrom, q.expiresAt),
    ) ??
    attempt?.questions.find((q) => active(q.availableFrom, q.expiresAt)) ??
    attempt?.questions[0];
  const answers = s ? effectiveAnswers(s) : new Map();
  const answerCount = [...answers.values()].filter((a) =>
    answered(a.value),
  ).length;
  const flags = [...answers.values()].filter((a) => a.flagged).length;
  const disabled =
    view.fatal ||
    view.authRequired ||
    view.reviewing ||
    view.busy ||
    remaining === null ||
    remaining <= 0 ||
    attempt?.status !== "IN_PROGRESS" ||
    !q ||
    !active(q.availableFrom, q.expiresAt);
  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      let deviceId = localStorage.getItem("cbt-device-id");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("cbt-device-id", deviceId);
      }
      await controller.login(
        {
          tenantId,
          examId,
          studentId: s?.identity.studentId ?? studentId,
          deviceId,
        },
        pin,
      );
      setPin("");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login failed.");
    }
  };
  const exportRecovery = () => {
    const link = document.createElement("a");
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              examId,
              studentId: s?.identity.studentId,
              attemptId: attempt?.id,
              pending: s?.pending,
              rejected: s?.rejected,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    link.href = url;
    link.download = "exam-answer-recovery.json";
    link.click();
    URL.revokeObjectURL(url);
  };
  const go = (id: string) => {
    void controller
      .navigate(id)
      .catch(() =>
        setLoginError(
          "Could not save your position. Keep this tab open and ask for help.",
        ),
      );
  };
  return (
    <main
      className="min-h-screen bg-slate-50 text-slate-900 pb-10"
      style={{ fontSize: font }}
    >
      <header className="border-b border-slate-200 bg-white px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <span className="font-bold text-indigo-700">Classfun</span>
          <span className="text-sm text-slate-500 ml-3">
            Student examination
          </span>
        </div>
        <div className="flex items-center gap-3">
          {view.session && (
            <Button
              variant="ghost"
              disabled={view.busy || view.writing > 0 || view.fatal}
              onClick={() => {
                if (
                  view.session?.attempt?.status === "IN_PROGRESS" &&
                  !window.confirm(
                    "Leave this exam? The timer keeps running. Saved changes remain on this device until you sign in again.",
                  )
                )
                  return;
                void controller.leave().then(() => {
                  localStorage.removeItem(pointer);
                  setStudentId("");
                  setPin("");
                });
              }}
            >
              Sign out
            </Button>
          )}
          <label className="text-sm">
            Text size{" "}
            <select
              className="ml-2 border rounded p-1"
              value={font}
              onChange={(e) => setFont(Number(e.target.value))}
            >
              <option value={16}>Standard</option>
              <option value={18}>Large</option>
              <option value={22}>Larger</option>
            </select>
          </label>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {!validLink ? (
          <p role="alert">
            This exam link is invalid. Ask your school for the full exam link.
          </p>
        ) : lock !== "owned" ? (
          <p role="status">
            {lock === "loading"
              ? "Preparing your exam…"
              : "Close other exam tabs, then reload this page. This browser must support Web Locks to run an exam safely."}
          </p>
        ) : (
          <>
            {(view.message || loginError) && (
              <div
                role="alert"
                className="rounded-xl border border-amber-300 bg-amber-50 p-4"
              >
                {loginError || view.message}
                {attempt && (
                  <Button
                    className="ml-3"
                    variant="secondary"
                    onClick={() => void controller.refresh()}
                  >
                    Retry connection
                  </Button>
                )}
              </div>
            )}
            {(!s || view.authRequired || (!s.attempt && !s.info)) && (
              <form
                onSubmit={doLogin}
                className="max-w-md mx-auto bg-white border border-slate-200 p-7 rounded-2xl space-y-5"
              >
                <h1 className="text-2xl font-bold">
                  {s ? "Sign in to resume" : "Welcome to your exam"}
                </h1>
                <p className="text-slate-600 text-base">
                  Use the student ID and PIN your school gave you.
                </p>
                <label className="block">
                  Student ID
                  <input
                    required
                    inputMode="numeric"
                    pattern="[0-9]{8}"
                    maxLength={8}
                    value={s?.identity.studentId ?? studentId}
                    disabled={!!s}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="mt-2 w-full border rounded-xl p-3"
                    autoComplete="username"
                  />
                </label>
                <label className="block">
                  PIN
                  <input
                    required
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]{8}"
                    maxLength={8}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="mt-2 w-full border rounded-xl p-3"
                    autoComplete="off"
                  />
                </label>
                <Button
                  size="lg"
                  disabled={view.busy || view.fatal}
                  type="submit"
                >
                  {view.busy ? "Connecting…" : "Sign in"}
                </Button>
              </form>
            )}
            {s?.info && !attempt && !view.authRequired && (
              <section className="max-w-2xl mx-auto bg-white border rounded-2xl p-7 space-y-5">
                <p className="text-indigo-700 font-semibold">
                  Before you begin
                </p>
                <h1 className="text-3xl font-bold">{s.info.name}</h1>
                <p>
                  {s.info.durationMinutes} minutes · {s.info.totalMarks} marks
                </p>
                <p className="whitespace-pre-wrap">
                  {s.info.instructions ||
                    "Read each question carefully and answer all required questions."}
                </p>
                <p className="text-base text-slate-600">
                  Changes save on this device and sync to your school. Keep this
                  exam in one tab. The timer starts when you begin.
                </p>
                <p className="text-sm text-slate-500">
                  {ready
                    ? "Exam page saved for offline reloads."
                    : "Offline page preparation is not confirmed. Keep this page open during interruptions."}
                </p>
                <Button
                  size="lg"
                  disabled={view.busy || view.fatal}
                  onClick={() => void controller.start()}
                >
                  {view.busy ? "Preparing your paper…" : "Begin exam"}
                </Button>
              </section>
            )}
            {attempt && (
              <>
                <section className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap gap-5 justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold">
                      {attempt.configuration.name}
                    </h1>
                    <p className="text-base text-slate-500">
                      {answerCount} of {attempt.navigator.length} answered ·{" "}
                      {flags} flagged
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Time remaining</p>
                    <p
                      className={`text-3xl font-mono font-bold ${remaining !== null && remaining < 300 ? "text-red-700" : ""}`}
                    >
                      {attempt.status === "PAUSED"
                        ? "Paused"
                        : attempt.status !== "IN_PROGRESS"
                          ? "Finished"
                          : remaining === null
                            ? "Checking…"
                            : clock(remaining)}
                    </p>
                  </div>
                </section>
                <p role="status" className="text-sm text-slate-600">
                  {view.writing
                    ? "Saving changes on this device…"
                    : s.pending.length
                      ? `${s.pending.length} changes saved on this device, waiting to sync.`
                      : view.connected
                        ? "All changes synced to your school."
                        : "Saved answers are available on this device."}{" "}
                  {remaining === null &&
                    attempt.status === "IN_PROGRESS" &&
                    "Reconnect to verify the exam time before continuing."}{" "}
                  {remaining === 0 &&
                    attempt.status === "IN_PROGRESS" &&
                    "Time reached. Waiting for the server to confirm submission."}
                </p>
                {!!s.rejected.length && (
                  <div
                    role="alert"
                    className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-base"
                  >
                    {s.rejected.length} changes were not accepted or belong to a
                    replaced session. They are retained for your exam officer to
                    review.{" "}
                    <Button variant="secondary" onClick={exportRecovery}>
                      Download recovery record
                    </Button>
                  </div>
                )}
                {!["IN_PROGRESS", "PAUSED"].includes(attempt.status) ? (
                  <section className="bg-white border rounded-2xl p-8 space-y-4">
                    <h2 className="text-2xl font-bold">
                      {attempt.status === "INVALIDATED"
                        ? "This attempt has been invalidated"
                        : attempt.status === "AUTO_SUBMITTED"
                          ? "Your exam time has ended"
                          : "Your exam has been submitted"}
                    </h2>
                    <p>
                      {attempt.status === "INVALIDATED"
                        ? "Contact your exam officer. This attempt is excluded from results."
                        : "Your school has received your saved answers."}
                    </p>
                    {attempt.result ? (
                      <div>
                        <h3 className="text-xl font-semibold">Your result</h3>
                        <p>
                          {attempt.result.score} / {attempt.result.maxScore} ·{" "}
                          {attempt.result.percentage}% ·{" "}
                          {attempt.result.passed ? "Passed" : "Below pass mark"}
                        </p>
                      </div>
                    ) : (
                      <p>
                        Results will be available after marking and release.
                      </p>
                    )}
                    <p className="text-sm text-slate-500">
                      Attempt reference: {attempt.id}
                    </p>
                    {!!s.pending.length && (
                      <p>
                        Keep this page open to send remaining recovery events.
                        Late changes may not be accepted.
                      </p>
                    )}
                  </section>
                ) : (
                  <div className="grid lg:grid-cols-[1fr_260px] gap-5">
                    <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 space-y-6">
                      {q ? (
                        <>
                          <div className="flex justify-between text-sm text-slate-500">
                            <span>
                              {q.sectionName} · Question {q.position + 1}
                            </span>
                            <span>
                              {q.marks} {q.marks === 1 ? "mark" : "marks"}
                            </span>
                          </div>
                          <h2 className="text-xl font-semibold whitespace-pre-wrap break-words">
                            {q.questionText}
                          </h2>
                          <QuestionInput
                            key={`${attempt.id}:${attempt.sessionRevision}:${q.id}`}
                            question={q}
                            initial={answers.get(q.id)?.value ?? null}
                            flagged={answers.get(q.id)?.flagged ?? false}
                            disabled={disabled}
                            onChange={(value, flag) =>
                              controller.enqueue(q.id, value, flag)
                            }
                          />
                          <div className="flex justify-between pt-4 border-t">
                            <Button
                              variant="secondary"
                              disabled={
                                view.writing > 0 ||
                                view.busy ||
                                view.reviewing ||
                                q.position === 0 ||
                                attempt.configuration.navigationMode ===
                                  "SEQUENTIAL" ||
                                q.navigationMode === "SEQUENTIAL"
                              }
                              onClick={() =>
                                go(attempt.navigator[q.position - 1].id)
                              }
                            >
                              Previous
                            </Button>
                            <Button
                              disabled={
                                view.writing > 0 ||
                                view.busy ||
                                view.reviewing ||
                                q.position >= attempt.navigator.length - 1 ||
                                !active(
                                  attempt.navigator[q.position + 1]
                                    .availableFrom,
                                  attempt.navigator[q.position + 1].expiresAt,
                                )
                              }
                              onClick={() =>
                                go(attempt.navigator[q.position + 1].id)
                              }
                            >
                              Next
                            </Button>
                          </div>
                        </>
                      ) : (
                        <p>
                          Waiting for the next section. Reconnect to retrieve
                          its questions.
                        </p>
                      )}
                    </section>
                    <aside className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 self-start">
                      <h2 className="font-semibold">Your questions</h2>
                      <div className="grid grid-cols-5 gap-2">
                        {attempt.navigator.map((n) => {
                          const a = answers.get(n.id);
                          return (
                            <button
                              key={n.id}
                              aria-label={`Question ${n.position + 1}, ${answered(a?.value) ? "answered" : "unanswered"}${a?.flagged ? ", flagged" : ""}`}
                              aria-current={q?.id === n.id ? "step" : undefined}
                              disabled={
                                view.writing > 0 ||
                                view.busy ||
                                view.reviewing ||
                                !active(n.availableFrom, n.expiresAt)
                              }
                              onClick={() => go(n.id)}
                              className={`relative p-2 rounded-lg border text-sm ${q?.id === n.id ? "ring-2 ring-indigo-600" : ""} ${answered(a?.value) ? "bg-indigo-100 border-indigo-200" : "bg-white border-slate-300"} disabled:opacity-40`}
                            >
                              {n.position + 1}
                              {a?.flagged && (
                                <span
                                  aria-hidden="true"
                                  className="absolute -top-1 right-0 text-amber-700"
                                >
                                  ⚑
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-500">
                        Purple: answered · Flag: review
                      </p>
                      <Button
                        className="w-full"
                        disabled={
                          view.busy ||
                          view.writing > 0 ||
                          view.reviewing ||
                          view.fatal ||
                          view.authRequired ||
                          attempt.status !== "IN_PROGRESS"
                        }
                        onClick={() => void controller.review()}
                      >
                        Review and submit
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={exportRecovery}
                      >
                        Save recovery copy
                      </Button>
                    </aside>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      <dialog
        ref={confirming}
        onCancel={() => controller.cancelReview()}
        className="m-auto rounded-2xl p-7 max-w-md w-[calc(100%-2rem)] backdrop:bg-slate-950/50 space-y-5"
      >
        <h2 className="text-2xl font-bold">Submit your exam?</h2>
        <p>
          Answered: {answerCount}
          <br />
          Unanswered: {(attempt?.navigator.length ?? 0) - answerCount}
          <br />
          Flagged: {flags}
        </p>
        <p>You cannot change your answers after submission.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => controller.cancelReview()}>
            Keep working
          </Button>
          <Button onClick={() => void controller.submit()}>
            Confirm submission
          </Button>
        </div>
      </dialog>
    </main>
  );
}
