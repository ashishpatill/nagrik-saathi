import { buildChecklistHtml } from "@/lib/agent/checklist";
import type { AgentTool, AgentToolRuntime } from "@/lib/agent/types";
import { buildIcs, icsDataUrl } from "@/lib/calendar";
import { actionsForCase, analyzeText, hasAnalyzedNotice } from "@/lib/extract";
import { noticeDisclaimer } from "@/lib/i18n/disclaimer";
import { draftCitizenLetter } from "@/lib/i18n/letter";
import { requiredDocumentsForCase } from "@/lib/i18n/notice";
import type { Language } from "@/lib/languages";
import { findOfficialPortal, verifyPortalUrl } from "@/lib/portals";
import { redactSensitiveData, scamSignals } from "@/lib/safety";
import {
  analyzeSchema,
  letterSchema,
  languageSchema,
  portalSchema,
  redactSchema,
  reminderSchema,
  toJsonSchema,
  verifyUrlSchema,
} from "@/lib/webmcp/schemas";
import type { DocumentAnalysis } from "@/lib/types";

type CaseInput = { language: Language; sourceText?: string };

/**
 * Resolve the case for a tool call. If the caller supplied `sourceText`, analyze
 * it locally and persist it in the workspace. Otherwise use the current case,
 * re-running the extractor so old saved cases pick up fixes.
 */
function resolveCase(input: CaseInput, runtime: AgentToolRuntime): DocumentAnalysis {
  if (input.sourceText) {
    const next = analyzeText(input.sourceText, input.language);
    runtime.setCase(next);
    return next;
  }

  const current = runtime.getCase();
  if (!hasAnalyzedNotice(current)) {
    throw new Error(
      "No analyzed notice is available. Supply sourceText in the tool call, or analyze a notice in the workspace first.",
    );
  }

  const refreshed = {
    ...analyzeText(current.sourceText, input.language),
    id: current.id,
    fileName: current.fileName,
  };
  runtime.setCase(refreshed);
  return refreshed;
}

const BRIEF_HEADINGS: Record<Language, { nextSteps: string; documents: string }> = {
  en: { nextSteps: "What to do next", documents: "Keep these documents nearby" },
  hi: { nextSteps: "आगे क्या करें", documents: "ये दस्तावेज़ पास रखें" },
  mr: { nextSteps: "पुढे काय करावे", documents: "ही कागदपत्रे जवळ ठेवा" },
  ta: { nextSteps: "அடுத்து என்ன செய்ய வேண்டும்", documents: "இந்த ஆவணங்களை அருகில் வைத்திருங்கள்" },
  kn: { nextSteps: "ಮುಂದೆ ಏನು ಮಾಡಬೇಕು", documents: "ಈ ದಾಖಲೆಗಳನ್ನು ಹತ್ತಿರ ಇಟ್ಟುಕೊಳ್ಳಿ" },
  gu: { nextSteps: "આગળ શું કરવું", documents: "આ દસ્તાવેજો નજીક રાખો" },
  te: { nextSteps: "తర్వాత ఏమి చేయాలి", documents: "ఈ పత్రాలను దగ్గర ఉంచుకోండి" },
  bn: { nextSteps: "এরপর কী করবেন", documents: "এই নথিগুলো কাছে রাখুন" },
};

function defineTool(tool: Omit<AgentTool, "inputSchema">): AgentTool {
  return { ...tool, inputSchema: toJsonSchema(tool.schema) };
}

/**
 * The single source of truth for every agent-facing capability. The WebMCP
 * runtime, the playground, and the MCP server all call this function. No tool
 * accepts a model-supplied destination URL; portal results come from the
 * reviewed registry only.
 */
