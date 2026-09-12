import { useState } from "react";
import type { Question, Value } from "../../lib/cbt/types";
import { Button } from "../../components/ui/button";
export function QuestionInput({
  question: q,
  initial,
  flagged: initialFlag,
  disabled,
  onChange,
}: {
  question: Question;
  initial: Value;
  flagged: boolean;
  disabled: boolean;
  onChange: (value: Value, flagged: boolean) => void;
}) {
  const [value, setValue] = useState<Value>(initial);
  const [flagged, setFlagged] = useState(initialFlag);
  const change = (v: Value) => {
    setValue(v);
    onChange(v, flagged);
  };
  const text = typeof value === "string" ? value : "";
  const choices = Array.isArray(value) ? value : [];
  const pairs =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const order = choices.length ? choices : q.options.map((o) => o.key);
  return (
    <fieldset disabled={disabled} className="space-y-5">
      <legend className="sr-only">Your answer</legend>
      {["SINGLE_CHOICE", "TRUE_FALSE", "MULTIPLE_SELECT"].includes(
        q.questionType,
      ) && (
        <div className="space-y-3">
          {q.options.map((o) => (
            <label
              key={o.key}
              className="flex items-start gap-3 rounded-xl border border-slate-300 p-4 cursor-pointer has-checked:border-indigo-600 has-checked:bg-indigo-50"
            >
              <input
                className="mt-1 accent-indigo-600"
                type={
                  q.questionType === "MULTIPLE_SELECT" ? "checkbox" : "radio"
                }
                name={q.id}
                checked={
                  q.questionType === "MULTIPLE_SELECT"
                    ? choices.includes(o.key)
                    : text === o.key
                }
                onChange={() =>
                  change(
                    q.questionType === "MULTIPLE_SELECT"
                      ? choices.includes(o.key)
                        ? choices.filter((k) => k !== o.key)
                        : [...choices, o.key]
                      : o.key,
                  )
                }
              />
              <span className="whitespace-pre-wrap break-words">
                {o.content}
              </span>
            </label>
          ))}
        </div>
      )}
      {["FILL_BLANK", "SHORT_ANSWER", "ESSAY"].includes(q.questionType) && (
        <label className="block">
          Your answer
          <textarea
            value={text}
            onChange={(e) => change(e.target.value)}
            rows={q.questionType === "ESSAY" ? 10 : 3}
            maxLength={50000}
            className="mt-2 w-full rounded-xl border border-slate-300 p-4 focus:ring-2 focus:ring-indigo-500"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      )}
      {q.questionType === "MATCHING" &&
        q.options.map((o) => (
          <label key={o.key} className="grid gap-2 sm:grid-cols-2 items-center">
            <span>{o.content}</span>
            <select
              className="border border-slate-300 rounded-lg p-3"
              value={pairs[o.key] || ""}
              onChange={(e) => {
                const next = { ...pairs };
                if (e.target.value) next[o.key] = e.target.value;
                else delete next[o.key];
                change(next);
              }}
            >
              <option value="">Choose a match</option>
              {q.matchingTargets?.map((target) => (
                <option key={target}>{target}</option>
              ))}
            </select>
          </label>
        ))}
      {q.questionType === "ORDERING" && (
        <div className="space-y-3">
          <p>Arrange the items in the correct order, then save your order.</p>
          {order.map((key, i) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-lg border border-slate-300 p-3"
            >
              <span className="flex-1">
                {i + 1}. {q.options.find((o) => o.key === key)?.content}
              </span>
              {[-1, 1].map((delta) => (
                <Button
                  key={delta}
                  variant="secondary"
                  size="sm"
                  disabled={
                    disabled || i + delta < 0 || i + delta >= order.length
                  }
                  aria-label={`Move item ${i + 1} ${delta < 0 ? "up" : "down"}`}
                  onClick={() => {
                    const next = order.slice();
                    [next[i], next[i + delta]] = [next[i + delta], next[i]];
                    change(next);
                  }}
                >
                  {delta < 0 ? "↑" : "↓"}
                </Button>
              ))}
            </div>
          ))}
          <Button onClick={() => change(order)}>Save this order</Button>
        </div>
      )}
      <div className="flex items-center gap-5 border-t border-slate-200 pt-4">
        <label className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={flagged}
            onChange={(e) => {
              setFlagged(e.target.checked);
              onChange(value, e.target.checked);
            }}
          />
          Flag for review
        </label>
        <Button variant="ghost" onClick={() => change(null)}>
          Clear answer
        </Button>
      </div>
    </fieldset>
  );
}
