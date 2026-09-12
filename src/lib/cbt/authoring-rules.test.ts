import { describe, expect, it } from "vitest";
import {
  choiceProblem,
  matchingProblem,
  optionsProblem,
  orderingProblem,
  parseLines,
  parseList,
  questionProblem,
  type OptionDraft,
  type QuestionDraft,
} from "./authoring-rules";

const option = (
  key: string,
  content = key.toUpperCase(),
  isCorrect = false,
): OptionDraft => ({ key, content, isCorrect });
const draft = (over: Partial<QuestionDraft> = {}): QuestionDraft => ({
  questionType: "SINGLE_CHOICE",
  questionText: "Half of 8?",
  topic: "Fractions",
  options: [option("A", "4", true), option("B", "8")],
  order: "",
  pairs: {},
  accepted: "",
  ...over,
});

describe("parsing", () => {
  it("trims and drops empty entries", () => {
    expect(parseList(" A , B ,, C ")).toEqual(["A", "B", "C"]);
    expect(parseLines("one\n  two  \n\nthree")).toEqual([
      "one",
      "two",
      "three",
    ]);
  });
});

describe("option labels", () => {
  it("requires unique, well-formed, non-empty labels and content", () => {
    expect(optionsProblem([option("A"), option("A")])).toMatch("unique");
    expect(optionsProblem([option("A"), option(" ")])).toMatch("label");
    expect(optionsProblem([option("A"), option("b c")])).toMatch(
      "letters, digits",
    );
    expect(optionsProblem([option("A"), option("B", "  ")])).toMatch("content");
    expect(optionsProblem([option("A"), option("B")])).toBeNull();
  });
});

describe("ordering answers", () => {
  const keys = ["A", "B", "C"];
  it("rejects option text mistaken for labels", () => {
    // The failure this guards: authoring the visible content instead of the key
    // silently scores every student zero once the paper is frozen.
    const problem = orderingProblem(parseList("Paris, London, Rome"), keys);
    expect(problem).toMatch("Not an option label");
    expect(problem).toMatch("Use A, B, C");
  });
  it("rejects duplicates, omissions and extras", () => {
    expect(orderingProblem(["A", "A", "B"], keys)).toMatch("only once");
    expect(orderingProblem(["A", "B"], keys)).toMatch("Missing: C");
    expect(orderingProblem(["A", "B", "C"], ["A"])).toMatch(
      "at least two options",
    );
  });
  it("accepts every label exactly once in any sequence", () => {
    expect(orderingProblem(["C", "A", "B"], keys)).toBeNull();
  });
});

describe("matching answers", () => {
  it("requires a target for every option", () => {
    expect(matchingProblem(["A", "B"], { A: "1" })).toMatch("Missing: B");
    expect(matchingProblem(["A", "B"], { A: "1", B: "   " })).toMatch(
      "Missing: B",
    );
    expect(matchingProblem(["A", "B"], { A: "1", B: "2" })).toBeNull();
  });
});

describe("choice answers", () => {
  it("requires exactly one correct option outside multi-select", () => {
    expect(choiceProblem("SINGLE_CHOICE", [option("A"), option("B")])).toMatch(
      "exactly one",
    );
    expect(
      choiceProblem("SINGLE_CHOICE", [
        option("A", "4", true),
        option("B", "8", true),
      ]),
    ).toMatch("exactly one");
    expect(
      choiceProblem("MULTIPLE_SELECT", [option("A"), option("B")]),
    ).toMatch("at least one");
    expect(
      choiceProblem("MULTIPLE_SELECT", [
        option("A", "4", true),
        option("B", "8", true),
      ]),
    ).toBeNull();
  });
  it("requires the reserved true/false labels", () => {
    expect(
      choiceProblem("TRUE_FALSE", [
        option("yes", "Yes", true),
        option("no", "No"),
      ]),
    ).toMatch("true and false");
    expect(
      choiceProblem("TRUE_FALSE", [
        option("true", "True", true),
        option("false", "False"),
      ]),
    ).toBeNull();
  });
});

describe("whole draft", () => {
  it("accepts a well-formed choice question", () => {
    expect(questionProblem(draft())).toBeNull();
  });
  it("reports missing text and topic first", () => {
    expect(questionProblem(draft({ questionText: " " }))).toMatch(
      "question text",
    );
    expect(questionProblem(draft({ topic: "" }))).toMatch("topic");
  });
  it("carries the ordering failure through the composite check", () => {
    expect(
      questionProblem(
        draft({
          questionType: "ORDERING",
          options: [option("A"), option("B")],
          order: "Alpha, Beta",
        }),
      ),
    ).toMatch("Not an option label");
  });
  it("requires accepted answers for fill in the blank only", () => {
    expect(
      questionProblem(draft({ questionType: "FILL_BLANK", options: [] })),
    ).toMatch("accepted answer");
    expect(
      questionProblem(
        draft({ questionType: "FILL_BLANK", options: [], accepted: "four" }),
      ),
    ).toBeNull();
    expect(
      questionProblem(draft({ questionType: "ESSAY", options: [] })),
    ).toBeNull();
  });
});
