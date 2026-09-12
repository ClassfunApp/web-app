import { afterEach, describe, expect, it, vi } from "vitest";
import { examApi, ExamApiError, ExamTransportError } from "./api";

afterEach(() => vi.unstubAllGlobals());
describe("student response classification", () => {
  it.each([400, 409, 502, 504])(
    "retains non-JSON HTTP %s as a transport failure",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response("<html>Proxy error</html>", {
            status,
            headers: { "content-type": "text/html" },
          }),
        ),
      );
      const error = await examApi("/attempts/a").catch((e) => e);
      expect(error).toBeInstanceOf(ExamTransportError);
      expect(error).not.toBeInstanceOf(ExamApiError);
      expect((error as ExamTransportError).status).toBe(status);
    },
  );
  it("retains authoritative JSON rejection status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Sequence conflict" }), {
          status: 409,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    await expect(examApi("/attempts/a")).rejects.toBeInstanceOf(ExamApiError);
  });
});
