const STORAGE_KEY = "cbt-operation-commands";
type Command = { fingerprint: string; body: Record<string, unknown> };
/** Structurally satisfied by sessionStorage; narrowed so tests can supply a fake. */
export interface CommandStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
/** Raised when a slot still holds a command whose outcome was never established. */
export class PendingCommandError extends Error {
  slot: string;
  constructor(slot: string) {
    super(
      "The previous request has an unknown outcome. Retry its original values, or check the audit trail and discard it before starting another command.",
    );
    this.slot = slot;
  }
}
function sessionStore(): CommandStorage | undefined {
  try {
    return globalThis.sessionStorage ?? undefined;
  } catch {
    return undefined;
  }
}
/**
 * Retain the exact payload after an ambiguous response, including its revision.
 * Pending commands outlive a reload: without that, reloading after a lost
 * response issues a fresh key and grants a second intervention.
 */
export class OperationCommands {
  private pending = new Map<string, Command>();
  private store?: CommandStorage;

  private storageKey: string;

  constructor(
    store: CommandStorage | undefined = sessionStore(),
    scope = "anonymous",
  ) {
    this.store = store;
    this.storageKey = `${STORAGE_KEY}:${scope}`;
    this.restore();
  }

  private restore() {
    let raw: string | null = null;
    try {
      raw = this.store?.getItem(this.storageKey) ?? null;
    } catch {
      return;
    }
    if (!raw) return;
    try {
      const saved: unknown = JSON.parse(raw);
      if (!saved || typeof saved !== "object") throw new Error("Unusable");
      for (const [slot, command] of Object.entries(
        saved as Record<string, Command>,
      ))
        if (
          command &&
          typeof command.fingerprint === "string" &&
          command.body &&
          typeof command.body === "object"
        )
          this.pending.set(slot, command);
    } catch {
      // Unreadable history cannot be honoured; clear it rather than block every slot.
      this.persist();
    }
  }

  private persist() {
    try {
      this.store?.setItem(
        this.storageKey,
        JSON.stringify(Object.fromEntries(this.pending)),
      );
    } catch {
      // A browser without writable storage still retains commands for this page's lifetime.
    }
  }

  /** Slots hold one in-flight intent each: keep independent creates on separate slots. */
  async run<T>(
    slot: string,
    payload: Record<string, unknown>,
    send: (body: Record<string, unknown>) => Promise<T>,
  ): Promise<T> {
    const { expectedRevision: _revision, ...intent } = payload;
    void _revision;
    const fingerprint = JSON.stringify(intent);
    let command = this.pending.get(slot);
    if (command && command.fingerprint !== fingerprint)
      throw new PendingCommandError(slot);
    if (!command) {
      command = {
        fingerprint,
        body: structuredClone({
          ...payload,
          idempotencyKey: crypto.randomUUID(),
        }),
      };
      this.pending.set(slot, command);
      this.persist();
    }
    try {
      const result = await send(command.body);
      this.pending.delete(slot);
      this.persist();
      return result;
    } catch (error) {
      const response = (
        error as { response?: { status: number; data?: { status?: string } } }
      ).response;
      // Validation failures happen before a command can commit. Authorization,
      // ownership and conflict responses can be produced by a later replay, so
      // they do not establish the outcome of the original request.
      if (
        response &&
        [400, 422].includes(response.status) &&
        response.data?.status === "error"
      ) {
        this.pending.delete(slot);
        this.persist();
      }
      throw error;
    }
  }

  blocked(slot: string) {
    return this.pending.has(slot);
  }

  body(slot: string) {
    const body = this.pending.get(slot)?.body;
    return body ? structuredClone(body) : undefined;
  }

  /** Deliberate release after an officer has confirmed the outcome in the audit trail. */
  discard(slot: string) {
    this.pending.delete(slot);
    this.persist();
  }
}
