import { describe, expect, it } from "vitest";
import {
  OperationCommands,
  PendingCommandError,
  type CommandStorage,
} from "./operation-command";

function fakeStorage(): CommandStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe("operation retries", () => {
  it("reuses the command and reviewed revision after a lost response and board refresh", async () => {
    const commands = new OperationCommands(fakeStorage());
    const sent: Record<string, unknown>[] = [];
    const send = async (body: Record<string, unknown>) => {
      sent.push(body);
      if (sent.length === 1) throw new Error("Response lost");
      return { duplicate: true };
    };
    await expect(
      commands.run(
        "intervene:a1",
        { action: "EXTRA_TIME", minutes: 10, expectedRevision: 0 },
        send,
      ),
    ).rejects.toThrow();
    await commands.run(
      "intervene:a1",
      { action: "EXTRA_TIME", minutes: 10, expectedRevision: 1 },
      send,
    );
    expect(sent[1]).toEqual(sent[0]);
    expect(sent[1].expectedRevision).toBe(0);
    await commands.run(
      "intervene:a1",
      { action: "EXTRA_TIME", minutes: 10, expectedRevision: 1 },
      send,
    );
    expect(sent[2].idempotencyKey).not.toBe(sent[0].idempotencyKey);
  });
  it("blocks a changed command while the original outcome is unknown", async () => {
    const commands = new OperationCommands(fakeStorage());
    await expect(
      commands.run("sitting:e1:draft", { name: "A" }, async () => {
        throw new Error("timeout");
      }),
    ).rejects.toThrow();
    await expect(
      commands.run("sitting:e1:draft", { name: "B" }, async () => true),
    ).rejects.toThrow(PendingCommandError);
  });
  it("keeps the original key across a reload so a retry cannot grant twice", async () => {
    const storage = fakeStorage();
    const first = new OperationCommands(storage);
    let body: Record<string, unknown> | undefined;
    await expect(
      first.run(
        "intervene:a1",
        { action: "EXTRA_TIME", minutes: 10, expectedRevision: 0 },
        async (payload) => {
          body = payload;
          throw new Error("Response lost");
        },
      ),
    ).rejects.toThrow();
    // A reload builds a new instance from the same tab storage.
    const reloaded = new OperationCommands(storage);
    let retried: Record<string, unknown> | undefined;
    await reloaded.run(
      "intervene:a1",
      { action: "EXTRA_TIME", minutes: 10, expectedRevision: 7 },
      async (payload) => {
        retried = payload;
        return { duplicate: true };
      },
    );
    expect(retried).toEqual(body);
    expect(retried!.idempotencyKey).toBe(body!.idempotencyKey);
    expect(retried!.expectedRevision).toBe(0);
  });
  it("clears a settled command from storage so the next command is fresh", async () => {
    const storage = fakeStorage();
    const commands = new OperationCommands(storage);
    await commands.run("intervene:a1", { action: "PAUSE" }, async () => true);
    expect(new OperationCommands(storage).blocked("intervene:a1")).toBe(false);
  });
  it("releases the slot when validation rejects the command outright", async () => {
    const storage = fakeStorage();
    const commands = new OperationCommands(storage);
    await expect(
      commands.run("intervene:a1", { action: "PAUSE" }, async () => {
        throw {
          response: { status: 400, data: { status: "error" } },
        };
      }),
    ).rejects.toBeTruthy();
    expect(commands.blocked("intervene:a1")).toBe(false);
    expect(new OperationCommands(storage).blocked("intervene:a1")).toBe(false);
  });
  it.each([401, 403, 404, 409])(
    "retains an ambiguous command after HTTP %s",
    async (status) => {
      const storage = fakeStorage();
      const commands = new OperationCommands(storage, "tenant:user");
      await expect(
        commands.run("intervene:a1", { action: "PAUSE" }, async () => {
          throw { response: { status, data: { status: "error" } } };
        }),
      ).rejects.toBeTruthy();
      expect(commands.blocked("intervene:a1")).toBe(true);
      expect(commands.body("intervene:a1")?.action).toBe("PAUSE");
    },
  );
  it("allows an officer to recover from a retained concurrency rejection", async () => {
    const commands = new OperationCommands(fakeStorage(), "tenant:user");
    await expect(
      commands.run(
        "intervene:a1",
        { action: "PAUSE", expectedRevision: 5 },
        async () => {
          throw { response: { status: 409, data: { status: "error" } } };
        },
      ),
    ).rejects.toBeTruthy();
    expect(commands.blocked("intervene:a1")).toBe(true);
    commands.discard("intervene:a1");
    let sent: Record<string, unknown> | undefined;
    await commands.run(
      "intervene:a1",
      { action: "PAUSE", expectedRevision: 6 },
      async (body) => {
        sent = body;
        return true;
      },
    );
    expect(sent?.expectedRevision).toBe(6);
  });
  it("isolates pending commands by tenant and officer", async () => {
    const storage = fakeStorage();
    const first = new OperationCommands(storage, "tenant-a:user-a");
    await expect(
      first.run("intervene:a1", { action: "PAUSE" }, async () => {
        throw new Error("timeout");
      }),
    ).rejects.toThrow();
    expect(
      new OperationCommands(storage, "tenant-a:user-a").blocked("intervene:a1"),
    ).toBe(true);
    expect(
      new OperationCommands(storage, "tenant-a:user-b").blocked("intervene:a1"),
    ).toBe(false);
    expect(
      new OperationCommands(storage, "tenant-b:user-a").blocked("intervene:a1"),
    ).toBe(false);
  });
  it("keeps independent creates on separate slots unblocked", async () => {
    const commands = new OperationCommands(fakeStorage());
    await expect(
      commands.run("incident:e1:draft-1", { childId: "c1" }, async () => {
        throw new Error("timeout");
      }),
    ).rejects.toThrow();
    await expect(
      commands.run("incident:e1:draft-2", { childId: "c2" }, async () => true),
    ).resolves.toBe(true);
  });
  it("lets an officer discard a command after checking the audit trail", async () => {
    const storage = fakeStorage();
    const commands = new OperationCommands(storage);
    await expect(
      commands.run("intervene:a1", { action: "PAUSE" }, async () => {
        throw new Error("timeout");
      }),
    ).rejects.toThrow();
    expect(commands.blocked("intervene:a1")).toBe(true);
    commands.discard("intervene:a1");
    expect(commands.blocked("intervene:a1")).toBe(false);
    expect(new OperationCommands(storage).blocked("intervene:a1")).toBe(false);
    await expect(
      commands.run("intervene:a1", { action: "RESUME" }, async () => true),
    ).resolves.toBe(true);
  });
  it("survives unreadable stored history without blocking every slot", async () => {
    const storage = fakeStorage();
    storage.data.set("cbt-operation-commands:anonymous", "{not json");
    const commands = new OperationCommands(storage);
    expect(commands.blocked("intervene:a1")).toBe(false);
    await expect(
      commands.run("intervene:a1", { action: "PAUSE" }, async () => true),
    ).resolves.toBe(true);
  });
  it("works when the browser denies storage entirely", async () => {
    const denied: CommandStorage = {
      getItem: () => {
        throw new Error("Storage disabled");
      },
      setItem: () => {
        throw new Error("Storage disabled");
      },
    };
    const commands = new OperationCommands(denied);
    await expect(
      commands.run("intervene:a1", { action: "PAUSE" }, async () => {
        throw new Error("timeout");
      }),
    ).rejects.toThrow();
    // In-memory retention still protects the current page.
    expect(commands.blocked("intervene:a1")).toBe(true);
  });
});
