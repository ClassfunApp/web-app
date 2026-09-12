import { useState } from "react";
import { Button } from "../../components/ui/button";

export type ExamConfiguration = {
  centerId: string;
  activityId: string;
  classLevelId: string;
  sessionId: string;
  termId: string;
  name: string;
  instructions: string;
  durationMinutes: number;
  passMark: number;
  startDatetime: string;
  endDatetime: string;
  attemptLimit: number;
  navigationMode: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowReview: boolean;
  negativeMarking: number;
};
const localDate = (value: string) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
const inputClass = "block w-full border rounded p-2 bg-white dark:bg-slate-800";

export function ExamSettings({
  initial,
  busy,
  onSave,
}: {
  initial: ExamConfiguration;
  busy: boolean;
  onSave: (body: ExamConfiguration) => Promise<void>;
}) {
  const [form, setForm] = useState(() => ({
    ...initial,
    startDatetime: localDate(initial.startDatetime),
    endDatetime: localDate(initial.endDatetime),
  }));
  async function save() {
    const {
      centerId,
      activityId,
      classLevelId,
      sessionId,
      termId,
      name,
      instructions,
      durationMinutes,
      passMark,
      attemptLimit,
      navigationMode,
      shuffleQuestions,
      shuffleOptions,
      allowReview,
      negativeMarking,
    } = form;
    await onSave({
      centerId,
      activityId,
      classLevelId,
      sessionId,
      termId,
      name,
      instructions,
      durationMinutes: Number(durationMinutes),
      passMark: Number(passMark),
      attemptLimit: Number(attemptLimit),
      navigationMode,
      shuffleQuestions,
      shuffleOptions,
      allowReview,
      negativeMarking: Number(negativeMarking),
      startDatetime: new Date(form.startDatetime).toISOString(),
      endDatetime: new Date(form.endDatetime).toISOString(),
    });
  }
  return (
    <details className="space-y-3">
      <summary>Edit exam settings</summary>
      <label>
        Name
        <input
          className={inputClass}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>
      <label>
        Instructions
        <textarea
          className={inputClass}
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
        />
      </label>
      {(
        [
          "durationMinutes",
          "passMark",
          "attemptLimit",
          "negativeMarking",
        ] as const
      ).map((key) => (
        <label className="block" key={key}>
          {
            {
              durationMinutes: "Duration in minutes",
              passMark: "Pass percentage",
              attemptLimit: "Attempt limit",
              negativeMarking: "Penalty per incorrect answer",
            }[key]
          }
          <input
            className={inputClass}
            type="number"
            value={form[key]}
            onChange={(e) =>
              setForm({ ...form, [key]: Number(e.target.value) })
            }
          />
        </label>
      ))}
      {(["startDatetime", "endDatetime"] as const).map((key) => (
        <label className="block" key={key}>
          {key === "startDatetime"
            ? "Opens (local time)"
            : "Closes (local time)"}
          <input
            className={inputClass}
            type="datetime-local"
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        </label>
      ))}
      <label>
        Navigation
        <select
          className={inputClass}
          value={form.navigationMode}
          onChange={(e) =>
            setForm({
              ...form,
              navigationMode: e.target.value,
              allowReview: e.target.value === "FREE",
            })
          }
        >
          <option value="FREE">Free navigation</option>
          <option value="SEQUENTIAL">Sequential navigation</option>
        </select>
      </label>
      {(["shuffleQuestions", "shuffleOptions", "allowReview"] as const).map(
        (key) => (
          <label className="block" key={key}>
            <input
              type="checkbox"
              disabled={
                key === "allowReview" && form.navigationMode === "SEQUENTIAL"
              }
              checked={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
            />{" "}
            {
              {
                shuffleQuestions: "Shuffle questions",
                shuffleOptions: "Shuffle options",
                allowReview: "Allow review",
              }[key]
            }
          </label>
        ),
      )}
      <Button
        disabled={
          busy || !form.name || !form.startDatetime || !form.endDatetime
        }
        onClick={() => void save()}
      >
        Save exam settings
      </Button>
    </details>
  );
}
