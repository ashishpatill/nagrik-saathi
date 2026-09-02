"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ApprovalModal from "@/components/ApprovalModal";
import OfficialPortalCard from "@/components/OfficialPortalCard";
import { SAMPLE_CASE } from "@/data/sample-case";
import { downloadFromDataUrl, downloadTextFile } from "@/lib/download";
import { analyzeText } from "@/lib/extract";
import { extractFileText } from "@/lib/extract-file";
import { getCase, saveCase } from "@/lib/storage";
import { getModelContext, initializeWebMCP, registerWebMCPTools, type WebMCPRuntimeMode } from "@/lib/webmcp/runtime";
import type { DocumentAnalysis, Language, ToolLog } from "@/lib/types";
import type { WebMCPTool } from "@/types/webmcp";

type PendingApproval = { action: string; payload: unknown; resolve: (value: boolean) => void };

type ToolPreset = { label: string; name: string; input: Record<string, unknown> };

const PRESETS: ToolPreset[] = [
  { label: "Explain in Marathi", name: "get_notice_summary", input: { language: "mr" } },
  {
    label: "Show official portal",
    name: "find_official_portal",
    input: { department: "MSEDCL", service: "bill_payment", state: "Maharashtra" },
  },
  {
    label: "Add calendar reminder",
    name: "schedule_reminder",
    input: { title: "Review MSEDCL notice deadline", date: "2026-09-02" },
  },
  { label: "Export family brief", name: "export_family_brief", input: { language: "en" } },
];

const PRESET_HINT =
  "Sample is already loaded. Run the four steps in order—tools stay local to this page.";

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

