import { SAMPLE_CASE } from "@/data/sample-case";
import type { DocumentAnalysis, Language } from "@/lib/types";

export function analyzeText(sourceText: string, language: Language = "en"): DocumentAnalysis {
  const text = sourceText.trim();
  const amount = text.match(/₹\s?([\d,]+)/)?.[1]?.replaceAll(",", "");
  const date = text.match(/(\d{1,2})\s?(September|सेप्टेंबर|सितंबर)\s?(\d{4})/i);
  const deadlineDate = date
    ? `${date[3]}-09-${date[1].padStart(2, "0")}`
    : text.match(/\b(202\d-\d\d-\d\d)\b/)?.[1] ?? null;
  const referenceNumber = text.match(/(?:consumer number|ग्राहक क्रमांक)\s*([A-Z0-9-]+)/i)?.[1] ?? "Not found";
  const looksLikeSample = /sample/i.test(text);
  const preferredLabel = language === "mr" ? "मराठी" : language === "hi" ? "हिन्दी" : "English";
  const base: DocumentAnalysis = {
    ...SAMPLE_CASE,
    id: `case-${Date.now()}`,
    fileName: "pasted-notice.txt",
    sourceText: text,
    amountDue: amount ? Number(amount) : null,
    deadlineDate,
    referenceNumber,
    scamRiskScore: /\b(otp|upi|password|pin)\b/i.test(text) ? "suspicious" : "safe",
    riskReason: looksLikeSample
      ? SAMPLE_CASE.riskReason
      : `Heuristic review only (${preferredLabel} preferred). Confirm the issuer and destination using a printed source.`,
  };
  return base;
}

export function getSampleText() {
  return SAMPLE_CASE.sourceText;
}
