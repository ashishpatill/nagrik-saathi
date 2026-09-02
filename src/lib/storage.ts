import type { DocumentAnalysis } from "@/lib/types";

const DB_NAME = "nagrik-saathi";
const STORE = "cases";

export async function saveCase(doc: DocumentAnalysis): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(doc);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

export async function getCase(id: string): Promise<DocumentAnalysis | null> {
  if (typeof indexedDB === "undefined") return null;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction(STORE, "readonly");
      const getRequest = transaction.objectStore(STORE).get(id);
      getRequest.onsuccess = () => resolve((getRequest.result as DocumentAnalysis | undefined) ?? null);
      getRequest.onerror = () => reject(getRequest.error);
    };
  });
}
