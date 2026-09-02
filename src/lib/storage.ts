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
