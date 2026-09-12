import type { Session } from "./types";
let opened: Promise<IDBDatabase> | undefined;
function database() {
  if (!opened)
    opened = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("classfun-student-cbt", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("sessions", { keyPath: "key" });
      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          opened = undefined;
        };
        resolve(request.result);
      };
      request.onerror = () => {
        opened = undefined;
        reject(request.error);
      };
      request.onblocked = () => {
        opened = undefined;
        reject(new Error("Close other Classfun exam tabs and try again."));
      };
    });
  return opened;
}
export async function readSession(key: string): Promise<Session | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sessions", "readonly");
    const req = tx.objectStore("sessions").get(key);
    tx.oncomplete = () => resolve(req.result);
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
}
/** Sequence allocation and event persistence share one committed IndexedDB transaction. */
export async function mutateSession(
  key: string,
  update: (current: Session | undefined) => Session,
): Promise<Session> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sessions", "readwrite", {
      durability: "strict",
    });
    const store = tx.objectStore("sessions");
    const req = store.get(key);
    let result: Session;
    let failure: unknown;
    req.onsuccess = () => {
      try {
        result = update(req.result);
        store.put(result);
      } catch (e) {
        failure = e;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve(result);
    tx.onabort = () =>
      reject(
        failure ?? tx.error ?? new Error("Could not save on this device."),
      );
    tx.onerror = () => reject(tx.error);
  });
}
