"use client";

import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";

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

export const ACCEPTED_NOTICE_FILES =
  ".txt,.md,.pdf,image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif";

export type LoadedNoticeFile = {
  text: string;
  fileName: string;
  kind: "text" | "pdf" | "image";
  imageUrl: string | null;
  ocrUsed: boolean;
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

/** On-device OCR — file never leaves the browser. */
export async function extractImageText(file: File): Promise<string> {
  const result = await Tesseract.recognize(file, "eng", {
    logger: () => undefined,
  });
  return result.data.text.replace(/\u000c/g, "\n").trim();
}

/** Read a citizen notice file locally (PDF/TXT extract or photo OCR). */
export async function loadNoticeFile(file: File): Promise<LoadedNoticeFile> {
  if (isTextFile(file)) {
    return { text: await file.text(), fileName: file.name, kind: "text", imageUrl: null, ocrUsed: false };
  }
  if (isPdfFile(file)) {
    const text = await extractPdfText(file);
    if (!text) {
      throw new Error(
        "No selectable text found in this PDF. Attach a clear photo of the notice instead, or paste the text.",
      );
    }
    return { text, fileName: file.name, kind: "pdf", imageUrl: null, ocrUsed: false };
  }
  if (isImageFile(file)) {
    const imageUrl = URL.createObjectURL(file);
    try {
      const text = await extractImageText(file);
      if (!text || text.length < 8) {
        throw new Error(
          "Could not read enough text from this photo. Try a clearer image, or type the text into the box.",
        );
      }
      return { text, fileName: file.name, kind: "image", imageUrl, ocrUsed: true };
    } catch (error) {
      if (error instanceof Error && error.message.includes("Could not read enough")) {
        return { text: "", fileName: file.name, kind: "image", imageUrl, ocrUsed: false };
      }
      URL.revokeObjectURL(imageUrl);
      throw error instanceof Error
        ? error
        : new Error("Photo OCR failed. Try again or paste the notice text.");
    }
  }
  throw new Error("Attach a PDF, text file (.txt), or photo (JPG/PNG/WebP) of the notice.");
}

export async function extractFileText(file: File): Promise<string> {
  const loaded = await loadNoticeFile(file);
  if (loaded.kind === "image" && !loaded.text.trim()) {
    throw new Error("Photo attached but OCR found little text. Type or paste the notice, then Analyze.");
  }
  return loaded.text;
}
