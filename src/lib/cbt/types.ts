export type Value = string | string[] | Record<string, string> | null;
export interface Identity {
  tenantId: string;
  examId: string;
  studentId: string;
  deviceId: string;
}
export interface Question {
  id: string;
  position: number;
  sectionPosition: number;
  marks: number;
  availableFrom: string;
  expiresAt: string;
  questionType: string;
  questionText: string;
  topic: string;
  sectionName: string;
  navigationMode: string;
  options: { key: string; content: string }[];
  matchingTargets?: string[];
}
export interface Answer {
  attemptQuestionId: string;
  value: Value;
  flagged: boolean;
  clientSequence: number;
  sessionRevision: number;
  savedAt?: string;
}
export interface Attempt {
  pausedAt?: string | null;
  result?: {
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
  } | null;
  id: string;
  examId: string;
  status: string;
  attemptNumber: number;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  serverTime: string;
  remainingSeconds: number;
  answerRevision: number;
  lastClientSequence?: number;
  sessionRevision: number;
  currentPosition: number;
  configuration: {
    name: string;
    instructions: string;
    navigationMode: string;
    allowReview: boolean;
  };
  questions: Question[];
  navigator: Pick<
    Question,
    "id" | "position" | "sectionPosition" | "availableFrom" | "expiresAt"
  >[];
  answers: Answer[];
}
export interface Info {
  examId: string;
  name: string;
  instructions: string;
  durationMinutes: number;
  totalMarks: number;
  startsAt: string;
  endsAt: string;
  serverTime: string;
  status: string;
}
export interface Event {
  attemptQuestionId: string;
  idempotencyKey: string;
  clientSequence: number;
  value: Value;
  flagged: boolean;
  clientTimestamp: string;
}
export interface Rejected {
  event: Event;
  reason: string;
  attemptId: string;
}
export interface Session {
  key: string;
  identity: Identity;
  accessToken: string;
  attemptToken: string;
  info?: Info;
  attempt?: Attempt;
  sequence: number;
  selectedQuestionId?: string;
  pending: Event[];
  rejected: Rejected[];
}
export interface Ack {
  eventId: string;
  disposition: string;
  duplicate: boolean;
  answerRevision: number;
  status: string;
  serverTime: string;
}
export function sessionKey(
  i: Pick<Identity, "tenantId" | "examId" | "studentId">,
) {
  return `${i.tenantId}:${i.examId}:${i.studentId}`;
}
export function answered(value: Value | undefined) {
  return (
    value != null &&
    (typeof value === "string"
      ? value.trim().length > 0
      : Array.isArray(value)
        ? value.length > 0
        : Object.keys(value).length > 0)
  );
}
export function effectiveAnswers(
  s: Session,
): Map<string, Pick<Answer, "value" | "flagged">> {
  const result = new Map<string, Pick<Answer, "value" | "flagged">>(
    (s.attempt?.answers ?? []).map((a) => [a.attemptQuestionId, a]),
  );
  for (const e of s.pending)
    result.set(e.attemptQuestionId, { value: e.value, flagged: e.flagged });
  return result;
}