export default function Workspace() {
  const [currentCase, setCurrentCase] = useState<DocumentAnalysis>(SAMPLE_CASE);
  const [language, setLanguage] = useState<Language>("en");
  const [toolLogs, setToolLogs] = useState<ToolLog[]>([]);
  const [tools, setTools] = useState<WebMCPTool[]>([]);
  const [selectedTool, setSelectedTool] = useState("");
  const [toolInput, setToolInput] = useState('{"language":"mr"}');
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
  const [noticeText, setNoticeText] = useState(SAMPLE_CASE.sourceText);
  const [status, setStatus] = useState("starting");
  const [lastResult, setLastResult] = useState<unknown>(null);
  const [runtimeMode, setRuntimeMode] = useState<WebMCPRuntimeMode>("unavailable");
  const [busy, setBusy] = useState(false);
  const [showInspector, setShowInspector] = useState(false);

  const caseRef = useRef(currentCase);

  useEffect(() => {
    caseRef.current = currentCase;
  }, [currentCase]);

  const setCase = useCallback((value: DocumentAnalysis) => {
    caseRef.current = value;
    setCurrentCase(value);
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
    void getCase(SAMPLE_CASE.id).then((saved) => {
      if (saved) {
        caseRef.current = saved;
        setCurrentCase(saved);
      }
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
      setLastResult({ status: "error", message: `Tool ${name} is not registered.` });
      return;
    }
    setSelectedTool(name);
    setToolInput(stringify(input));
    setBusy(true);
    try {
      const context = getModelContext();
      const result =
        runtimeMode !== "local" && context?.executeTool
          ? await context.executeTool(target, stringify(input))
          : await target.execute(input);
      setLastResult(result);
      // Downloads are offered once via onLog when the tool execute wrapper succeeds.
      if (name === "get_notice_summary" && typeof input.language === "string") {
        setLanguage(input.language as Language);
      }
    } catch (error) {
      setLastResult({
        status: "error",
        message: error instanceof Error ? error.message : "Tool failed.",
      });
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
      return;
    }
    await runTool(selectedTool, input);
  }

  function loadSample() {
    setNoticeText(SAMPLE_CASE.sourceText);
    setCase(SAMPLE_CASE);
    setLanguage("en");
    setLastResult({ status: "loaded", message: "Sample MSEDCL notice is ready." });
  }

  function analyzeNotice() {
    const result = analyzeText(noticeText, language);
    setCase(result);
    setLastResult({ status: "analyzed", caseId: result.id });
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8 md:pt-12">
        <header className="anim-rise flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-8">
          <div className="min-w-0 max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              Safe public-document copilot
            </p>
            <h1 className="font-display mt-3 text-[clamp(2.4rem,6vw,4.25rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-[var(--ink)]">
              Nagrik Saathi
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--ink-soft)] md:text-lg">
              Understand a government notice in plain language, then open only a reviewed official channel—yourself.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadSample}
                className="rounded-[var(--radius)] bg-[var(--ink)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
              >
                Load sample notice
              </button>
              <label className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2.5 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)]">
                Add text or PDF
                <input
                  type="file"
                  accept=".txt,.md,.pdf,application/pdf,text/plain"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      setNoticeText(await extractFileText(file));
                    } catch (error) {
                      setLastResult({
                        status: "error",
                        message: error instanceof Error ? error.message : "Could not read file.",
                      });
                    }
                  }}
                />
              </label>
            </div>
            <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
              No payments or submissions are performed by this app.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-[11px] font-semibold text-[var(--ink-soft)]">
              <span
                className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${status === "ready" ? "bg-[var(--signal)]" : "bg-[var(--muted)]"}`}
              />
              {status === "ready" ? `WebMCP ready · ${modeLabel(runtimeMode)}` : modeLabel(runtimeMode)}
            </div>
            <button
              type="button"
              onClick={() => setShowInspector((value) => !value)}
              className="text-xs font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
            >
              {showInspector ? "Hide inspector" : "Show inspector"}
            </button>
          </div>
        </header>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="anim-rise-delay space-y-10">
            <div>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--ink)]">Notice text</h2>
                  <p className="text-xs text-[var(--muted)]">Stays in this browser by default.</p>
                </div>
                <button
                  type="button"
                  onClick={analyzeNotice}
                  className="rounded-[var(--radius)] border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-soft)] hover:bg-[var(--wash)]"
                >
                  Analyze
                </button>
              </div>
              <textarea
                value={noticeText}
                onChange={(event) => setNoticeText(event.target.value)}
                rows={4}
                className="w-full resize-y rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-4 text-sm leading-6 text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
            </div>

            <article className="border-t border-[var(--line)] pt-8">
              <div className="flex flex-wrap items-start justify-between gap-6">
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
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--warn)]">Deadline</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-[var(--ink)]">
                    {currentCase.deadlineDate ?? "—"}
                  </p>
                </div>
              </div>

              <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-[var(--line)] py-5">
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">Amount</dt>
                  <dd className="mt-1 text-lg font-semibold text-[var(--ink)]">
                    {currentCase.amountDue == null ? "—" : `₹${currentCase.amountDue.toLocaleString("en-IN")}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">Urgency</dt>
                  <dd className="mt-1 text-lg font-semibold capitalize text-[var(--ink)]">{currentCase.urgency}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">Source</dt>
                  <dd className="mt-1 text-lg font-semibold text-[var(--signal)]">
                    {currentCase.scamRiskScore === "safe" ? "Reviewed" : "Check"}
                  </dd>
                </div>
              </dl>

              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Plain-language brief</h3>
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value as Language)}
                    className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-xs"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी</option>
                    <option value="mr">मराठी</option>
                  </select>
                </div>
                <p className="max-w-2xl text-[15px] leading-7 text-[var(--ink-soft)]">{currentCase.summary[language]}</p>
              </div>

              <div className="mt-8 grid gap-8 md:grid-cols-2">
                <Checklist title="What to do next" items={currentCase.requiredActionItems} />
                <Checklist title="Keep nearby" items={currentCase.requiredDocuments} />
              </div>

              <div className="mt-8 space-y-5">
                <OfficialPortalCard departmentKey={currentCase.officialDepartmentKey} />
                <p className="text-sm leading-6 text-[var(--muted)]">{currentCase.riskReason}</p>
              </div>
            </article>
          </section>

          <aside className="anim-rise-delay space-y-8 lg:sticky lg:top-8 lg:self-start">
            <div>
              <h2 className="text-sm font-semibold text-[var(--ink)]">Try the demo path</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{PRESET_HINT}</p>
              {tools.length === 0 ? (
                <p className="mt-4 text-xs font-medium text-[var(--muted)]" aria-live="polite">
                  Preparing tools…
                </p>
              ) : (
                <ol className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                  {PRESETS.map((preset, index) => (
                    <li key={preset.label}>
                      <button
                        type="button"
                        disabled={busy}
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

            {toolLogs.length > 0 && (
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
                  className="mt-2 w-full rounded-[var(--radius)] bg-[var(--ink)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
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

            <p className="text-sm leading-6 text-[var(--muted)]">
              Human control is intentional. This app can explain, plan, draft, and prepare a reminder—never log into
              an official portal or send a letter.
            </p>
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