export function createAgentTools(): AgentTool[] {
  return [
    defineTool({
      name: "get_notice_summary",
      title: "Notice summary",
      description:
        "Read the current notice summary in English, Hindi, Marathi, Tamil, Kannada, Gujarati, Telugu, or Bengali. Supply sourceText for a stateless call.",
      trustLevel: "untrusted-content",
      maxFrequency: "30/min",
      untrustedContentHint: true,
      requiresApproval: false,
      requiresCase: true,
      mcpExposed: true,
      schema: languageSchema,
      exampleInput: { language: "en" },
      maxResultChars: 1400,
      execute: async (raw, runtime) => {
        const input = languageSchema.parse(raw) as CaseInput;
        const current = resolveCase(input, runtime);
        return {
          documentType: current.documentType,
          issuer: current.issuer,
          referenceNumber: current.referenceNumber,
          deadline: current.deadlineDate,
          amountDue: current.amountDue,
          urgency: current.urgency,
          scamStatus: current.scamRiskScore,
          summary: current.summary[input.language],
          actions: actionsForCase(current, input.language),
          requiredDocuments: requiredDocumentsForCase(current.documentType, input.language),
          disclaimer: noticeDisclaimer(input.language),
          boundary: "Guidance only. Verify with the issuer or a reviewed official portal.",
        };
      },
    }),

    defineTool({
      name: "find_official_portal",
      title: "Find official portal",
      description:
        "Find a reviewed official portal and helpline for a department, service, and state. Only registry entries are returned.",
      trustLevel: "read-only",
      maxFrequency: "30/min",
      untrustedContentHint: false,
      requiresApproval: false,
      requiresCase: false,
      mcpExposed: true,
      schema: portalSchema,
      exampleInput: { department: "MSEDCL", service: "bill_payment", state: "Maharashtra" },
      maxResultChars: 1400,
      execute: async (raw) => {
        const args = portalSchema.parse(raw);
        return findOfficialPortal(args.department, args.service, args.state);
      },
    }),

    defineTool({
      name: "check_scam_signals",
      title: "Check scam signals",
      description:
        "Check the current notice for common scam signals and safe next steps. This is a heuristic review, not a fraud verdict.",
      trustLevel: "untrusted-content",
      maxFrequency: "30/min",
      untrustedContentHint: true,
      requiresApproval: false,
      requiresCase: true,
      mcpExposed: true,
      schema: languageSchema,
      exampleInput: { language: "en" },
      maxResultChars: 5000,
      execute: async (raw, runtime) => {
        const input = languageSchema.parse(raw) as CaseInput;
        return scamSignals(resolveCase(input, runtime));
      },
    }),

    defineTool({
      name: "analyze_notice",
      title: "Analyze notice",
      description:
        "Analyze supplied notice text and update the current workspace case. This app does not use sample notices.",
      trustLevel: "untrusted-content",
      maxFrequency: "12/min",
      untrustedContentHint: true,
      requiresApproval: false,
      requiresCase: false,
      mcpExposed: true,
      schema: analyzeSchema,
      exampleInput: { sourceText: "", language: "en" },
      maxResultChars: 1400,
      execute: async (raw, runtime) => {
        const args = analyzeSchema.parse(raw);
        if (!args.sourceText.trim()) {
          throw new Error(
            "Provide notice text in sourceText. This app does not use sample notices.",
          );
        }
        const next = analyzeText(args.sourceText, args.language);
        runtime.setCase(next);
        return {
          status: "analyzed",
          caseId: next.id,
          documentType: next.documentType,
          issuer: next.issuer,
          deadline: next.deadlineDate,
          amountDue: next.amountDue,
          risk: next.scamRiskScore,
          boundary: "Guidance only. Confirm the issuer and destination before you act.",
        };
      },
    }),

    defineTool({
      name: "create_action_plan",
      title: "Create action plan",
      description:
        "Create a safe checklist and required-document list for the current notice, in one of the eight supported languages.",
      trustLevel: "untrusted-content",
      maxFrequency: "30/min",
      untrustedContentHint: true,
      requiresApproval: false,
      requiresCase: true,
      mcpExposed: true,
      schema: languageSchema,
      exampleInput: { language: "en" },
      maxResultChars: 1800,
      execute: async (raw, runtime) => {
        const input = languageSchema.parse(raw) as CaseInput;
        const current = resolveCase(input, runtime);
        return {
          status: "ready",
          language: input.language,
          checklist: actionsForCase(current, input.language),
          requiredDocuments: requiredDocumentsForCase(current.documentType, input.language),
          boundary:
            "The app does not make payments, submit forms, or contact officials. Complete those actions yourself on the official portal.",
        };
      },
    }),

    defineTool({
      name: "schedule_reminder",
      title: "Schedule reminder",
      description:
        "Create a calendar reminder after explicit user approval. Returns an ICS file and a data URL; it does not add anything silently.",
      trustLevel: "side-effect",
      maxFrequency: "10/hour",
      untrustedContentHint: false,
      requiresApproval: true,
      requiresCase: false,
      mcpExposed: false,
      schema: reminderSchema,
      exampleInput: { title: "Review notice deadline", date: "2026-12-31" },
      maxResultChars: 4000,
      execute: async (raw, runtime) => {
        const args = reminderSchema.parse(raw);
        const approved = await runtime.requestApproval("Schedule calendar reminder", args);
        if (!approved) return { status: "cancelled_by_user", reason: "User denied the reminder." };
        const ics = buildIcs(args.title, args.date);
        return {
          status: "success",
          title: args.title,
          date: args.date,
          ics,
          calendarLink: icsDataUrl(ics),
          boundary: "The calendar entry is created on your device only after approval.",
        };
      },
    }),

    defineTool({
      name: "export_family_brief",
      title: "Export family brief",
      description:
        "Export a redacted one-page family brief after explicit user approval. Identifiers are redacted before the file is produced.",
      trustLevel: "side-effect",
      maxFrequency: "10/hour",
      untrustedContentHint: true,
      requiresApproval: true,
      requiresCase: true,
      mcpExposed: false,
      schema: languageSchema,
      exampleInput: { language: "en" },
      maxResultChars: 6000,
      execute: async (raw, runtime) => {
        const input = languageSchema.parse(raw) as CaseInput;
        const current = resolveCase(input, runtime);
        const headings = BRIEF_HEADINGS[input.language];
        const brief = [
          current.summary[input.language],
          "",
          `## ${headings.nextSteps}`,
          ...actionsForCase(current, input.language).map((item) => `- ${item}`),
          "",
          `## ${headings.documents}`,
          ...requiredDocumentsForCase(current.documentType, input.language).map(
            (item) => `- ${item}`,
          ),
          "",
          noticeDisclaimer(input.language),
        ].join("\n");
        const redacted = redactSensitiveData(brief);
        const approved = await runtime.requestApproval("Export redacted family brief", {
          language: input.language,
        });
        if (!approved) return { status: "cancelled_by_user" };
        return {
          status: "success",
          language: input.language,
          fileName: `nagrik-saathi-family-brief-${input.language}.txt`,
          mimeType: "text/plain;charset=utf-8",
          content: redacted,
          boundary: "Read it before sharing. Redaction is a safety aid, not a guarantee.",
        };
      },
    }),

    defineTool({
      name: "draft_citizen_letter",
      title: "Draft citizen letter",
      description:
        "Draft a review-only citizen letter in a formal or simple tone. Never sends it; the citizen reviews and submits it themselves.",
      trustLevel: "untrusted-content",
      maxFrequency: "30/min",
      untrustedContentHint: true,
      requiresApproval: false,
      requiresCase: true,
      mcpExposed: true,
      schema: letterSchema,
      exampleInput: { tone: "simple", language: "en" },
      maxResultChars: 6000,
      execute: async (raw, runtime) => {
        const input = letterSchema.parse(raw);
        const current = resolveCase(input as CaseInput, runtime);
        return {
          status: "draft_only",
          tone: input.tone,
          language: input.language,
          content: draftCitizenLetter(current, input.language, input.tone),
          boundary:
            "Review and submit through the official channel yourself. Nagrik Saathi does not send letters or contact officials.",
        };
      },
    }),

    defineTool({
      name: "verify_portal_url",
      title: "Verify portal URL",
      description:
        "Check a URL against the human-reviewed portal registry. Returns the registry URL, never the supplied URL as an official destination.",
      trustLevel: "read-only",
      maxFrequency: "30/min",
      untrustedContentHint: false,
      requiresApproval: false,
      requiresCase: false,
      mcpExposed: true,
      schema: verifyUrlSchema,
      exampleInput: { url: "https://wss.mahadiscom.in/wss/wss" },
      maxResultChars: 1400,
      execute: async (raw) => {
        const args = verifyUrlSchema.parse(raw);
        return {
          status: "checked",
          ...verifyPortalUrl(args.url),
          boundary:
            "Registry verification checks the hostname and reviewed path. It does not prove the page is live, safe, or free of third-party content.",
        };
      },
    }),

    defineTool({
      name: "redact_pii",
      title: "Redact personal identifiers",
      description:
        "Redact Aadhaar-like, PAN, payment-card, and long account-like numbers locally before sharing text. Pattern-based, not a guarantee.",
      trustLevel: "read-only",
      maxFrequency: "30/min",
      untrustedContentHint: true,
      requiresApproval: false,
      requiresCase: false,
      mcpExposed: true,
      schema: redactSchema,
      exampleInput: { text: "Aadhaar 2345 6789 0124 · PAN ABCDE1234F" },
      maxResultChars: null,
      execute: async (raw) => {
        const args = redactSchema.parse(raw);
        const redacted = redactSensitiveData(args.text);
        return {
          status: "redacted",
          text: redacted,
          changed: redacted !== args.text,
          redactions: (redacted.match(/\[redacted\]/g) ?? []).length,
          boundary:
            "Local pattern-based redaction. Review the result before sharing; it cannot guarantee every identifier is removed.",
        };
      },
    }),

    defineTool({
      name: "translate_brief",
      title: "Localize notice brief",
      description:
        "Produce the notice brief, checklist, and document list in one of the eight supported languages using reviewed language templates. Not machine translation.",
      trustLevel: "untrusted-content",
      maxFrequency: "30/min",
      untrustedContentHint: true,
      requiresApproval: false,
      requiresCase: true,
      mcpExposed: true,
      schema: languageSchema,
      exampleInput: { language: "hi" },
      maxResultChars: 2400,
      execute: async (raw, runtime) => {
        const input = languageSchema.parse(raw) as CaseInput;
        const current = resolveCase(input, runtime);
        return {
          status: "localized",
          language: input.language,
          summary: current.summary[input.language],
          checklist: actionsForCase(current, input.language),
          requiredDocuments: requiredDocumentsForCase(current.documentType, input.language),
          disclaimer: noticeDisclaimer(input.language),
          method: "reviewed_language_template",
          note: "This uses human-authored templates for the eight supported languages, not a machine-translation model.",
        };
      },
    }),

    defineTool({
      name: "generate_checklist_document",
      title: "Generate checklist document",
      description:
        "Generate a self-contained, print-ready HTML checklist you can print or save as PDF. All notice-derived values are escaped and scripts are blocked by CSP.",
      trustLevel: "untrusted-content",
      maxFrequency: "12/min",
      untrustedContentHint: true,
      requiresApproval: false,
      requiresCase: true,
      mcpExposed: true,
      schema: languageSchema,
      exampleInput: { language: "en" },
      maxResultChars: null,
      execute: async (raw, runtime) => {
        const input = languageSchema.parse(raw) as CaseInput;
        const current = resolveCase(input, runtime);
        return {
          status: "ready",
          language: input.language,
          fileName: `nagrik-saathi-checklist-${input.language}.html`,
          mimeType: "text/html;charset=utf-8",
          html: buildChecklistHtml(current, input.language),
          printHint: "Open the file and use Print, then Save as PDF.",
          boundary:
            "The document is generated locally. Nagrik Saathi does not upload it, submit it, or pay anything.",
        };
      },
    }),
  ];
}
