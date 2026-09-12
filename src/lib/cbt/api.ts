// Isolated from staff Axios interceptors: failed requests never clear staff tokens or redirect an exam.
export class ExamApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export type RequestApi = <T>(
  path: string,
  token?: string,
  body?: unknown,
) => Promise<T>;
export const examApi: RequestApi = async <T>(
  path: string,
  token?: string,
  body?: unknown,
): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const base = (import.meta.env.VITE_API_BASE_URL || "/api/").replace(
      /\/$/,
      "",
    );
    const response = await fetch(`${base}/cbt/student${path}`, {
      method: body === undefined ? "GET" : "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let result;
    try {
      if (!response.headers.get("content-type")?.includes("application/json"))
        throw new Error("Unexpected response");
      result = await response.json();
      if (!result || typeof result !== "object")
        throw new Error("Invalid response");
    } catch {
      // A proxy response is not an authoritative rejection of an answer event.
      throw new ExamTransportError(
        response.status,
        "The exam server returned an unreadable response. Saved answers will retry.",
      );
    }
    if (!response.ok)
      throw new ExamApiError(
        response.status,
        result.message || "Exam request failed.",
      );
    return result.data as T;
  } finally {
    clearTimeout(timer);
  }
};
export class ExamTransportError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
