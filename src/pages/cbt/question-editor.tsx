import { useState } from "react";
import { Button } from "../../components/ui/button";
import {
  orderingProblem,
  parseLines,
  parseList,
  questionProblem,
} from "../../lib/cbt/authoring-rules";
import {
  buttonRowClass,
  cardClass,
  inputClass,
  labelClass,
  mutedClass,
} from "./styles";

type Option = { key: string; content: string; isCorrect: boolean };
export type QuestionVersion = {
  id: string;
  questionId: string;
  version: number;
  status: string;
  topic: string;
  difficulty: string;
  questionType: string;
  questionText: string;
  explanation: string;
  defaultMarks: number;
  options: Option[];
  answer: {
    acceptedTexts?: string[];
    rubric?: string;
    caseSensitive?: boolean;
    partialCredit?: boolean;
    order?: string[];
    pairs?: Record<string, string>;
  };
};
const types = [
  "SINGLE_CHOICE",
  "MULTIPLE_SELECT",
  "TRUE_FALSE",
  "FILL_BLANK",
  "SHORT_ANSWER",
  "ESSAY",
  "MATCHING",
  "ORDERING",
];

export function QuestionEditor({
  initial,
  busy,
  onCancel,
  onSave,
}: {
  initial: QuestionVersion | null;
  busy: boolean;
  onCancel: () => void;
  onSave: (content: Record<string, unknown>) => Promise<void>;
}) {
  const [type, setType] = useState(initial?.questionType ?? "SINGLE_CHOICE");
  const [text, setText] = useState(initial?.questionText ?? "");
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "MEDIUM");
  const [marks, setMarks] = useState(initial?.defaultMarks ?? 1);
  const [explanation, setExplanation] = useState(initial?.explanation ?? "");
  const [options, setOptions] = useState<Option[]>(
    initial?.options ?? [
      { key: "A", content: "", isCorrect: true },
      { key: "B", content: "", isCorrect: false },
    ],
  );
  const [accepted, setAccepted] = useState(
    initial?.answer.acceptedTexts?.join("\n") ?? "",
  );
  const [rubric, setRubric] = useState(initial?.answer.rubric ?? "");
  const [pairs, setPairs] = useState(initial?.answer.pairs ?? {});
  const [order, setOrder] = useState(initial?.answer.order?.join(", ") ?? "");
  const [partial, setPartial] = useState(
    initial?.answer.partialCredit ?? false,
  );
  const [caseSensitive, setCaseSensitive] = useState(
    initial?.answer.caseSensitive ?? false,
  );
  const choice = ["SINGLE_CHOICE", "MULTIPLE_SELECT", "TRUE_FALSE"].includes(
    type,
  );
  const usesOptions = choice || ["MATCHING", "ORDERING"].includes(type);
  const draft = {
    questionType: type,
    questionText: text,
    topic,
    options,
    order,
    pairs,
    accepted,
  };
  const problem = questionProblem(draft);
  const orderProblem =
    type === "ORDERING" && order.trim()
      ? orderingProblem(
          parseList(order),
          options.map((o) => o.key),
        )
      : null;
  async function save() {
    if (problem) return;
    const answer: QuestionVersion["answer"] = {};
    if (["MULTIPLE_SELECT", "MATCHING", "ORDERING"].includes(type))
      answer.partialCredit = partial;
    if (["FILL_BLANK", "SHORT_ANSWER"].includes(type) && accepted.trim()) {
      answer.acceptedTexts = parseLines(accepted);
      answer.caseSensitive = caseSensitive;
    }
    if (["ESSAY", "SHORT_ANSWER"].includes(type)) answer.rubric = rubric;
    if (type === "MATCHING")
      answer.pairs = Object.fromEntries(
        options.map((o) => [o.key, pairs[o.key] ?? ""]),
      );
    if (type === "ORDERING") answer.order = parseList(order);
    await onSave({
      topic,
      difficulty,
      questionType: type,
      questionText: text,
      explanation,
      defaultMarks: marks,
      options: usesOptions
        ? options.map((o) => ({
            key: o.key,
            content: o.content,
            isCorrect: choice && o.isCorrect,
          }))
        : [],
      answer,
    });
  }
  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3 text-slate-900 dark:text-slate-100">
      <h3 className="font-semibold">
        {initial
          ? `Revise question (creates version ${initial.version + 1} or later)`
          : "New question"}
      </h3>
      <label className={labelClass}>
        Question type
        <select
          className={inputClass}
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setOptions(
              e.target.value === "TRUE_FALSE"
                ? [
                    { key: "true", content: "True", isCorrect: true },
                    { key: "false", content: "False", isCorrect: false },
                  ]
                : [
                    { key: "A", content: "", isCorrect: true },
                    { key: "B", content: "", isCorrect: false },
                  ],
            );
          }}
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Topic
        <input
          className={inputClass}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </label>
      <label className={labelClass}>
        Difficulty
        <select
          className={inputClass}
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          {["EASY", "MEDIUM", "HARD"].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Question
        <textarea
          className={inputClass}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <label className={labelClass}>
        Marks
        <input
          className={inputClass}
          type="number"
          min="0.01"
          step="0.01"
          value={marks}
          onChange={(e) => setMarks(Number(e.target.value))}
        />
      </label>
      {usesOptions && (
        <fieldset className="space-y-2">
          <legend className="font-semibold">Options</legend>
          {options.map((o, i) => (
            <div key={o.key} className={cardClass}>
              <label className={labelClass}>
                {o.key}
                <input
                  className={inputClass}
                  value={o.content}
                  onChange={(e) =>
                    setOptions(
                      options.map((x, j) =>
                        i === j ? { ...x, content: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
              {choice && (
                <label className={labelClass}>
                  <input
                    type="checkbox"
                    checked={o.isCorrect}
                    onChange={(e) =>
                      setOptions(
                        options.map((x, j) =>
                          i === j
                            ? { ...x, isCorrect: e.target.checked }
                            : type === "MULTIPLE_SELECT"
                              ? x
                              : { ...x, isCorrect: false },
                        ),
                      )
                    }
                  />{" "}
                  Correct answer
                </label>
              )}
              {type === "MATCHING" && (
                <label className={labelClass}>
                  Matching answer
                  <input
                    className={inputClass}
                    value={pairs[o.key] ?? ""}
                    onChange={(e) =>
                      setPairs({ ...pairs, [o.key]: e.target.value })
                    }
                  />
                </label>
              )}
              {type !== "TRUE_FALSE" && (
                <Button
                  variant="secondary"
                  onClick={() => setOptions(options.filter((_, j) => i !== j))}
                >
                  Remove option
                </Button>
              )}
            </div>
          ))}
          {type !== "TRUE_FALSE" && (
            <Button
              variant="secondary"
              disabled={options.length >= 30}
              onClick={() =>
                setOptions([
                  ...options,
                  {
                    key: `option_${crypto.randomUUID().slice(0, 8)}`,
                    content: "",
                    isCorrect: false,
                  },
                ])
              }
            >
              Add option
            </Button>
          )}
        </fieldset>
      )}
      {type === "ORDERING" && (
        <label className={labelClass}>
          Correct order (option labels separated by commas)
          <input
            className={inputClass}
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            placeholder={options.map((o) => o.key).join(", ")}
          />
          <span className={`block ${mutedClass}`}>
            Use the option labels, not the option text. Every label exactly
            once, in the correct sequence. Available:{" "}
            <b>{options.map((o) => o.key).join(", ") || "add options first"}</b>
            {orderProblem && (
              <span className="block text-amber-700 dark:text-amber-400">
                {orderProblem}
              </span>
            )}
          </span>
        </label>
      )}
      {["FILL_BLANK", "SHORT_ANSWER"].includes(type) && (
        <>
          <label className={labelClass}>
            Accepted answers (one per line; leave blank for manual short-answer
            marking)
            <textarea
              className={inputClass}
              value={accepted}
              onChange={(e) => setAccepted(e.target.value)}
            />
          </label>
          <label className={labelClass}>
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
            />{" "}
            Case sensitive
          </label>
        </>
      )}
      {["ESSAY", "SHORT_ANSWER"].includes(type) && (
        <label className={labelClass}>
          Marking rubric
          <textarea
            className={inputClass}
            value={rubric}
            onChange={(e) => setRubric(e.target.value)}
          />
        </label>
      )}
      {["MULTIPLE_SELECT", "MATCHING", "ORDERING"].includes(type) && (
        <label className={labelClass}>
          <input
            type="checkbox"
            checked={partial}
            onChange={(e) => setPartial(e.target.checked)}
          />{" "}
          Allow partial credit
        </label>
      )}
      <label className={labelClass}>
        Explanation
        <textarea
          className={inputClass}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
      </label>
      {problem && (
        <p role="alert" className="text-amber-700 dark:text-amber-400">
          {problem}
        </p>
      )}
      <div className={buttonRowClass}>
        <Button variant="secondary" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={busy || !!problem || marks <= 0}
          onClick={() => void save()}
        >
          Save draft version
        </Button>
      </div>
    </section>
  );
}
