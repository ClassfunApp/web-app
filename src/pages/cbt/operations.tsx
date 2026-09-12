import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import { useBusinessType } from "../../hooks/use-business-type";
import { useUsers } from "../../hooks/queries/use-users";
import { useAuth } from "../../hooks/use-auth";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";
import { OperationCommands } from "../../lib/cbt/operation-command";

type Exam = { id: string; name: string };
type Student = {
  child_id: string;
  full_name: string;
  login_code: string;
  attempt_id: string | null;
  status: string | null;
  answered: number;
  questions: number;
  incidents: number;
  signals: number;
  connection: string | null;
  remainingSeconds: number | null;
  ops_revision: number | null;
};
type Board = {
  serverTime: string;
  canManage: boolean;
  exam: Exam;
  counts: { status: string; count: number }[];
  /** Students holding access who can no longer start because admission is sitting-only. */
  unassigned: number;
  students: Student[];
  sittings: {
    id: string;
    name: string;
    room: string;
    assigned: number;
    capacity: number;
    starts_at: string;
    ends_at: string;
  }[];
};
type Incident = {
  id: string;
  child_id: string;
  type: string;
  description: string;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
  revision: number;
};
type AuditEvent = {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};
type Action = "EXTRA_TIME" | "PAUSE" | "RESUME" | "REOPEN" | "INVALIDATE";
const incidentTypes = [
  "POWER_FAILURE",
  "DEVICE_FAILURE",
  "NETWORK_FAILURE",
  "STUDENT_ILLNESS",
  "LOGIN_PROBLEM",
  "SUSPECTED_MALPRACTICE",
  "INVIGILATOR_ACTION",
  "OTHER",
] as const;
const message = (e: unknown) =>
  (e as { response?: { data?: { message?: string } }; message?: string })
    .response?.data?.message ??
  (e as Error).message ??
  "Request failed.";
