import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import { useBusinessType } from "../../hooks/use-business-type";
import { Modal } from "../../components/ui/modal";
import { Button } from "../../components/ui/button";
interface Exam {
  id: string;
  name: string;
}
interface Attempt {
  id: string;
  full_name: string;
  status: string;
  state?: string;
  attempt_number: number;
}
interface Question {
  id: string;
  position: number;
  marks: string;
  paper: {
    questionText: string;
    questionType: string;
    options?: { key: string; content: string }[];
  };
  grading_key: { answer: { rubric?: string }; correctOptionKeys?: string[] };
  value: unknown;
  score: string | null;
  method: string;
  comment: string;
}
interface Result {
  attemptId: string;
  examName: string;
  state: string;
  score: string;
  max_score: string;
  revision: number;
  student_released: boolean;
  parent_released: boolean;
  questions: Question[];
  grade: {
    period: string;
    assessment_component: string;
    score: string;
    max_score: string;
  } | null;
}
const errorText = (e: unknown) => {
  const err = e as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return err.response?.data?.message ?? err.message ?? "Request failed.";
};
export default function GradingPage() {
  const { isSchool } = useBusinessType();
  const [exam, setExam] = useState("");
  const [offset, setOffset] = useState(0);
  const [examOffset, setExamOffset] = useState(0);
  const [attempt, setAttempt] = useState("");
  const [confirmation, setConfirmation] = useState<{
    action: string;
    body: object;
    title: string;
  }>();
  const [result, setResult] = useState<Result>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const exams = useQuery({
    queryKey: ["cbt-grading-exams", examOffset],
    enabled: isSchool,
    queryFn: async () =>
      (
        await api.get<{ data: Exam[] }>("cbt/grading/exams", {
          params: { offset: examOffset },
        })
      ).data.data,
  });
  const attempts = useQuery({
    queryKey: ["cbt-grading-attempts", exam, offset],
    enabled: isSchool && !!exam,
    queryFn: async () =>
      (
        await api.get<{ data: Attempt[] }>(`cbt/grading/exams/${exam}`, {
          params: { offset },
        })
      ).data.data,
  });
  async function open(id: string) {
    setBusy(true);
    setError("");
    setResult(undefined);
    setAttempt(id);
    try {
      setResult(
        (await api.get<{ data: Result }>(`cbt/grading/attempts/${id}`)).data
          .data,
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function act(action: string, body: unknown) {
    if (!result) return;
    setBusy(true);
    setError("");
    try {
      setResult(
        (
          await api.post<{ data: Result }>(
            `cbt/grading/attempts/${attempt}/${action}`,
            { ...(body as object), expectedRevision: result.revision },
          )
        ).data.data,
      );
      void attempts.refetch();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  if (!isSchool) return <p>CBT grading is available to school tenants.</p>;
  return (
    <div className="space-y-6 max-w-5xl text-slate-900 dark:text-slate-100">
      <h1 className="text-2xl font-bold">CBT grading</h1>
      <p>Mark submitted papers, finalise scores and release assessments.</p>
      {(error || exams.error || attempts.error) && (
        <p role="alert" className="p-4 border border-red-300 rounded-xl">
          {error || errorText(exams.error || attempts.error)}{" "}
          {attempt && (
            <Button onClick={() => void open(attempt)}>Reload paper</Button>
          )}
        </p>
      )}
      <label className="block">
        Exam
        <select
          className="block p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg w-full"
          value={exam}
          disabled={busy}
          onChange={(e) => {
            setExam(e.target.value);
            setOffset(0);
            setResult(undefined);
            setAttempt("");
          }}
        >
          <option value="">Choose an exam</option>
          {exams.data?.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-3">
        <Button
          disabled={busy || examOffset === 0}
          onClick={() => setExamOffset((n) => Math.max(0, n - 50))}
        >
          Previous exams
        </Button>
        <Button
          disabled={busy || (exams.data?.length ?? 0) < 50}
          onClick={() => setExamOffset((n) => n + 50)}
        >
          More exams
        </Button>
      </div>
      {exams.isLoading && <p>Loading exams…</p>}
      {exam && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
          <h2 className="font-semibold">Submitted papers</h2>
          {attempts.data?.map((a) => (
            <div
              key={a.id}
              className="flex justify-between gap-3 border-b py-3"
            >
              <span>
                {a.full_name} · Attempt {a.attempt_number} ·{" "}
                {a.state ?? a.status}
              </span>
              <Button
                disabled={busy || a.status === "IN_PROGRESS"}
                onClick={() => void open(a.id)}
              >
                Open paper
              </Button>
            </div>
          ))}
          {!attempts.isLoading && !attempts.data?.length && (
            <p>No attempts on this page.</p>
          )}
          <div className="flex gap-3">
            <Button
              disabled={busy || offset === 0}
              onClick={() => setOffset((n) => Math.max(0, n - 50))}
            >
              Previous papers
            </Button>
            <Button
              disabled={busy || (attempts.data?.length ?? 0) < 50}
              onClick={() => setOffset((n) => n + 50)}
            >
              More papers
            </Button>
          </div>
        </section>
      )}
      {result && (
        <section className="space-y-5">
          <h2 className="text-xl font-bold">
            {result.examName}: {result.score} / {result.max_score}
          </h2>
          <p>
            {result.state} · Students:{" "}
            {result.student_released ? "released" : "hidden"} · Parents:{" "}
            {result.parent_released ? "released" : "hidden"}
          </p>
          {result.questions.map((q) => (
            <MarkQuestion
              key={`${attempt}:${result.revision}:${q.id}`}
              q={q}
              finalised={result.state === "FINALISED"}
              busy={busy}
              onSave={(body, override) =>
                void act(override ? "override" : "mark", body)
              }
            />
          ))}
          {result.state === "GRADED" && (
            <Button
              disabled={busy}
              onClick={() =>
                setConfirmation({
                  action: "finalise",
                  body: {},
                  title: "Finalise this result?",
                })
              }
            >
              Finalise result
            </Button>
          )}
          {result.state === "FINALISED" && (
            <ReleaseForm
              key={`${attempt}:${result.revision}`}
              result={result}
              busy={busy}
              onRelease={(body) =>
                setConfirmation({
                  action: "release",
                  body,
                  title: "Apply these release settings?",
                })
              }
            />
          )}
          {result.grade && (
            <p>
              Classfun assessment: {result.grade.period} · {result.grade.score}{" "}
              / {result.grade.max_score}
            </p>
          )}
        </section>
      )}
      <Modal
        open={!!confirmation}
        onClose={() => setConfirmation(undefined)}
        title={confirmation?.title ?? "Confirm"}
      >
        <p className="mb-4">
          {confirmation?.action === "finalise"
            ? "Every question has been marked. Confirm the total before finalising."
            : "This updates student visibility and the mapped Classfun assessment. Parent publication also queues a notification."}
        </p>
        <p className="mb-4">
          Score: {result?.score} / {result?.max_score}
        </p>
        <Button
          onClick={() => {
            if (confirmation) {
              void act(confirmation.action, confirmation.body);
              setConfirmation(undefined);
            }
          }}
        >
          Confirm
        </Button>
        <Button variant="ghost" onClick={() => setConfirmation(undefined)}>
          Cancel
        </Button>
      </Modal>
    </div>
  );
}
function MarkQuestion({
  q,
  finalised,
  busy,
  onSave,
}: {
  q: Question;
  finalised: boolean;
  busy: boolean;
  onSave: (body: object, override: boolean) => void;
}) {
  const [score, setScore] = useState(q.score ?? "");
  const [comment, setComment] = useState(q.comment);
  const [reason, setReason] = useState("");
  const override = finalised || q.method !== "MANUAL";
  return (
    <form
      className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl p-5 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(
          { questionId: q.id, score: Number(score), comment, reason },
          override,
        );
      }}
    >
      <h3 className="font-semibold">
        Question {q.position + 1} · {q.marks} marks · {q.method}
      </h3>
      <p className="whitespace-pre-wrap">{q.paper.questionText}</p>
      <ul>
        {q.paper.options?.map((o) => (
          <li key={o.key}>
            {o.key}: {o.content}
            {q.grading_key.correctOptionKeys?.includes(o.key)
              ? " (correct)"
              : ""}
          </li>
        ))}
      </ul>
      <p className="whitespace-pre-wrap break-words">
        Answer:{" "}
        {q.value == null
          ? "Unanswered"
          : typeof q.value === "string"
            ? q.value
            : JSON.stringify(q.value)}
      </p>
      {q.grading_key.answer.rubric && (
        <p className="whitespace-pre-wrap">
          Rubric: {q.grading_key.answer.rubric}
        </p>
      )}
      <label className="block">
        Score
        <input
          aria-label={`Score for question ${q.position + 1}`}
          required
          type="number"
          min="0"
          max={q.marks}
          step="0.01"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className="block border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 rounded"
        />
      </label>
      <label className="block">
        Teacher comment
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={5000}
          className="block border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 rounded w-full"
        />
      </label>
      <label className="block">
        Reason for this mark or correction
        <input
          required
          maxLength={2000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="block border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 rounded w-full"
        />
      </label>
      <Button disabled={busy}>
        {override ? "Apply authorised override" : "Save mark"}
      </Button>
      {override && (
        <p className="text-sm">
          Requires result-release permission. A correction hides any released
          result until it is finalised again.
        </p>
      )}
    </form>
  );
}
function ReleaseForm({
  result,
  busy,
  onRelease,
}: {
  result: Result;
  busy: boolean;
  onRelease: (body: object) => void;
}) {
  const [students, setStudents] = useState(result.student_released);
  const [parents, setParents] = useState(result.parent_released);
  const [map, setMap] = useState(!!result.grade);
  const [period, setPeriod] = useState(
    result.grade?.assessment_component
      ? result.grade.period.slice(
          0,
          -(result.grade.assessment_component.length + 3),
        )
      : "",
  );
  const [component, setComponent] = useState(
    result.grade?.assessment_component ?? "Final exam",
  );
  const [max, setMax] = useState(result.grade?.max_score ?? "70");
  return (
    <form
      className="p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onRelease({
          students,
          parents,
          mapping: map
            ? { period, component, maxScore: Number(max) }
            : undefined,
        });
      }}
    >
      <h3 className="font-semibold">Release settings</h3>
      <label className="block">
        <input
          type="checkbox"
          checked={students}
          onChange={(e) => setStudents(e.target.checked)}
        />{" "}
        Show score to student
      </label>
      <label className="block">
        <input
          type="checkbox"
          checked={map}
          onChange={(e) => {
            setMap(e.target.checked);
            if (!e.target.checked) setParents(false);
          }}
        />{" "}
        Map to Classfun grades
      </label>
      {map && (
        <>
          <label className="block">
            Academic period
            <input
              required
              maxLength={35}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="block p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded"
            />
          </label>
          <label className="block">
            Assessment component
            <input
              required
              maxLength={60}
              value={component}
              onChange={(e) => setComponent(e.target.value)}
              className="block p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded"
            />
          </label>
          <label className="block">
            Component maximum score
            <input
              required
              type="number"
              min="0.01"
              max="999"
              step="0.01"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              className="block p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded"
            />
          </label>
          <p>
            For example, an 80% exam result contributes 56 out of a 70-mark
            final-exam component.
          </p>
          <label className="block">
            <input
              type="checkbox"
              checked={parents}
              onChange={(e) => setParents(e.target.checked)}
            />{" "}
            Publish assessment to parents and notify them
          </label>
        </>
      )}
      <Button disabled={busy}>Apply release settings</Button>
    </form>
  );
}
