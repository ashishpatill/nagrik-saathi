"use client";

import * as pdfjsLib from "pdfjs-dist";

let workerConfigured = false;

function ensurePdfWorker() {
  if (workerConfigured || typeof window === "undefined") return;
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  workerConfigured = true;
}

function isTextFile(file: File): boolean {
  return file.type === "text/plain" || file.type === "text/markdown" || /\.(txt|md)$/i.test(file.name);
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);
}

export const ACCEPTED_NOTICE_FILES = ".txt,.md,.pdf,image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp";

export type LoadedNoticeFile = {
  text: string;
  fileName: string;
  kind: "text" | "pdf" | "image";
  imageUrl: string | null;
};

async function extractPdfText(file: File): Promise<string> {
  ensurePdfWorker();
  const data = await file.arrayBuffer();
  const document = await pdfjsLib.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return pages.join("\n").trim();
}

/** Read a citizen notice file locally. Images return a preview URL; paste visible text into the box. */
export async function loadNoticeFile(file: File): Promise<LoadedNoticeFile> {
  if (isTextFile(file)) {
    return { text: await file.text(), fileName: file.name, kind: "text", imageUrl: null };
  }
  if (isPdfFile(file)) {
    const text = await extractPdfText(file);
    if (!text) {
      throw new Error("No selectable text found in this PDF. Try a photo of the notice, or paste the text.");
    }
    return { text, fileName: file.name, kind: "pdf", imageUrl: null };
  }
  if (isImageFile(file)) {
    const imageUrl = URL.createObjectURL(file);
    return {
      text: "",
      fileName: file.name,
      kind: "image",
      imageUrl,
    };
  }
  throw new Error("Attach a PDF, text file (.txt), or photo (JPG/PNG/WebP) of the notice.");
}

/** @deprecated use loadNoticeFile — kept for call sites that only need text from PDF/TXT */
export async function extractFileText(file: File): Promise<string> {
  const loaded = await loadNoticeFile(file);
  if (loaded.kind === "image") {
    throw new Error("Photo attached. Type or paste the text you can read from the photo, then Analyze.");
  }
  return loaded.text;
}
