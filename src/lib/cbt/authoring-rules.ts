/**
 * Client mirror of the server's question validator. The server stays authoritative;
 * these checks exist so an author sees the problem beside the field instead of a
 * rejected save, and so a mistyped answer key cannot reach a live paper.
 */
export type OptionDraft = { key: string; content: string; isCorrect: boolean };
export type QuestionDraft = {
  questionType: string;
  questionText: string;
  topic: string;
  options: OptionDraft[];
  order: string;
  pairs: Record<string, string>;
  accepted: string;
};
export const CHOICE_TYPES = [
  "SINGLE_CHOICE",
  "MULTIPLE_SELECT",
  "TRUE_FALSE",
] as const;
export const parseList = (text: string) =>
  text
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

export function optionsProblem(options: OptionDraft[]): string | null {
  const keys = options.map((o) => o.key);
  if (keys.some((k) => !k.trim())) return "Every option needs a label.";
  if (keys.some((k) => !/^[a-zA-Z0-9_-]{1,40}$/.test(k)))
    return "Option labels may use letters, digits, hyphens and underscores only.";
  if (new Set(keys).size !== keys.length)
    return "Option labels must be unique.";
  if (options.some((o) => !o.content.trim()))
    return "Every option needs content.";
  return null;
}

export function orderingProblem(
  order: string[],
  keys: string[],
): string | null {
  if (keys.length < 2) return "Ordering questions need at least two options.";
  const unknown = order.filter((k) => !keys.includes(k));
  if (unknown.length)
    return `Not an option label: ${unknown.join(", ")}. Use ${keys.join(", ")}.`;
  if (new Set(order).size !== order.length)
    return "Each option label may appear only once.";
  if (order.length !== keys.length) {
    const missing = keys.filter((k) => !order.includes(k));
    return `Order every option exactly once. Missing: ${missing.join(", ")}.`;
  }
  return null;
}

export function matchingProblem(
  keys: string[],
  pairs: Record<string, string>,
): string | null {
  if (keys.length < 2) return "Matching questions need at least two options.";
  const blank = keys.filter((k) => !pairs[k]?.trim());
  if (blank.length)
    return `Give every option a target. Missing: ${blank.join(", ")}.`;
  return null;
}

export function choiceProblem(
  type: string,
  options: OptionDraft[],
): string | null {
  if (options.length < 2)
    return "Choice questions require at least two options.";
  const correct = options.filter((o) => o.isCorrect).length;
  if (type === "MULTIPLE_SELECT")
    return correct < 1 ? "Mark at least one correct option." : null;
  if (correct !== 1) return "Mark exactly one correct option.";
  if (type === "TRUE_FALSE") {
    const keys = options.map((o) => o.key);
    if (keys.length !== 2 || !keys.includes("true") || !keys.includes("false"))
      return "True/false requires the labels true and false.";
  }
  return null;
}

/** First blocking problem with this draft, or null when it is ready to save. */
export function questionProblem(draft: QuestionDraft): string | null {
  if (!draft.questionText.trim()) return "Enter the question text.";
  if (!draft.topic.trim()) return "Enter a topic.";
  const choice = (CHOICE_TYPES as readonly string[]).includes(
    draft.questionType,
  );
  const usesOptions =
    choice || ["MATCHING", "ORDERING"].includes(draft.questionType);
  if (!usesOptions)
    return draft.questionType === "FILL_BLANK" &&
      !parseLines(draft.accepted).length
      ? "Fill in the blank requires at least one accepted answer."
      : null;
  const options = optionsProblem(draft.options);
  if (options) return options;
  const keys = draft.options.map((o) => o.key);
  if (choice) return choiceProblem(draft.questionType, draft.options);
  if (draft.questionType === "ORDERING")
    return orderingProblem(parseList(draft.order), keys);
  return matchingProblem(keys, draft.pairs);
}

export const parseLines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
