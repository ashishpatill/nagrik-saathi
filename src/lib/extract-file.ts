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

export async function extractFileText(file: File): Promise<string> {
  if (file.type === "text/plain" || /\.(txt|md)$/i.test(file.name)) return file.text();
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
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
  throw new Error("For image notices, paste the text after OCR. PDF and plain-text files are supported.");
}