const time = (seconds: number | null) =>
  seconds == null
    ? "—"
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
const localInputTime = (value: unknown) => {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

export default function ExamOperationsPage() {
  const { isSchool } = useBusinessType();
  const { user } = useAuth();
  const [commands] = useState(
    () => new OperationCommands(undefined, `${user?.tenantId}:${user?.id}`),
  );
  const [blockedSlot, setBlockedSlot] = useState("");
  // Slots identify one intent each, so an unresolved incident cannot block the next one.
  const postCommand = (
    slot: string,
    path: string,
    body: Record<string, unknown>,
  ) => commands.run(slot, body, (payload) => api.post(path, payload));
  const [examId, setExamId] = useState("");
  const [selected, setSelected] = useState<Student>();
  const [action, setAction] = useState<Action>();
  const [confirmAction, setConfirmAction] = useState(false);
  const [cancelSittingId, setCancelSittingId] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [reason, setReason] = useState("");
  const [minutes, setMinutes] = useState("10");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [incidentType, setIncidentType] =
    useState<(typeof incidentTypes)[number]>("OTHER");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentReason, setIncidentReason] = useState("");
  const [resolving, setResolving] = useState<string>();
  const [resolution, setResolution] = useState("");
  const [resolutionReason, setResolutionReason] = useState("");
  const [showSitting, setShowSitting] = useState(false);
  const [sitting, setSitting] = useState({
    name: "",
    room: "",
    startsAt: "",
    endsAt: "",
    capacity: "1",
    childIds: [] as string[],
    invigilatorIds: [] as string[],
    reason: "",
  });
  const { data: users = [] } = useUsers();
  const exams = useQuery({
    queryKey: ["cbt-operation-exams"],
    enabled: isSchool,
    queryFn: async () =>
      (await api.get<{ data: Exam[] }>("/cbt/operations/exams")).data.data,
  });
  const board = useQuery({
    queryKey: ["cbt-control-room", examId],
    enabled: isSchool && !!examId,
    refetchInterval: 5000,
    queryFn: async () =>
      (await api.get<{ data: Board }>(`/cbt/operations/exams/${examId}`)).data
        .data,
  });
  const selectedChildId = selected?.child_id;
  const incidents = useQuery({
    queryKey: ["cbt-incidents", examId, selectedChildId],
    enabled: !!examId && !!selectedChildId,
    queryFn: async () =>
      (
        await api.get<{ data: Incident[] }>(
          `/cbt/operations/exams/${examId}/incidents`,
        )
      ).data.data.filter((i) => i.child_id === selectedChildId),
  });
  const audit = useQuery({
    queryKey: ["cbt-attempt-audit", selected?.attempt_id],
    enabled: !!selected?.attempt_id && !!board.data?.canManage,
    queryFn: async () =>
      (
        await api.get<{ data: AuditEvent[] }>(
          `/cbt/operations/attempts/${selected!.attempt_id}/audit`,
        )
      ).data.data,
  });
  useEffect(() => {
    if (selectedChildId && !confirmAction)
      setSelected(
        board.data?.students.find((s) => s.child_id === selectedChildId),
      );
  }, [board.data, selectedChildId, confirmAction]);
  useEffect(() => {
    if (!examId || !selectedChildId) return;
    const incident = commands.body(`incident:${examId}:${selectedChildId}`);
    if (incident) {
      setIncidentType(incident.type as (typeof incidentTypes)[number]);
      setIncidentDescription(String(incident.description ?? ""));
      setIncidentReason(String(incident.reason ?? ""));
    } else {
      setIncidentDescription("");
      setIncidentReason("");
    }
  }, [commands, examId, selectedChildId]);
  useEffect(() => {
    const intervention = selected?.attempt_id
      ? commands.body(`intervene:${selected.attempt_id}`)
      : undefined;
    if (intervention) {
      setAction(intervention.action as Action);
      setReason(String(intervention.reason ?? ""));
      if (intervention.minutes) setMinutes(String(intervention.minutes));
      setConfirmAction(true);
    }
  }, [commands, selected?.attempt_id]);
  function failed(slot: string, e: unknown) {
    setError(message(e));
    setBlockedSlot(commands.blocked(slot) ? slot : "");
  }
  async function intervene() {
    if (!selected?.attempt_id || !action) return;
    const slot = `intervene:${selected.attempt_id}`;
    setBusy(true);
    setError("");
    try {
      await postCommand(
        slot,
        `/cbt/operations/attempts/${selected.attempt_id}/intervene`,
        {
          action,
          reason,
          expectedRevision: selected.ops_revision ?? 0,
          ...(["EXTRA_TIME", "REOPEN"].includes(action)
            ? { minutes: Number(minutes) }
            : {}),
        },
      );
      setAction(undefined);
      setConfirmAction(false);
      setReason("");
      setBlockedSlot("");
      await Promise.all([board.refetch(), audit.refetch()]);
    } catch (e) {
      failed(slot, e);
    } finally {
      setBusy(false);
    }
  }
  async function recordIncident() {
    if (!selected) return;
    const slot = `incident:${examId}:${selected.child_id}`;
    setBusy(true);
    setError("");
    try {
      await postCommand(
        slot,
        `/cbt/operations/exams/${examId}/incidents`,
        {
          childId: selected.child_id,
          type: incidentType,
          description: incidentDescription,
          reason: incidentReason,
        },
      );
      setIncidentDescription("");
      setIncidentReason("");
      setBlockedSlot("");
      await Promise.all([board.refetch(), incidents.refetch()]);
    } catch (e) {
      failed(slot, e);
    } finally {
      setBusy(false);
    }
  }
  async function resolveIncident(id: string) {
    const slot = `resolve-incident:${id}`;
    setBusy(true);
    setError("");
    try {
      const incident = incidents.data?.find((item) => item.id === id);
      if (!incident)
        throw new Error("Refresh the incident list and try again.");
      await postCommand(
        slot,
        `/cbt/operations/incidents/${id}/resolve`,
        {
          resolution,
          reason: resolutionReason,
          expectedRevision: incident.revision,
        },
      );
      setResolving(undefined);
      setResolution("");
      setResolutionReason("");
      setBlockedSlot("");
      await Promise.all([board.refetch(), incidents.refetch()]);
    } catch (e) {
      failed(slot, e);
    } finally {
      setBusy(false);
    }
  }
  async function cancelSitting() {
    const slot = `cancel-sitting:${cancelSittingId}`;
    setBusy(true);
    setError("");
    try {
      await postCommand(
        slot,
        `/cbt/operations/exams/${examId}/sittings/cancel`,
        {
          sittingId: cancelSittingId,
          reason: cancelReason,
        },
      );
      setCancelSittingId("");
      setCancelReason("");
      setBlockedSlot("");
      await board.refetch();
    } catch (e) {
      failed(slot, e);
    } finally {
      setBusy(false);
    }
  }
  async function createSitting() {
    const slot = `sitting:${examId}`;
    setBusy(true);
    setError("");
    try {
      await postCommand(
        slot,
        `/cbt/operations/exams/${examId}/sittings`,
        {
          ...sitting,
          startsAt: new Date(sitting.startsAt).toISOString(),
          endsAt: new Date(sitting.endsAt).toISOString(),
          capacity: Number(sitting.capacity),
        },
      );
      setShowSitting(false);
      setSitting({
        name: "",
        room: "",
        startsAt: "",
        endsAt: "",
        capacity: "1",
        childIds: [],
        invigilatorIds: [],
        reason: "",
      });
      setBlockedSlot("");
      await board.refetch();
    } catch (e) {
      failed(slot, e);
    } finally {
      setBusy(false);
    }
  }
  function openSitting() {
    const pending = commands.body(`sitting:${examId}`);
    if (pending) {
      setSitting({
        name: String(pending.name ?? ""),
        room: String(pending.room ?? ""),
        startsAt: localInputTime(pending.startsAt),
        endsAt: localInputTime(pending.endsAt),
        capacity: String(pending.capacity ?? 1),
        childIds: Array.isArray(pending.childIds)
          ? pending.childIds.map(String)
          : [],
        invigilatorIds: Array.isArray(pending.invigilatorIds)
          ? pending.invigilatorIds.map(String)
          : [],
        reason: String(pending.reason ?? ""),
      });
    }
    setShowSitting(true);
  }
  if (!isSchool) return <p>Exam operations are available to school tenants.</p>;
  const counts = new Map(board.data?.counts.map((c) => [c.status, c.count]));
  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-bold">Exam control room</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Live status, incidents and audited attempt interventions.
        </p>
      </div>
      {(error || exams.error || board.error) && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950 space-y-3"
        >
          <p>{error || message(exams.error || board.error)}</p>
          {blockedSlot && (
            <div className="space-y-2">
              <p className="text-sm">
                Open the attempt audit to confirm whether the command was
                applied. Discard it only once you have checked: discarding
                allows a fresh command that could repeat the original.
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  commands.discard(blockedSlot);
                  setBlockedSlot("");
                  setError("");
                  setConfirmAction(false);
                }}
              >
                Discard pending command
              </Button>
            </div>
          )}
        </div>
      )}
      <label className="block">
        Exam
        <select
          aria-label="Exam"
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          className="block mt-1 w-full border rounded-lg p-3 bg-white dark:bg-slate-900"
        >
          <option value="">Choose an exam</option>
          {exams.data?.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </label>
      {board.data && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              ["Expected", board.data.students.length],
              ["Not started", counts.get("NOT_STARTED") ?? 0],
              ["Writing", counts.get("IN_PROGRESS") ?? 0],
              ["Paused", counts.get("PAUSED") ?? 0],
              [
                "Submitted",
                (counts.get("SUBMITTED") ?? 0) +
                  (counts.get("AUTO_SUBMITTED") ?? 0),
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 p-4"
              >
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </section>
          <section className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 p-4">
            <div className="flex justify-between">
              <h2 className="font-semibold mb-3">Sittings</h2>
              {board.data.canManage && (
                <Button onClick={openSitting}>
                  Schedule sitting
                </Button>
              )}
            </div>
            {board.data.sittings.map((s) => (
              <p key={s.id}>
                {s.name} · {s.room} · {s.assigned}/{s.capacity} ·{" "}
                {new Date(s.starts_at).toLocaleString()}{" "}
                {board.data.canManage && (
                  <Button
                    variant="secondary"
                    onClick={() => setCancelSittingId(s.id)}
                  >
                    Cancel sitting
                  </Button>
                )}
              </p>
            ))}
            {!board.data.sittings.length && (
              <p>
                No sittings scheduled. Issued access uses the main exam window.
                Creating a sitting requires every student to be assigned before
                they can start.
              </p>
            )}
            {!!board.data.unassigned && (
              <p
                role="alert"
                className="mt-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950 p-3"
              >
                <b>
                  {board.data.unassigned} student
                  {board.data.unassigned === 1 ? "" : "s"} cannot start.
                </b>{" "}
                They have exam access but no sitting, and this exam now admits
                by sitting only. Assign them to a sitting, or cancel the
                sittings to return to the main exam window.
              </p>
            )}
          </section>
          <section className="overflow-x-auto rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-slate-700">
                  <th className="p-3 text-left">Student</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Time</th>
                  <th>Connection</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {board.data.students.map((s) => (
                  <tr
                    key={s.child_id}
                    className="border-b dark:border-slate-800"
                  >
                    <td className="p-3">
                      <b>{s.full_name}</b>
                      <br />
                      <span className="text-slate-500">{s.login_code}</span>
                    </td>
                    <td>{s.status ?? "NOT_STARTED"}</td>
                    <td>
                      {s.answered}/{s.questions}
                    </td>
                    <td>{time(s.remainingSeconds)}</td>
                    <td>{s.connection ?? "—"}</td>
                    <td>
                      <Button
                        variant="secondary"
                        onClick={() => setSelected(s)}
                      >
                        Open ({s.incidents} incidents · {s.signals} signals)
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
      <Modal
        open={!!selected}
        onClose={() => {
          setSelected(undefined);
          setAction(undefined);
          setConfirmAction(false);
        }}
        title={selected?.full_name ?? "Student attempt"}
      >
        {selected && (
          <div className="space-y-4">
            <p>
              Status: <b>{selected.status ?? "NOT_STARTED"}</b> · Answered{" "}
              {selected.answered}/{selected.questions} · Time{" "}
              {time(selected.remainingSeconds)}
            </p>
            {board.data?.canManage && selected.attempt_id && (
              <>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "EXTRA_TIME",
                      "PAUSE",
                      "RESUME",
                      "REOPEN",
                      "INVALIDATE",
                    ] as Action[]
                  ).map((a) => (
                    <Button
                      key={a}
                      variant={action === a ? "primary" : "secondary"}
                      onClick={() => {
                        setAction(a);
                        setConfirmAction(false);
                      }}
                    >
                      {a.replace("_", " ")}
                    </Button>
                  ))}
                </div>
                {action && (
                  <div className="space-y-3">
                    {["EXTRA_TIME", "REOPEN"].includes(action) && (
                      <label className="block">
                        Minutes
                        <input
                          aria-label="Minutes"
                          type="number"
                          min="1"
                          max="240"
                          disabled={confirmAction}
                          value={minutes}
                          onChange={(e) => setMinutes(e.target.value)}
                          className="block border rounded p-2 bg-white dark:bg-slate-800"
                        />
                      </label>
                    )}
                    <label className="block">
                      Required reason
                      <textarea
                        aria-label="Required reason"
                        disabled={confirmAction}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="block w-full border rounded p-2 bg-white dark:bg-slate-800"
                        maxLength={2000}
                      />
                    </label>
                    {confirmAction ? (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950 p-3 space-y-3">
                        <p>
                          <b>Apply {action.replace("_", " ")} now?</b> This will
                          be recorded in the immutable attempt audit.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => setConfirmAction(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            disabled={busy}
                            onClick={() => void intervene()}
                          >
                            Confirm intervention
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        disabled={busy || !reason.trim()}
                        onClick={() => setConfirmAction(true)}
                      >
                        Review intervention
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
            <div className="border-t dark:border-slate-700 pt-4 space-y-3">
              <h3 className="font-semibold">Incidents</h3>
              {incidents.data?.map((i) => (
                <div key={i.id} className="rounded-lg border p-3">
                  <p>
                    <b>{i.type.replaceAll("_", " ")}</b> ·{" "}
                    {new Date(i.created_at).toLocaleString()}
                  </p>
                  <p>{i.description}</p>
                  {i.resolved_at ? (
                    <p className="text-sm text-emerald-700">
                      Resolved: {i.resolution}
                    </p>
                  ) : (
                    board.data?.canManage &&
                    (resolving === i.id ? (
                      <div className="space-y-2 mt-2">
                        <textarea
                          aria-label="Resolution"
                          placeholder="How was this resolved?"
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          className="w-full border rounded p-2 bg-white dark:bg-slate-800"
                        />
                        <textarea
                          aria-label="Resolution reason"
                          placeholder="Reason for closing this incident"
                          value={resolutionReason}
                          onChange={(e) => setResolutionReason(e.target.value)}
                          className="w-full border rounded p-2 bg-white dark:bg-slate-800"
                        />
                        <Button
                          disabled={
                            busy ||
                            !resolution.trim() ||
                            !resolutionReason.trim()
                          }
                          onClick={() => void resolveIncident(i.id)}
                        >
                          Resolve incident
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => setResolving(i.id)}
                      >
                        Resolve
                      </Button>
                    ))
                  )}
                </div>
              ))}
              {!incidents.data?.length && (
                <p className="text-sm text-slate-500">
                  No incidents recorded for this student.
                </p>
              )}
              <h3 className="font-semibold pt-2">Record incident</h3>
              <select
                aria-label="Incident type"
                value={incidentType}
                onChange={(e) =>
                  setIncidentType(e.target.value as typeof incidentType)
                }
                className="w-full border rounded p-2 bg-white dark:bg-slate-800"
              >
                {incidentTypes.map((t) => (
                  <option key={t}>{t.replaceAll("_", " ")}</option>
                ))}
              </select>
              <textarea
                aria-label="Incident description"
                placeholder="What happened?"
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                className="w-full border rounded p-2 bg-white dark:bg-slate-800"
              />
              <textarea
                aria-label="Incident reason"
                placeholder="Why is this incident being recorded?"
                value={incidentReason}
                onChange={(e) => setIncidentReason(e.target.value)}
                className="w-full border rounded p-2 bg-white dark:bg-slate-800"
              />
              <Button
                disabled={
                  busy || !incidentDescription.trim() || !incidentReason.trim()
                }
                onClick={() => void recordIncident()}
              >
                Record incident
              </Button>
            </div>
            {board.data?.canManage && selected.attempt_id && (
              <div className="border-t dark:border-slate-700 pt-4 space-y-2">
                <h3 className="font-semibold">Attempt audit</h3>
                {audit.data?.map((e) => (
                  <div key={e.id} className="text-sm">
                    <b>{e.action.replaceAll("_", " ")}</b> ·{" "}
                    {new Date(e.created_at).toLocaleString()}
                    <pre className="whitespace-pre-wrap text-xs text-slate-500">
                      {JSON.stringify(e.details)}
                    </pre>
                  </div>
                ))}
                {!audit.data?.length && (
                  <p className="text-sm text-slate-500">
                    No attempt events recorded yet.
                  </p>
                )}
              </div>
            )}
            {!board.data?.canManage && (
              <p>
                Invigilator access is limited to assigned students. Attempt
                interventions require an exam officer.
              </p>
            )}
          </div>
        )}
      </Modal>
      <Modal
        open={!!cancelSittingId}
        onClose={() => setCancelSittingId("")}
        title="Cancel sitting"
      >
        <p>
          Students in this sitting will need reassignment if other sittings
          remain. If this is the last sitting, the main exam window applies.
          Sittings with started attempts cannot be cancelled.
        </p>
        <textarea
          aria-label="Cancellation reason"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          className="w-full border rounded p-2"
        />
        <Button
          disabled={busy || !cancelReason.trim()}
          onClick={() => void cancelSitting()}
        >
          Confirm cancellation
        </Button>
      </Modal>
      <Modal
        open={showSitting}
        onClose={() => setShowSitting(false)}
        title="Schedule sitting"
      >
        <div className="space-y-3">
          <p>
            Once any sitting exists, only assigned students can start. You may
            add omitted students in later sittings. To correct an unused
            sitting, cancel it and schedule its replacement.
          </p>
          <label className="block">
            Batch name
            <input
              aria-label="Batch name"
              value={sitting.name}
              onChange={(e) =>
                setSitting((v) => ({ ...v, name: e.target.value }))
              }
              className="block w-full border rounded p-2 bg-white dark:bg-slate-800"
            />
          </label>
          <label className="block">
            Room
            <input
              aria-label="Room"
              value={sitting.room}
              onChange={(e) =>
                setSitting((v) => ({ ...v, room: e.target.value }))
              }
              className="block w-full border rounded p-2 bg-white dark:bg-slate-800"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label>
              Starts
              <input
                aria-label="Starts"
                type="datetime-local"
                value={sitting.startsAt}
                onChange={(e) =>
                  setSitting((v) => ({ ...v, startsAt: e.target.value }))
                }
                className="block w-full border rounded p-2 bg-white dark:bg-slate-800"
              />
            </label>
            <label>
              Ends
              <input
                aria-label="Ends"
                type="datetime-local"
                value={sitting.endsAt}
                onChange={(e) =>
                  setSitting((v) => ({ ...v, endsAt: e.target.value }))
                }
                className="block w-full border rounded p-2 bg-white dark:bg-slate-800"
              />
            </label>
          </div>
          <label className="block">
            Capacity
            <input
              aria-label="Capacity"
              type="number"
              min="1"
              max="1000"
              value={sitting.capacity}
              onChange={(e) =>
                setSitting((v) => ({ ...v, capacity: e.target.value }))
              }
              className="block border rounded p-2 bg-white dark:bg-slate-800"
            />
          </label>
          <fieldset>
            <legend className="font-semibold">
              Students with issued access
            </legend>
            {board.data?.students.map((s) => (
              <label key={s.child_id} className="block">
                <input
                  type="checkbox"
                  checked={sitting.childIds.includes(s.child_id)}
                  onChange={(e) =>
                    setSitting((v) => ({
                      ...v,
                      childIds: e.target.checked
                        ? [...v.childIds, s.child_id]
                        : v.childIds.filter((id) => id !== s.child_id),
                    }))
                  }
                />{" "}
                {s.full_name}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend className="font-semibold">Invigilators</legend>
            {users
              .filter((u) =>
                u.roles?.some((r) =>
                  new Set<string>([
                    "business_owner",
                    "manager",
                    "teacher",
                    "staff",
                  ]).has(r),
                ),
              )
              .map((u) => (
                <label key={u.id} className="block">
                  <input
                    type="checkbox"
                    checked={sitting.invigilatorIds.includes(u.id)}
                    onChange={(e) =>
                      setSitting((v) => ({
                        ...v,
                        invigilatorIds: e.target.checked
                          ? [...v.invigilatorIds, u.id]
                          : v.invigilatorIds.filter((id) => id !== u.id),
                      }))
                    }
                  />{" "}
                  {u.fullName}
                </label>
              ))}
          </fieldset>
          <label className="block">
            Scheduling reason
            <textarea
              aria-label="Scheduling reason"
              value={sitting.reason}
              onChange={(e) =>
                setSitting((v) => ({ ...v, reason: e.target.value }))
              }
              className="block w-full border rounded p-2 bg-white dark:bg-slate-800"
            />
          </label>
          <Button
            disabled={
              busy ||
              !sitting.name ||
              !sitting.room ||
              !sitting.startsAt ||
              !sitting.endsAt ||
              !sitting.childIds.length ||
              !sitting.invigilatorIds.length ||
              !sitting.reason.trim()
            }
            onClick={() => void createSitting()}
          >
            Create sitting
          </Button>
        </div>
      </Modal>
    </div>
  );
}
