import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import { useBusinessType } from "../../hooks/use-business-type";
import { useAuth } from "../../hooks/use-auth";
import { useCenters } from "../../hooks/queries/use-centers";
import { useActivities } from "../../hooks/queries/use-activities";
import { useChildren } from "../../hooks/queries/use-children";
import { Button } from "../../components/ui/button";
import { QuestionEditor } from "./question-editor";
import type { QuestionVersion } from "./question-editor";
import { ExamSettings } from "./exam-settings";
import type { ExamConfiguration } from "./exam-settings";
import { drainPages, type Page } from "../../lib/cbt/paging";
import {
  buttonRowClass,
  cardClass,
  inputClass,
  labelClass,
  mutedClass,
  panelClass,
  summaryClass,
} from "./styles";

type Named = { id: string; name: string };
type Calendar = { sessions: Named[]; terms: (Named & { sessionId: string })[] };
type Section = {
  name: string;
  durationMinutes: number | null;
  navigationMode: string;
  questions: { versionId: string; marks: number }[];
  pools: {
    bankId: string;
    questionCount: number;
    marksPerQuestion: number;
    topic?: string;
    difficulty?: string;
  }[];
};
type Exam = Named &
  ExamConfiguration & {
    status: string;
    sessionId: string;
    termId: string;
    instructions: string;
    durationMinutes: number;
    passMark: number;
    startDatetime: string;
    endDatetime: string;
    sections: Section[];
  };
const allPages = <T,>(path: string, params: Record<string, unknown>) =>
  drainPages<T>((offset, limit) =>
    get<Page<T>>(path, { ...params, offset, limit }),
  );
const get = async <T,>(path: string, params?: Record<string, unknown>) =>
  (await api.get<{ data: T }>(path, { params })).data.data;
const errorMessage = (e: unknown) =>
  (e as { response?: { data?: { message?: string } } }).response?.data
    ?.message ?? (e as Error).message;
const transitions: Record<string, string[]> = {
  DRAFT: ["UNDER_REVIEW", "ARCHIVED"],
  UNDER_REVIEW: ["APPROVED", "CHANGES_REQUESTED"],
  CHANGES_REQUESTED: ["UNDER_REVIEW", "ARCHIVED"],
  APPROVED: ["SCHEDULED", "ARCHIVED"],
  SCHEDULED: ["ARCHIVED"],
};

export default function AuthoringPage() {
  const { isSchool } = useBusinessType();
  return isSchool ? (
    <AuthoringWorkspace />
  ) : (
    <p>CBT authoring is available to school tenants.</p>
  );
}

