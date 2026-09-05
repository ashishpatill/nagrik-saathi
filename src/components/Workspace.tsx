"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ApprovalModal from "@/components/ApprovalModal";
import OfficialPortalCard from "@/components/OfficialPortalCard";
import ReviewedPortalDirectory from "@/components/ReviewedPortalDirectory";
import { downloadFromDataUrl, downloadTextFile } from "@/lib/download";
import { actionsForCase, analyzeText, EMPTY_CASE, hasAnalyzedNotice, portalHintsForCase } from "@/lib/extract";
import { ACCEPTED_NOTICE_FILES, isImageFile, loadNoticeFile } from "@/lib/extract-file";
import { siteCopy } from "@/lib/i18n/site";
import { isLanguage, LANGUAGES, languageOptionLabel, type Language } from "@/lib/languages";
import { clearActiveCase, getActiveCase, saveCase } from "@/lib/storage";
import { initializeWebMCP, registerWebMCPTools, type WebMCPRuntimeMode } from "@/lib/webmcp/runtime";
import type { DocumentAnalysis, ToolLog } from "@/lib/types";
import type { WebMCPTool } from "@/types/webmcp";

type PendingApproval = { action: string; payload: unknown; resolve: (value: boolean) => void };

type ToolPreset = { label: string; name: string; input: Record<string, unknown> };

