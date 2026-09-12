import { describe, expect, it, vi } from "vitest";
import { drainPages } from "./paging";

const rows = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => from + i);

describe("draining paged lists", () => {
  it("walks every page and reports the offsets it asked for", async () => {
    const asked: number[] = [];
    const result = await drainPages<number>(async (offset, limit) => {
      asked.push(offset);
      return { data: rows(offset, Math.min(limit, 250 - offset)), total: 250 };
    }, 100);
    expect(asked).toEqual([0, 100, 200]);
    expect(result.total).toBe(250);
    expect(result.data).toHaveLength(250);
    expect(result.data[249]).toBe(249);
  });
  it("stops on an exact page boundary without an extra request", async () => {
    const fetchPage = vi.fn(async (offset: number, limit: number) => ({
      data: rows(offset, Math.min(limit, 200 - offset)),
      total: 200,
    }));
    const result = await drainPages<number>(fetchPage, 100);
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(result.data).toHaveLength(200);
  });
  it("stops when a page comes back empty despite a larger total", async () => {
    // Guards the spin a disagreeing total would otherwise cause.
    const fetchPage = vi.fn(async () => ({ data: [], total: 999 }));
    const result = await drainPages<number>(fetchPage, 100);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual([]);
  });
  it("handles an empty list and a missing total", async () => {
    await expect(
      drainPages<number>(async () => ({ data: [], total: 0 })),
    ).resolves.toEqual({ data: [], total: 0 });
    await expect(
      drainPages<number>(
        async () =>
          ({ data: [] }) as unknown as { data: number[]; total: number },
      ),
    ).resolves.toEqual({ data: [], total: 0 });
  });
  it("surfaces a failing page rather than returning a partial list", async () => {
    await expect(
      drainPages<number>(async (offset) => {
        if (offset) throw new Error("Network down");
        return { data: rows(0, 100), total: 250 };
      }, 100),
    ).rejects.toThrow("Network down");
  });
});
