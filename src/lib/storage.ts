import type { DocumentAnalysis } from "@/lib/types";

const DB_NAME = "nagrik-saathi";
const STORE = "cases";
const ACTIVE_KEY = "nagrik-saathi-active-case";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function saveCase(doc: DocumentAnalysis): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  if (doc.id === "empty") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(doc);
    transaction.oncomplete = () => {
      try {
        window.localStorage.setItem(ACTIVE_KEY, doc.id);
      } catch {
        // Ignore quota / private-mode failures.
      }
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getCase(id: string): Promise<DocumentAnalysis | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readonly");
    const getRequest = transaction.objectStore(STORE).get(id);
    getRequest.onsuccess = () => resolve((getRequest.result as DocumentAnalysis | undefined) ?? null);
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function getActiveCase(): Promise<DocumentAnalysis | null> {
  if (typeof window === "undefined") return null;
  let id: string | null = null;
  try {
    id = window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
  if (!id || id === "empty" || id.startsWith("sample-")) return null;
  return getCase(id);
}

export async function clearActiveCase(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // Ignore.
  }
}

export async function listCases(): Promise<DocumentAnalysis[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readonly");
    const request = transaction.objectStore(STORE).getAll();
    request.onsuccess = () =>
      resolve(
        (request.result as DocumentAnalysis[]).filter(
          (doc) => doc.id !== "empty",
        ),
      );
    request.onerror = () => reject(request.error);
  });
}

/**
 * Restore cases from a validated encrypted backup. Existing cases with the
 * same ID are replaced, which makes re-importing the same file idempotent.
 * Restoring is an explicit action, so the first imported case becomes active;
 * other saved cases are left in place.
 */
export async function importCases(
  cases: readonly DocumentAnalysis[],
): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;

  const unique = new Map<string, DocumentAnalysis>();
  for (const doc of cases) {
    if (doc.id && doc.id !== "empty") unique.set(doc.id, doc);
  }
  const imported = [...unique.values()];
  if (imported.length === 0) return 0;

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    const store = transaction.objectStore(STORE);
    for (const doc of imported) store.put(doc);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  try {
    window.localStorage.setItem(ACTIVE_KEY, imported[0].id);
  } catch {
    // Ignore quota / private-mode failures.
  }

  return imported.length;
}

/**
 * Delete every saved case and the active-case pointer. Preferences and the
 * public portal-status cache are not case data and are left untouched.
 */
export async function deleteAllCases(): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;
  const db = await openDb();

  const count = await new Promise<number>((resolve, reject) => {
    const transaction = db.transaction(STORE, "readonly");
    const request = transaction.objectStore(STORE).count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  try {
    window.localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // Ignore.
  }

  return count;
}