function AuthoringWorkspace() {
  const { user } = useAuth();
  const centers = useCenters();
  const [centerId, setCenterId] = useState("");
  const activities = useActivities(centerId);
  const children = useChildren("active");
  const [activityId, setActivityId] = useState("");
  const [classLevelId, setClassLevelId] = useState("");
  const [bankId, setBankId] = useState("");
  const [bankName, setBankName] = useState("");
  const [examId, setExamId] = useState("");
  const [question, setQuestion] = useState<QuestionVersion | null>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reason, setReason] = useState("");
  const [calendarForm, setCalendarForm] = useState({
    name: "",
    startsOn: "",
    endsOn: "",
    sessionId: "",
  });
  const [examForm, setExamForm] = useState({
    name: "",
    sessionId: "",
    termId: "",
    instructions: "",
    durationMinutes: "60",
    passMark: "50",
    startDatetime: "",
    endDatetime: "",
  });
  const [sections, setSections] = useState<Section[]>([
    {
      name: "Section A",
      durationMinutes: null,
      navigationMode: "FREE",
      questions: [],
      pools: [],
    },
  ]);
  const [childId, setChildId] = useState("");
  const [resetDevice, setResetDevice] = useState(false);
  const [credentials, setCredentials] = useState<{
    studentId: string;
    pin: string;
    childId: string;
  }>();
  const scope = { centerId, activityId, classLevelId };
  const enabled = !!centerId && !!activityId && !!classLevelId;
  const calendar = useQuery({
    queryKey: ["cbt-calendar"],
    queryFn: () => get<Calendar>("/cbt/calendar"),
  });
  const banks = useQuery({
    queryKey: ["cbt-banks", scope],
    enabled,
    queryFn: () => allPages<Named>("/cbt/question-banks", scope),
  });
  const exams = useQuery({
    queryKey: ["cbt-author-exams", scope],
    enabled,
    queryFn: () => allPages<Exam>("/cbt/exams", scope),
  });
  const versions = useQuery({
    queryKey: ["cbt-bank-versions", bankId],
    enabled: !!bankId,
    queryFn: async () => {
      const result: QuestionVersion[] = [];
      let offset = 0;
      while (true) {
        const page = await get<{ data: { id: string }[]; total: number }>(
          `/cbt/question-banks/${bankId}/questions`,
          { offset },
        );
        for (const q of page.data) {
          const detail = await get<{ versions: QuestionVersion[] }>(
            `/cbt/questions/${q.id}`,
          );
          result.push(...detail.versions);
        }
        offset += page.data.length;
        if (!page.data.length || offset >= page.total) break;
      }
      return result;
    },
  });
  const exam = useQuery({
    queryKey: ["cbt-author-exam", examId],
    enabled: !!examId,
    queryFn: () => get<Exam>(`/cbt/exams/${examId}`),
  });
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function changeStatus(
    kind: "exam" | "question",
    id: string,
    status: string,
  ) {
    await api.post(
      `/cbt/${kind === "exam" ? "exams" : "question-versions"}/${id}/status`,
      { status, reason },
    );
    await Promise.all([
      bankId ? versions.refetch() : Promise.resolve(),
      examId ? exam.refetch() : Promise.resolve(),
      exams.refetch(),
    ]);
    setReason("");
  }
  const resetScope = () => {
    setBankId("");
    setExamId("");
    setQuestion(undefined);
    setCredentials(undefined);
    setChildId("");
    setResetDevice(false);
  };
  const editable =
    !examId || ["DRAFT", "CHANGES_REQUESTED"].includes(exam.data?.status ?? "");
  return (
    <div className="space-y-6 max-w-5xl min-w-0 text-slate-900 dark:text-slate-100">
      <h1 className="text-2xl font-bold">CBT authoring</h1>
      {(error ||
        calendar.error ||
        banks.error ||
        exams.error ||
        versions.error ||
        exam.error) && (
        <p role="alert" className="text-red-700 dark:text-red-400">
          {error ||
            errorMessage(
              calendar.error ||
                banks.error ||
                exams.error ||
                versions.error ||
                exam.error,
            )}
        </p>
      )}
      {notice && (
        <p role="status" className="text-emerald-700 dark:text-emerald-400">
          {notice}
        </p>
      )}
      <section className={panelClass}>
        <h2 className="font-semibold">Class and subject</h2>
        <label className={labelClass}>
          Campus
          <select
            className={inputClass}
            value={centerId}
            onChange={(e) => {
              setCenterId(e.target.value);
              setActivityId("");
              setClassLevelId("");
              resetScope();
            }}
          >
            <option value="">Choose campus</option>
            {centers.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Class
          <select
            className={inputClass}
            value={activityId}
            onChange={(e) => {
              setActivityId(e.target.value);
              setClassLevelId("");
              resetScope();
            }}
          >
            <option value="">Choose class</option>
            {activities.data
              ?.filter((a) => a.centerId === centerId)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
          </select>
        </label>
        <label className={labelClass}>
          Subject
          <select
            className={inputClass}
            value={classLevelId}
            onChange={(e) => {
              setClassLevelId(e.target.value);
              resetScope();
            }}
          >
            <option value="">Choose subject</option>
            {activities.data
              ?.find((a) => a.id === activityId)
              ?.classLevels?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </label>
      </section>
      {user?.roles?.some(
        (r) => r === "business_owner" || r === "super_admin",
      ) && (
        <details className={panelClass}>
          <summary className={summaryClass}>Academic calendar</summary>
          <p>
            Create a session first, then its terms. Dates use the school
            calendar; exam windows must fall within the term.
          </p>
          <label className={labelClass}>
            Session for a new term
            <select
              className={inputClass}
              value={calendarForm.sessionId}
              onChange={(e) =>
                setCalendarForm({ ...calendarForm, sessionId: e.target.value })
              }
            >
              <option value="">Create a new session</option>
              {calendar.data?.sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          {(["name", "startsOn", "endsOn"] as const).map((key) => (
            <label className={labelClass} key={key}>
              {key === "name"
                ? "Name"
                : key === "startsOn"
                  ? "Start date"
                  : "End date"}
              <input
                className={inputClass}
                type={key === "name" ? "text" : "date"}
                value={calendarForm[key]}
                onChange={(e) =>
                  setCalendarForm({ ...calendarForm, [key]: e.target.value })
                }
              />
            </label>
          ))}
          <Button
            disabled={
              busy ||
              !calendarForm.name ||
              !calendarForm.startsOn ||
              !calendarForm.endsOn
            }
            onClick={() =>
              void run(async () => {
                const { sessionId, ...dates } = calendarForm;
                await api.post(
                  `/cbt/academic-${sessionId ? "terms" : "sessions"}`,
                  sessionId ? { ...dates, sessionId } : dates,
                );
                await calendar.refetch();
                setNotice("Calendar saved.");
              })
            }
          >
            Save calendar period
          </Button>
        </details>
      )}
      {enabled && (
        <>
          <section className={panelClass}>
            <h2 className="font-semibold">Question banks</h2>
            <label className={labelClass}>
              Bank
              <select
                className={inputClass}
                value={bankId}
                onChange={(e) => {
                  setBankId(e.target.value);
                  setQuestion(undefined);
                }}
              >
                <option value="">Choose bank</option>
                {banks.data?.data.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              New bank name
              <input
                className={inputClass}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </label>
            <Button
              disabled={busy || !bankName.trim()}
              onClick={() =>
                void run(async () => {
                  const b = (
                    await api.post("/cbt/question-banks", {
                      ...scope,
                      name: bankName,
                    })
                  ).data.data;
                  await banks.refetch();
                  setBankId(b.id);
                  setBankName("");
                })
              }
            >
              Create bank
            </Button>
            {bankId && (
              <>
                <Button onClick={() => setQuestion(null)}>New question</Button>
                <label className={labelClass}>
                  Review reason
                  <input
                    className={inputClass}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                {versions.data?.map((v) => (
                  <article key={v.id} className={cardClass}>
                    <p className="whitespace-pre-wrap break-words">
                      {v.questionText}
                    </p>
                    <p className={mutedClass}>
                      Version {v.version} · {v.status} · {v.defaultMarks} marks
                    </p>
                    <div className={buttonRowClass}>
                      <Button
                        variant="secondary"
                        onClick={() => setQuestion(v)}
                      >
                        Revise as new version
                      </Button>
                      {(transitions[v.status] ?? [])
                        .filter((s) => s !== "SCHEDULED")
                        .map((status) => (
                          <Button
                            key={status}
                            disabled={busy || !reason.trim()}
                            onClick={() =>
                              void run(() =>
                                changeStatus("question", v.id, status),
                              )
                            }
                          >
                            {status.replaceAll("_", " ")}
                          </Button>
                        ))}
                    </div>
                  </article>
                ))}
                {question !== undefined && (
                  <QuestionEditor
                    key={question?.id ?? "new"}
                    initial={question}
                    busy={busy}
                    onCancel={() => setQuestion(undefined)}
                    onSave={(content) =>
                      run(async () => {
                        await api.post(
                          question
                            ? `/cbt/questions/${question.questionId}/versions`
                            : "/cbt/questions",
                          question ? content : { bankId, content },
                        );
                        setQuestion(undefined);
                        await versions.refetch();
                      })
                    }
                  />
                )}
              </>
            )}
          </section>
          <section className={panelClass}>
            <h2 className="font-semibold">Exams</h2>
            <label className={labelClass}>
              Exam
              <select
                className={inputClass}
                value={examId}
                onChange={(e) => {
                  setExamId(e.target.value);
                  setCredentials(undefined);
                  setChildId("");
                  setResetDevice(false);
                }}
              >
                <option value="">Create a new exam</option>
                {exams.data?.data.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} · {e.status}
                  </option>
                ))}
              </select>
            </label>
            {!examId && (
              <>
                <label className={labelClass}>
                  Name
                  <input
                    className={inputClass}
                    value={examForm.name}
                    onChange={(e) =>
                      setExamForm({ ...examForm, name: e.target.value })
                    }
                  />
                </label>
                <label className={labelClass}>
                  Session
                  <select
                    className={inputClass}
                    value={examForm.sessionId}
                    onChange={(e) =>
                      setExamForm({
                        ...examForm,
                        sessionId: e.target.value,
                        termId: "",
                      })
                    }
                  >
                    <option value="">Choose session</option>
                    {calendar.data?.sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Term
                  <select
                    className={inputClass}
                    value={examForm.termId}
                    onChange={(e) =>
                      setExamForm({ ...examForm, termId: e.target.value })
                    }
                  >
                    <option value="">Choose term</option>
                    {calendar.data?.terms
                      .filter((t) => t.sessionId === examForm.sessionId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Instructions
                  <textarea
                    className={inputClass}
                    value={examForm.instructions}
                    onChange={(e) =>
                      setExamForm({ ...examForm, instructions: e.target.value })
                    }
                  />
                </label>
                {(
                  [
                    "durationMinutes",
                    "passMark",
                    "startDatetime",
                    "endDatetime",
                  ] as const
                ).map((key) => (
                  <label className={labelClass} key={key}>
                    {
                      {
                        durationMinutes: "Duration in minutes",
                        passMark: "Pass percentage",
                        startDatetime: "Opens (local time)",
                        endDatetime: "Closes (local time)",
                      }[key]
                    }
                    <input
                      className={inputClass}
                      type={
                        key.endsWith("Datetime") ? "datetime-local" : "number"
                      }
                      value={examForm[key]}
                      onChange={(e) =>
                        setExamForm({ ...examForm, [key]: e.target.value })
                      }
                    />
                  </label>
                ))}
                <Button
                  disabled={
                    busy ||
                    !examForm.name ||
                    !examForm.termId ||
                    !examForm.startDatetime ||
                    !examForm.endDatetime
                  }
                  onClick={() =>
                    void run(async () => {
                      const result = (
                        await api.post("/cbt/exams", {
                          ...scope,
                          ...examForm,
                          durationMinutes: Number(examForm.durationMinutes),
                          passMark: Number(examForm.passMark),
                          startDatetime: new Date(
                            examForm.startDatetime,
                          ).toISOString(),
                          endDatetime: new Date(
                            examForm.endDatetime,
                          ).toISOString(),
                        })
                      ).data.data;
                      await exams.refetch();
                      setExamId(result.id);
                      setSections([
                        {
                          name: "Section A",
                          durationMinutes: null,
                          navigationMode: "FREE",
                          questions: [],
                          pools: [],
                        },
                      ]);
                    })
                  }
                >
                  Create draft exam
                </Button>
              </>
            )}
            {exam.data && examId && (
              <>
                <p>
                  {exam.data.name} · {exam.data.status} ·{" "}
                  {exam.data.durationMinutes} minutes
                </p>
                <p className="whitespace-pre-wrap break-words">
                  {exam.data.instructions}
                </p>
                <p>
                  {new Date(exam.data.startDatetime).toLocaleString()} –{" "}
                  {new Date(exam.data.endDatetime).toLocaleString()}
                </p>
                {editable && (
                  <ExamSettings
                    key={examId}
                    initial={exam.data}
                    busy={busy}
                    onSave={(body) =>
                      run(async () => {
                        await api.put(`/cbt/exams/${examId}`, body);
                        await Promise.all([exam.refetch(), exams.refetch()]);
                        setNotice("Exam settings saved.");
                      })
                    }
                  />
                )}
                <h3 className="font-semibold">Saved paper</h3>
                {exam.data.sections.map((s, i) => (
                  <p key={i}>
                    {s.name}: {s.questions.length} fixed questions,{" "}
                    {s.pools.reduce((n, p) => n + p.questionCount, 0)} sampled
                    questions
                  </p>
                ))}
                {editable && (
                  <details>
                    <summary className={summaryClass}>
                      Edit paper sections
                    </summary>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setSections(
                          exam.data!.sections.map((s) => ({
                            name: s.name,
                            durationMinutes: s.durationMinutes,
                            navigationMode: s.navigationMode,
                            questions: s.questions.map((q) => ({
                              versionId: q.versionId,
                              marks: Number(q.marks),
                            })),
                            pools: s.pools.map((p) => ({
                              bankId: p.bankId,
                              questionCount: p.questionCount,
                              marksPerQuestion: Number(p.marksPerQuestion),
                              ...(p.topic ? { topic: p.topic } : {}),
                              ...(p.difficulty
                                ? { difficulty: p.difficulty }
                                : {}),
                            })),
                          })),
                        )
                      }
                    >
                      Load saved sections
                    </Button>
                    {sections.map((s, index) => (
                      <div key={index} className={cardClass}>
                        <label className={labelClass}>
                          Section name
                          <input
                            className={inputClass}
                            value={s.name}
                            onChange={(e) =>
                              setSections(
                                sections.map((x, i) =>
                                  i === index
                                    ? { ...x, name: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          />
                        </label>
                        <label className={labelClass}>
                          Section time in minutes (leave empty for untimed
                          sections)
                          <input
                            className={inputClass}
                            type="number"
                            min="1"
                            value={s.durationMinutes ?? ""}
                            onChange={(e) =>
                              setSections(
                                sections.map((x, i) =>
                                  i === index
                                    ? {
                                        ...x,
                                        durationMinutes: e.target.value
                                          ? Number(e.target.value)
                                          : null,
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                        </label>
                        <label className={labelClass}>
                          Section navigation
                          <select
                            className={inputClass}
                            value={s.navigationMode}
                            onChange={(e) =>
                              setSections(
                                sections.map((x, i) =>
                                  i === index
                                    ? { ...x, navigationMode: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          >
                            <option value="FREE">Free</option>
                            <option value="SEQUENTIAL">Sequential</option>
                          </select>
                        </label>
                        <p>
                          Choose approved questions from the selected bank. Set
                          durations for every section or leave every section
                          untimed.
                        </p>
                        {versions.data
                          ?.filter((v) => v.status === "APPROVED")
                          .map((v) => (
                            <label
                              key={v.id}
                              className="block break-words text-sm text-slate-700 dark:text-slate-300"
                            >
                              <input
                                type="checkbox"
                                checked={s.questions.some(
                                  (q) => q.versionId === v.id,
                                )}
                                onChange={(e) =>
                                  setSections(
                                    sections.map((x, i) =>
                                      i !== index
                                        ? x
                                        : {
                                            ...x,
                                            questions: e.target.checked
                                              ? [
                                                  ...x.questions,
                                                  {
                                                    versionId: v.id,
                                                    marks: Number(
                                                      v.defaultMarks,
                                                    ),
                                                  },
                                                ]
                                              : x.questions.filter(
                                                  (q) => q.versionId !== v.id,
                                                ),
                                          },
                                    ),
                                  )
                                }
                              />{" "}
                              {v.questionText} ({v.defaultMarks} marks)
                            </label>
                          ))}
                        <Button
                          variant="secondary"
                          disabled={!bankId}
                          onClick={() =>
                            setSections(
                              sections.map((x, i) =>
                                i === index
                                  ? {
                                      ...x,
                                      pools: [
                                        ...x.pools,
                                        {
                                          bankId,
                                          questionCount: 1,
                                          marksPerQuestion: 1,
                                        },
                                      ],
                                    }
                                  : x,
                              ),
                            )
                          }
                        >
                          Add random pool from selected bank
                        </Button>
                        {s.pools.map((p, pi) => (
                          <div key={pi}>
                            <span>
                              {banks.data?.data.find((b) => b.id === p.bankId)
                                ?.name ?? "Question bank"}
                            </span>
                            {(
                              ["questionCount", "marksPerQuestion"] as const
                            ).map((key) => (
                              <label className={labelClass} key={key}>
                                {key === "questionCount"
                                  ? "Question count"
                                  : "Marks each"}
                                <input
                                  className={inputClass}
                                  type="number"
                                  min="1"
                                  value={p[key]}
                                  onChange={(e) =>
                                    setSections(
                                      sections.map((x, i) =>
                                        i !== index
                                          ? x
                                          : {
                                              ...x,
                                              pools: x.pools.map((pool, j) =>
                                                j === pi
                                                  ? {
                                                      ...pool,
                                                      [key]: Number(
                                                        e.target.value,
                                                      ),
                                                    }
                                                  : pool,
                                              ),
                                            },
                                      ),
                                    )
                                  }
                                />
                              </label>
                            ))}
                            <Button
                              variant="secondary"
                              onClick={() =>
                                setSections(
                                  sections.map((x, i) =>
                                    i !== index
                                      ? x
                                      : {
                                          ...x,
                                          pools: x.pools.filter(
                                            (_, j) => j !== pi,
                                          ),
                                        },
                                  ),
                                )
                              }
                            >
                              Remove pool
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="secondary"
                          onClick={() =>
                            setSections(sections.filter((_, i) => i !== index))
                          }
                        >
                          Remove section
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setSections([
                          ...sections,
                          {
                            name: `Section ${sections.length + 1}`,
                            durationMinutes: null,
                            navigationMode: "FREE",
                            questions: [],
                            pools: [],
                          },
                        ])
                      }
                    >
                      Add section
                    </Button>
                    <Button
                      disabled={busy || !sections.length}
                      onClick={() =>
                        void run(async () => {
                          await api.put(`/cbt/exams/${examId}/sections`, {
                            sections,
                          });
                          await exam.refetch();
                          setNotice("Paper saved.");
                        })
                      }
                    >
                      Save paper sections
                    </Button>
                  </details>
                )}
                <label className={labelClass}>
                  Exam review reason
                  <input
                    className={inputClass}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <div className={buttonRowClass}>
                  {(transitions[exam.data.status] ?? []).map((status) => (
                    <Button
                      key={status}
                      disabled={busy || !reason.trim()}
                      onClick={() =>
                        void run(() => changeStatus("exam", examId, status))
                      }
                    >
                      {status.replaceAll("_", " ")}
                    </Button>
                  ))}
                </div>
                {["APPROVED", "SCHEDULED", "LIVE"].includes(
                  exam.data.status,
                ) && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-3">
                    <h3 className="font-semibold">Student access</h3>
                    <p>
                      Issuing again replaces the student's PIN and requires them
                      to sign in again. Enrollment is checked by the school
                      server.
                    </p>
                    <label className={labelClass}>
                      Student
                      <select
                        className={inputClass}
                        value={childId}
                        onChange={(e) => {
                          setChildId(e.target.value);
                          setCredentials(undefined);
                          setResetDevice(false);
                        }}
                      >
                        <option value="">Choose student</option>
                        {children.data?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={resetDevice}
                        onChange={(e) => setResetDevice(e.target.checked)}
                      />
                      <span>
                        Release this student's device lock. Use when a student
                        must continue on a different device: their exam access
                        is otherwise bound to the first device that signed in.
                        Issuing a PIN on its own keeps the existing lock.
                      </span>
                    </label>
                    <Button
                      disabled={busy || !childId}
                      onClick={() =>
                        void run(async () => {
                          setCredentials(
                            (
                              await api.post(`/cbt/exams/${examId}/access`, {
                                childId,
                                resetDevice,
                              })
                            ).data.data,
                          );
                          setResetDevice(false);
                        })
                      }
                    >
                      {resetDevice
                        ? "Issue PIN and release device"
                        : "Issue or replace PIN"}
                    </Button>
                    {credentials && (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2 break-words">
                        <p>
                          Student ID: <b>{credentials.studentId}</b>
                        </p>
                        <p>
                          PIN: <b>{credentials.pin}</b>
                        </p>
                        <p>
                          Share privately with this student. These credentials
                          are not stored in this browser.
                        </p>
                        <a
                          className="underline text-indigo-600 dark:text-indigo-400"
                          href={`/cbt/${user?.tenantId}/${examId}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open student exam
                        </a>
                        <Button
                          variant="secondary"
                          onClick={() => setCredentials(undefined)}
                        >
                          Hide PIN
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