function modeLabel(mode: WebMCPRuntimeMode): string {
  switch (mode) {
    case "native":
      return "Native";
    case "polyfill":
      return "Polyfill";
    case "local":
      return "Local";
    case "unavailable":
      return "Unavailable";
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? "";
}

function offerDownload(result: unknown) {
  if (!result || typeof result !== "object") return;
  const payload = result as { calendarLink?: string; content?: string; fileName?: string; status?: string };
  if (payload.status !== "success") return;
  if (typeof payload.calendarLink === "string") {
    downloadFromDataUrl("nagrik-saathi-reminder.ics", payload.calendarLink);
    return;
  }
  if (typeof payload.content === "string") {
    downloadTextFile(payload.fileName ?? "nagrik-saathi-family-brief.txt", payload.content);
  }
}

function buildPresets(doc: DocumentAnalysis, explainLanguage: Language): ToolPreset[] {
  const portal = portalHintsForCase(doc);
  const paid = doc.documentType === "payment_receipt";
  const reminderDate = doc.deadlineDate ?? new Date().toISOString().slice(0, 10);
  return [
    {
      label: `Explain in ${languageOptionLabel(explainLanguage)}`,
      name: "get_notice_summary",
      input: { language: explainLanguage },
    },
    {
      label: "Show official portal",
      name: "find_official_portal",
      input: { department: portal.department, service: portal.service, state: portal.state },
    },
    { label: "Check scam signals", name: "check_scam_signals", input: { language: explainLanguage } },
    { label: "Create action plan", name: "create_action_plan", input: { language: explainLanguage } },
    {
      label: paid ? "Calendar note for receipt" : "Add calendar reminder",
      name: "schedule_reminder",
      input: {
        title: paid
          ? `Keep payment receipt · ${doc.issuer || "receipt"}`
          : `Review notice deadline · ${doc.issuer || "notice"}`,
        date: reminderDate,
      },
    },
    { label: "Export family brief", name: "export_family_brief", input: { language: explainLanguage } },
    {
      label: "Draft citizen letter",
      name: "draft_citizen_letter",
      input: { tone: "simple", language: explainLanguage },
    },
  ];
}

function describeActionResult(name: string, result: unknown): string {
  if (!result || typeof result !== "object") return "Done.";
  const data = result as Record<string, unknown>;
  if (name === "get_notice_summary" && typeof data.summary === "string") return data.summary;
  if (name === "find_official_portal") {
    if (data.verified === true && typeof data.officialUrl === "string") {
      return `${String(data.department ?? "Official portal")}\n${data.officialUrl}${
        typeof data.helpline === "string" ? `\nHelpline ${data.helpline}` : ""
      }`;
    }
    return typeof data.reason === "string" ? data.reason : "No reviewed portal matched.";
  }
  if (name === "check_scam_signals") {
    const flags = Array.isArray(data.flags) ? data.flags.map(String) : [];
    const risk = typeof data.risk === "string" ? data.risk : "unknown";
    const advice = typeof data.advice === "string" ? data.advice : "";
    return [`Risk: ${risk}`, ...flags.map((flag) => `• ${flag}`), advice].filter(Boolean).join("\n");
  }
  if (name === "create_action_plan") {
    const checklist = Array.isArray(data.checklist) ? data.checklist.map(String) : [];
    const docs = Array.isArray(data.requiredDocuments) ? data.requiredDocuments.map(String) : [];
    const boundary = typeof data.boundary === "string" ? data.boundary : "";
    return [
      "Checklist:",
      ...checklist.map((item) => `• ${item}`),
      docs.length ? "\nKeep nearby:" : "",
      ...docs.map((item) => `• ${item}`),
      boundary ? `\n${boundary}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (name === "analyze_notice") {
    return `Analyzed${typeof data.issuer === "string" ? ` · ${data.issuer}` : ""}. Review the brief on the left.`;
  }
  if (data.status === "cancelled_by_user") return "Cancelled — nothing was downloaded.";
  if (data.status === "success") return "Prepared a download on this device.";
  if (data.status === "draft_only" && typeof data.content === "string") return data.content;
  if (typeof data.message === "string") return data.message;
  return stringify(data);
}

export default function Workspace() {
  const [currentCase, setCurrentCase] = useState<DocumentAnalysis>(EMPTY_CASE);
  const [siteLanguage, setSiteLanguage] = useState<Language>("en");
  const [explainLanguage, setExplainLanguage] = useState<Language>("en");
  const [toolLogs, setToolLogs] = useState<ToolLog[]>([]);
  const [tools, setTools] = useState<WebMCPTool[]>([]);
  const [selectedTool, setSelectedTool] = useState("");
  const [toolInput, setToolInput] = useState('{"language":"en"}');
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
  const [noticeText, setNoticeText] = useState("");
  const [status, setStatus] = useState("starting");
  const [lastResult, setLastResult] = useState<unknown>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [portalHighlightUrl, setPortalHighlightUrl] = useState<string | null>(null);
  const [runtimeMode, setRuntimeMode] = useState<WebMCPRuntimeMode>("unavailable");
  const [busy, setBusy] = useState(false);
  // Dev/demo only — not part of the citizen UI. Open /?inspector=1 to use it.
  const [showInspector, setShowInspector] = useState(false);
  const [attachedName, setAttachedName] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [fileBusy, setFileBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const caseRef = useRef(currentCase);
  const portalCardRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const analyzed = hasAnalyzedNotice(currentCase);
  const presets = useMemo(() => buildPresets(currentCase, explainLanguage), [currentCase, explainLanguage]);
  const t = useMemo(() => siteCopy(siteLanguage), [siteLanguage]);

  useEffect(() => {
    caseRef.current = currentCase;
  }, [currentCase]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShowInspector(params.get("inspector") === "1");
    const savedSite = window.localStorage.getItem("nagrik-site-language");
    const savedExplain = window.localStorage.getItem("nagrik-explain-language");
    if (savedSite && isLanguage(savedSite)) setSiteLanguage(savedSite);
    if (savedExplain && isLanguage(savedExplain)) setExplainLanguage(savedExplain);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("nagrik-site-language", siteLanguage);
    document.documentElement.lang = siteLanguage;
  }, [siteLanguage]);

  useEffect(() => {
    window.localStorage.setItem("nagrik-explain-language", explainLanguage);
  }, [explainLanguage]);

  const setCase = useCallback((value: DocumentAnalysis) => {
    caseRef.current = value;
    setCurrentCase(value);
    if (hasAnalyzedNotice(value) && value.sourceText.trim()) {
      setNoticeText(value.sourceText);
    }
    void saveCase(value);
  }, []);

  const requestApproval = useCallback((action: string, payload: unknown) => {
    return new Promise<boolean>((resolve) => {
      setPendingApproval({
        action,
        payload,
        resolve: (value) => {
          setPendingApproval(null);
          resolve(value);
        },
      });
    });
  }, []);

  useEffect(() => {
    initializeWebMCP();
    void getActiveCase().then((saved) => {
      if (!saved || !hasAnalyzedNotice(saved)) return;
      // Re-run extractors so older saved cases pick up receipt/date fixes.
      const refreshed = { ...analyzeText(saved.sourceText), id: saved.id, fileName: saved.fileName };
      caseRef.current = refreshed;
      setCurrentCase(refreshed);
      setNoticeText(refreshed.sourceText);
      void saveCase(refreshed);
    });

    let cleanup: () => void = () => undefined;
    let cancelled = false;

    void registerWebMCPTools({
      getCase: () => caseRef.current,
      setCase,
      onLog: (log) => {
        setToolLogs((previous) => [log, ...previous].slice(0, 20));
        if (log.status === "success") offerDownload(log.result);
      },
      requestApproval,
    }).then((registered) => {
      if (cancelled) {
        registered.dispose();
        return;
      }
      cleanup = registered.dispose;
      setTools(registered.tools);
      setSelectedTool((current) =>
        registered.tools.some((tool) => tool.name === current)
          ? current
          : (registered.tools[0]?.name ?? ""),
      );
      setRuntimeMode(registered.mode);
      setStatus(registered.tools.length ? "ready" : "unavailable");
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [requestApproval, setCase]);

  async function runTool(name: string, input: Record<string, unknown>) {
    const target = tools.find((item) => item.name === name);
    if (!target) {
      const message = "Tools are still preparing. Wait a moment, then try again.";
      setLastResult({ status: "error", message });
      setActionMessage(message);
      return;
    }

    if (!analyzed && name !== "analyze_notice") {
      const message = "Analyze a notice first, then run this action.";
      setActionMessage(message);
      return;
    }

    if (name === "get_notice_summary" && typeof input.language === "string" && isLanguage(input.language)) {
      setExplainLanguage(input.language);
    }

    setSelectedTool(name);
    setToolInput(stringify(input));
    setBusy(true);
    setActionMessage(null);
    try {
      // Always execute the registered tool directly so the Result panel updates even
      // when polyfill executeTool is unavailable or Origin-Agent-Cluster is false.
      const result = await target.execute(input);
      setLastResult(result);
      setActionMessage(describeActionResult(name, result));

      if (name === "find_official_portal" && result && typeof result === "object") {
        const portal = result as { verified?: boolean; officialUrl?: string };
        if (portal.verified && typeof portal.officialUrl === "string") {
          setPortalHighlightUrl(portal.officialUrl);
          window.setTimeout(() => {
            portalCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 50);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tool failed.";
      setLastResult({ status: "error", message });
      setActionMessage(message);
    } finally {
      setBusy(false);
    }
  }

  async function invokeSelectedTool() {
    let input: Record<string, unknown>;
    try {
      input = JSON.parse(toolInput) as Record<string, unknown>;
    } catch {
      setLastResult({ status: "error", message: "Input must be valid JSON." });
      setActionMessage("Input must be valid JSON.");
      return;
    }
    await runTool(selectedTool, input);
  }

  function analyzeNotice() {
    if (!noticeText.trim()) {
      setActionMessage(
        imagePreviewUrl
          ? "Photo is attached. Type or paste the readable text from the photo into the box, then Analyze."
          : "Attach a file or paste the notice text, then Analyze.",
      );
      return;
    }
    const result = analyzeText(noticeText, explainLanguage);
    setCase(result);
    setPortalHighlightUrl(null);
    setActionMessage("Notice analyzed. Use the actions on the right if you need Marathi, a portal link, or a reminder.");
    setLastResult({ status: "analyzed", caseId: result.id, issuer: result.issuer });
  }

  function clearWorkspace() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setNoticeText("");
    setAttachedName(null);
    setImagePreviewUrl(null);
    setCase(EMPTY_CASE);
    setExplainLanguage("en");
    setToolLogs([]);
    setLastResult(null);
    setActionMessage(null);
    setPortalHighlightUrl(null);
    void clearActiveCase();
  }

  async function ingestFile(file: File) {
    setFileBusy(true);
    setActionMessage(isImageFile(file) ? t.readingOcr : t.readingFile);
    try {
      const loaded = await loadNoticeFile(file);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setAttachedName(loaded.fileName);
      setImagePreviewUrl(loaded.imageUrl);
      setNoticeText(loaded.text);
      if (loaded.kind === "image" && loaded.ocrUsed && loaded.text.trim()) {
        setActionMessage(
          `Photo “${loaded.fileName}” read on this device. Review the text, then Analyze.`,
        );
      } else if (loaded.kind === "image" && !loaded.text.trim()) {
        setActionMessage(
          `Photo “${loaded.fileName}” attached, but OCR found little text. Type what you can read, then Analyze.`,
        );
      } else {
        setActionMessage(`Loaded “${loaded.fileName}”. Click Analyze.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not read file.";
      setLastResult({ status: "error", message });
      setActionMessage(message);
    } finally {
      setFileBusy(false);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8 md:pt-12">
        <header className="anim-rise border-b border-[var(--line)] pb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{t.eyebrow}</p>
              <h1 className="font-display mt-3 text-[clamp(2.4rem,6vw,4.25rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-[var(--ink)]">
                Nagrik Saathi
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--ink-soft)] md:text-lg">{t.tagline}</p>
            </div>
            <div className="flex w-full max-w-md flex-col gap-3 sm:w-auto">
              {showInspector && (
                <div className="text-right text-[11px] font-semibold text-[var(--ink-soft)]">
                  <span
                    className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${status === "ready" ? "bg-[var(--signal)]" : "bg-[var(--muted)]"}`}
                  />
                  {status === "ready" ? `WebMCP ready · ${modeLabel(runtimeMode)}` : modeLabel(runtimeMode)}
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block text-xs text-[var(--muted)]">
                  <span className="font-semibold uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                    {t.siteLanguage}
                  </span>
                  <span className="mt-0.5 block text-[10px]">{t.siteLanguageHint}</span>
                  <select
                    value={siteLanguage}
                    onChange={(event) => setSiteLanguage(event.target.value as Language)}
                    className="mt-1 w-full rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-2 py-2 text-sm text-[var(--ink)]"
                  >
                    {LANGUAGES.map((code) => (
                      <option key={`site-${code}`} value={code}>
                        {languageOptionLabel(code)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs text-[var(--muted)]">
                  <span className="font-semibold uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                    {t.explainLanguage}
                  </span>
                  <span className="mt-0.5 block text-[10px]">{t.explainLanguageHint}</span>
                  <select
                    value={explainLanguage}
                    onChange={(event) => setExplainLanguage(event.target.value as Language)}
                    className="mt-1 w-full rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-2 py-2 text-sm text-[var(--ink)]"
                  >
                    {LANGUAGES.map((code) => (
                      <option key={`explain-${code}`} value={code}>
                        {languageOptionLabel(code)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <ol className="mt-8 grid gap-3 sm:grid-cols-3">
            <li className="border border-[var(--line)] bg-[var(--panel)] px-4 py-3">
              <p className="font-mono text-[11px] text-[var(--muted)]">1</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{t.stepAttachTitle}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{t.stepAttachBody}</p>
            </li>
            <li className="border border-[var(--line)] bg-[var(--panel)] px-4 py-3">
              <p className="font-mono text-[11px] text-[var(--muted)]">2</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{t.stepAnalyzeTitle}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{t.stepAnalyzeBody}</p>
            </li>
            <li className="border border-[var(--line)] bg-[var(--panel)] px-4 py-3">
              <p className="font-mono text-[11px] text-[var(--muted)]">3</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{t.stepPortalTitle}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{t.stepPortalBody}</p>
            </li>
          </ol>
        </header>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="anim-rise-delay space-y-10">
            <div>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--ink)]">{t.yourNotice}</h2>
                  <p className="text-xs text-[var(--muted)]">
                    {t.noticeHint}
                    {attachedName ? (
                      <>
                        {" "}
                        · <span className="font-medium text-[var(--ink-soft)]">{attachedName}</span>
                      </>
                    ) : null}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={analyzeNotice}
                  disabled={!noticeText.trim() || fileBusy}
                  className="rounded-[var(--radius)] bg-[var(--ink)] px-3 py-1.5 text-xs font-semibold text-[#fafbfc] hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t.analyze}
                </button>
              </div>

              <div
                className={`rounded-[var(--radius)] border border-dashed p-3 transition ${
                  dragOver ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--panel)]"
                }`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragOver(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOver(false);
                  const file = event.dataTransfer.files?.[0];
                  if (file) void ingestFile(file);
                }}
              >
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={fileBusy}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-[var(--radius)] bg-[var(--ink)] px-4 py-2.5 text-sm font-semibold text-[#fafbfc] transition hover:bg-[var(--accent)] disabled:opacity-40"
                  >
                    {fileBusy ? t.readingFile : t.attach}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_NOTICE_FILES}
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void ingestFile(file);
                      event.target.value = "";
                    }}
                  />
                  {analyzed && (
                    <button
                      type="button"
                      onClick={clearWorkspace}
                      className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2.5 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)]"
                    >
                      {t.clearNotice}
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{t.dropHint}</p>

                {imagePreviewUrl && (
                  <figure className="mt-3 overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--wash)]">
                    <img
                      src={imagePreviewUrl}
                      alt={`Attached notice photo ${attachedName ?? ""}`}
                      className="max-h-56 w-full object-contain"
                    />
                    <figcaption className="border-t border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)]">
                      {t.photoCaption}
                    </figcaption>
                  </figure>
                )}

                <textarea
                  value={noticeText}
                  onChange={(event) => setNoticeText(event.target.value)}
                  rows={imagePreviewUrl ? 6 : 8}
                  placeholder={imagePreviewUrl ? t.photoPlaceholder : t.pastePlaceholder}
                  className="mt-3 w-full resize-y rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-4 text-sm leading-6 text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                />
              </div>
            </div>

            {!analyzed ? (
              <div className="border-t border-[var(--line)] pt-8">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)]">
                  {t.whatYouGet}
                </h2>
                <ul className="mt-4 max-w-xl space-y-2 text-sm leading-7 text-[var(--ink-soft)]">
                  <li>{t.getBrief}</li>
                  <li>{t.getFields}</li>
                  <li>{t.getPortal}</li>
                </ul>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">{t.notGov}</p>
              </div>
            ) : (
              <article className="border-t border-[var(--line)] pt-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      {currentCase.documentType.replaceAll("_", " ")}
                    </p>
                    <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight text-[var(--ink)] md:text-[1.85rem]">
                      {currentCase.issuer}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Reference <span className="font-mono text-[var(--ink)]">{currentCase.referenceNumber}</span>
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                        currentCase.documentType === "payment_receipt" ? "text-[var(--muted)]" : "text-[var(--warn)]"
                      }`}
                    >
                      {currentCase.documentType === "payment_receipt" ? t.paidOn : t.deadline}
                    </p>
                    <p className="mt-1 font-mono text-2xl font-semibold text-[var(--ink)]">
                      {currentCase.deadlineDate ?? "—"}
                    </p>
                  </div>
                </div>

                <dl className="mt-8 grid grid-cols-1 gap-4 border-y border-[var(--line)] py-5 sm:grid-cols-3">
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                      {currentCase.documentType === "payment_receipt" ? t.amountPaid : t.amount}
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-[var(--ink)]">
                      {currentCase.amountDue == null ? "—" : `₹${currentCase.amountDue.toLocaleString("en-IN")}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">{t.urgency}</dt>
                    <dd className="mt-1 text-lg font-semibold capitalize text-[var(--ink)]">{currentCase.urgency}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">{t.source}</dt>
                    <dd
                      className={`mt-1 text-lg font-semibold ${
                        currentCase.scamRiskScore === "safe" ? "text-[var(--signal)]" : "text-[var(--warn)]"
                      }`}
                    >
                      {currentCase.scamRiskScore === "safe" ? t.reviewedCues : t.checkCarefully}
                    </dd>
                  </div>
                </dl>

                <div className="mt-8">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">{t.plainBrief}</h3>
                    <p className="text-xs text-[var(--muted)]">
                      {t.explainLanguage}: {languageOptionLabel(explainLanguage)}
                    </p>
                  </div>
                  <p className="max-w-2xl text-[15px] leading-7 text-[var(--ink-soft)]">
                    {currentCase.summary[explainLanguage]}
                  </p>
                </div>

                <div className="mt-8 grid gap-8 md:grid-cols-2">
                  <Checklist title={t.whatNext} items={actionsForCase(currentCase, explainLanguage)} />
                  <Checklist title={t.keepNearby} items={currentCase.requiredDocuments} />
                </div>

                <div ref={portalCardRef} className="mt-8 space-y-5">
                  <OfficialPortalCard
                    departmentKey={currentCase.officialDepartmentKey}
                    highlightUrl={portalHighlightUrl}
                  />
                  <p className="text-sm leading-6 text-[var(--muted)]">{currentCase.riskReason}</p>
                  <ReviewedPortalDirectory activeKey={currentCase.officialDepartmentKey} />
                </div>
              </article>
            )}
          </section>

          <aside className="anim-rise-delay space-y-8 lg:sticky lg:top-8 lg:self-start">
            {!analyzed ? (
              <div>
                <h2 className="text-sm font-semibold text-[var(--ink)]">{t.howToUse}</h2>
                <ol className="mt-4 space-y-3 text-sm leading-6 text-[var(--ink-soft)]">
                  <li>{t.howAttach}</li>
                  <li>{t.howAnalyze}</li>
                  <li>{t.howPortal}</li>
                </ol>
                <p className="mt-5 text-xs leading-5 text-[var(--muted)]">{t.howExtras}</p>
              </div>
            ) : (
              <div>
                <h2 className="text-sm font-semibold text-[var(--ink)]">{t.nextSteps}</h2>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{t.nextStepsHint}</p>
                {tools.length === 0 ? (
                  <p className="mt-4 text-xs font-medium text-[var(--muted)]" aria-live="polite">
                    {t.preparingTools}
                  </p>
                ) : (
                  <ol className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                    {presets.map((preset, index) => (
                      <li key={preset.label}>
                        <button
                          type="button"
                          disabled={busy || tools.length === 0}
                          onClick={() => void runTool(preset.name, preset.input)}
                          className="flex min-h-12 w-full items-center justify-between gap-3 py-3.5 text-left text-sm font-medium text-[var(--ink)] transition hover:text-[var(--accent)] disabled:opacity-40"
                        >
                          <span className="flex items-baseline gap-3">
                            <span className="font-mono text-[11px] text-[var(--muted)]">{index + 1}</span>
                            <span>{preset.label}</span>
                          </span>
                          <span className="text-[11px] text-[var(--muted)]">{busy ? "…" : "Run"}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            {actionMessage && (
              <div className="border border-[var(--line)] bg-[var(--panel)] p-4" aria-live="polite">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">{t.result}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--ink-soft)]">{actionMessage}</p>
                {portalHighlightUrl && (
                  <a
                    href={portalHighlightUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex rounded-[var(--radius)] bg-[var(--ink)] px-3.5 py-2 text-xs font-semibold text-[#fafbfc] hover:bg-[var(--accent)]"
                  >
                    {t.openPortal}
                  </a>
                )}
              </div>
            )}

            {showInspector && toolLogs.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold">Activity</h2>
                <ul className="mt-3 space-y-2">
                  {toolLogs.map((log) => (
                    <li
                      key={log.id}
                      className="flex items-center justify-between gap-2 border-b border-[var(--line)] py-2 last:border-0"
                    >
                      <span className="font-mono text-[11px] font-semibold text-[var(--accent)]">{log.name}</span>
                      <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{log.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {showInspector && (
              <div className="border-t border-[var(--line)] pt-6">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-sm font-semibold">Inspector</h2>
                  <p className="text-[11px] text-[var(--muted)]">
                    {tools.length} tools · {modeLabel(runtimeMode)}
                  </p>
                </div>
                <label className="mt-4 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Manual call
                </label>
                <select
                  value={selectedTool}
                  onChange={(event) => setSelectedTool(event.target.value)}
                  className="mt-1 w-full rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-2 text-sm"
                >
                  {tools.map((tool) => (
                    <option key={tool.name} value={tool.name}>
                      {tool.name}
                    </option>
                  ))}
                </select>
                <textarea
                  value={toolInput}
                  onChange={(event) => setToolInput(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-2 font-mono text-[11px]"
                />
                <button
                  type="button"
                  disabled={!selectedTool || busy}
                  onClick={() => void invokeSelectedTool()}
                  className="mt-2 w-full rounded-[var(--radius)] bg-[var(--ink)] px-3 py-2 text-xs font-semibold text-[#fafbfc] disabled:opacity-40"
                >
                  Execute
                </button>
                {lastResult !== null && (
                  <pre className="mt-3 max-h-44 overflow-auto rounded-[var(--radius)] bg-[var(--ink)] p-3 text-[11px] leading-5 text-[#d7e4ff]">
                    {stringify(lastResult)}
                  </pre>
                )}
              </div>
            )}

            <p className="text-sm leading-6 text-[var(--muted)]">{t.boundary}</p>
          </aside>
        </div>
      </div>

      {pendingApproval && <ApprovalModal pending={pendingApproval} />}
    </main>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--ink)]">{title}</h3>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-6 text-[var(--ink-soft)]">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--signal)]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
