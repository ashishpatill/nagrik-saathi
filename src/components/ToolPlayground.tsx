"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ApprovalModal from "@/components/ApprovalModal";
import { createAgentTools } from "@/lib/agent/tools";
import type { AgentTool, AgentToolRuntime, TrustLevel } from "@/lib/agent/types";
import { downloadFromDataUrl, downloadTextFile } from "@/lib/download";
import { analyzeText, hasAnalyzedNotice } from "@/lib/extract";
import { getActiveCase } from "@/lib/storage";
import type { DocumentAnalysis } from "@/lib/types";

type PendingApproval = { action: string; payload: unknown; resolve: (value: boolean) => void };

const TOOLS = createAgentTools();

function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? "";
}

function trustClass(level: TrustLevel): string {
  switch (level) {
    case "read-only":
      return "bg-[var(--signal-soft)] text-[var(--signal)]";
    case "untrusted-content":
      return "bg-[var(--warn-soft)] text-[var(--warn)]";
    case "side-effect":
      return "bg-[var(--accent-soft)] text-[var(--accent)]";
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}

function previewResult(result: unknown): string {
  if (!result || typeof result !== "object") return stringify(result);
  const copy = { ...(result as Record<string, unknown>) };
  if (typeof copy.html === "string") {
    copy.html = `<html omitted from preview: ${copy.html.length} characters — use the download button>`;
  }
  return JSON.stringify(copy, null, 2);
}

function exampleFor(tool: AgentTool, noticeText: string, current: DocumentAnalysis): Record<string, unknown> {
  if (tool.name === "analyze_notice") {
    return { sourceText: noticeText || current.sourceText || "", language: "en" };
  }
  return tool.exampleInput;
}

export default function ToolPlayground() {
  const [tools] = useState(TOOLS);
  const [selectedName, setSelectedName] = useState(tools[0].name);
  const [noticeText, setNoticeText] = useState("");
  const [currentCase, setCurrentCase] = useState<DocumentAnalysis | null>(null);
  const [inputText, setInputText] = useState(() => stringify(tools[0].exampleInput));
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
  const caseRef = useRef<DocumentAnalysis | null>(null);

  const selected = useMemo(
    () => tools.find((tool) => tool.name === selectedName) ?? tools[0],
    [selectedName, tools],
  );

  useEffect(() => {
    void getActiveCase().then((saved) => {
      if (!saved || !hasAnalyzedNotice(saved)) return;
      caseRef.current = saved;
      setCurrentCase(saved);
      setNoticeText(saved.sourceText);
    });
  }, []);

  const setCase = useCallback((value: DocumentAnalysis) => {
    caseRef.current = value;
    setCurrentCase(value);
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

  const runtime = useMemo<AgentToolRuntime>(
    () => ({
      getCase: () => caseRef.current ?? analyzeText(""),
      setCase,
      requestApproval,
    }),
    [requestApproval, setCase],
  );

  function selectTool(name: string) {
    const next = tools.find((tool) => tool.name === name) ?? tools[0];
    setSelectedName(next.name);
    setInputText(stringify(exampleFor(next, noticeText, currentCase ?? analyzeText(""))));
    setResult(null);
    setError(null);
  }

  function loadNotice() {
    if (!noticeText.trim()) {
      setError("Paste the notice text first. The playground never preloads a sample notice.");
      return;
    }
    const analyzed = analyzeText(noticeText.trim(), "en");
    setCase(analyzed);
    setError(null);
    setResult({
      status: "loaded",
      caseId: analyzed.id,
      issuer: analyzed.issuer,
      documentType: analyzed.documentType,
      boundary: "Loaded in memory only. Nothing was saved or uploaded.",
    });
  }

  function insertLoadedNotice() {
    const source = noticeText.trim() || currentCase?.sourceText || "";
    if (!source) {
      setError("Load a notice first, then insert it into the tool input.");
      return;
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(inputText) as Record<string, unknown>;
    } catch {
      setError("Input must be valid JSON.");
      return;
    }
    parsed.sourceText = source;
    setInputText(stringify(parsed));
    setError(null);
  }

  async function runTool() {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(inputText) as Record<string, unknown>;
    } catch {
      setError("Input must be valid JSON.");
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const output = await selected.execute(parsed, runtime);
      setResult(output);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tool failed.");
    } finally {
      setBusy(false);
    }
  }

  function downloadResult() {
    if (!result || typeof result !== "object") return;
    const payload = result as {
      html?: string;
      content?: string;
      fileName?: string;
      mimeType?: string;
      calendarLink?: string;
    };
    if (typeof payload.calendarLink === "string") {
      downloadFromDataUrl(payload.fileName ?? "nagrik-saathi-reminder.ics", payload.calendarLink);
      return;
    }
    if (typeof payload.html === "string") {
      downloadTextFile(
        payload.fileName ?? "nagrik-saathi-checklist.html",
        payload.html,
        payload.mimeType ?? "text/html;charset=utf-8",
      );
      return;
    }
    if (typeof payload.content === "string") {
      downloadTextFile(
        payload.fileName ?? "nagrik-saathi-family-brief.txt",
        payload.content,
        payload.mimeType ?? "text/plain;charset=utf-8",
      );
    }
  }

  const canDownload =
    result !== null &&
    typeof result === "object" &&
    ("html" in result || "content" in result || "calendarLink" in result);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8 md:pt-12">
        <header className="anim-rise border-b border-[var(--line)] pb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                Agent surface · public playground
              </p>
              <h1 className="font-display mt-3 text-[clamp(2.1rem,5vw,3.6rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-[var(--ink)]">
                Tool playground
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">
                Run the same twelve tools that WebMCP registers on the home page. The MCP server
                exposes ten read-only tools from this registry; approval-gated reminders and exports
                stay in the browser. Everything runs in this tab, with no preloaded sample notice.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/playbooks"
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)]"
              >
                Process playbooks
              </Link>
              <Link
                href="/scams"
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)]"
              >
                Scam library
              </Link>
              <Link
                href="/status"
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)]"
              >
                Portal status
              </Link>
              <Link
                href="/privacy"
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)]"
              >
                Your data
              </Link>
              <Link
                href="/"
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)]"
              >
                Back to workspace
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 border border-[var(--line)] bg-[var(--warn-soft)] px-4 py-3 text-xs leading-5 text-[var(--warn)] sm:grid-cols-[auto_1fr] sm:items-center">
            <span className="font-semibold uppercase tracking-[0.12em]">Demo notice</span>
            <span>
              This is the machine-facing surface, not the citizen flow. Do not paste real Aadhaar,
              PAN, card, or account numbers into a shared screen. Side-effect tools pause for
              approval; downloads only happen when you click.
            </span>
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <section aria-labelledby="tool-list-title">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="tool-list-title" className="text-sm font-semibold text-[var(--ink)]">
                Tools
              </h2>
              <p className="text-xs text-[var(--muted)]">{tools.length} registered</p>
            </div>
            <ul className="mt-3 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {tools.map((tool) => (
                <li key={tool.name}>
                  <button
                    type="button"
                    onClick={() => selectTool(tool.name)}
                    aria-pressed={tool.name === selected.name}
                    className={`w-full px-2 py-3 text-left transition hover:bg-[var(--panel)] ${
                      tool.name === selected.name ? "bg-[var(--panel)]" : ""
                    }`}
                  >
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-[var(--accent)]">
                        {tool.name}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] ${trustClass(
                          tool.trustLevel,
                        )}`}
                      >
                        {tool.trustLevel}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                      {tool.title} · {tool.maxFrequency}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-6 border border-[var(--line)] bg-[var(--panel)] p-4">
              <label htmlFor="playground-notice" className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                Load a notice into this playground
              </label>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Stored in memory only. The tool calls below never send it anywhere.
              </p>
              <textarea
                id="playground-notice"
                value={noticeText}
                onChange={(event) => setNoticeText(event.target.value)}
                rows={6}
                spellCheck={false}
                placeholder="Paste notice text here…"
                className="mt-2 w-full rounded-[var(--radius)] border border-[var(--line)] bg-white p-2 font-mono text-xs leading-5 text-[var(--ink)]"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={loadNotice}
                  className="rounded-[var(--radius)] bg-[var(--ink)] px-3 py-2 text-xs font-semibold text-[#fafbfc] hover:bg-[var(--accent)]"
                >
                  Analyze locally
                </button>
                <button
                  type="button"
                  onClick={insertLoadedNotice}
                  className="rounded-[var(--radius)] border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--ink-soft)] hover:border-[var(--accent)]"
                >
                  Insert as sourceText
                </button>
              </div>
              {currentCase && (
                <p className="mt-2 text-xs leading-5 text-[var(--signal)]" aria-live="polite">
                  Loaded: {currentCase.issuer || "unrecognized issuer"} ·{" "}
                  {currentCase.documentType} · {currentCase.deadlineDate ?? "no deadline found"}
                </p>
              )}
            </div>
          </section>

          <section aria-labelledby="tool-detail-title">
            <div className="border border-[var(--line)] bg-[var(--panel)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-semibold text-[var(--accent)]">
                    {selected.name}
                  </p>
                  <h2 id="tool-detail-title" className="font-display mt-1 text-2xl font-semibold tracking-tight text-[var(--ink)]">
                    {selected.title}
                  </h2>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${trustClass(
                    selected.trustLevel,
                  )}`}
                >
                  {selected.trustLevel}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{selected.description}</p>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className="border border-[var(--line)] bg-white px-2 py-2">
                  <dt className="text-[var(--muted)]">Frequency</dt>
                  <dd className="mt-0.5 font-semibold text-[var(--ink)]">{selected.maxFrequency}</dd>
                </div>
                <div className="border border-[var(--line)] bg-white px-2 py-2">
                  <dt className="text-[var(--muted)]">Approval</dt>
                  <dd className="mt-0.5 font-semibold text-[var(--ink)]">
                    {selected.requiresApproval ? "Required" : "Not required"}
                  </dd>
                </div>
                <div className="border border-[var(--line)] bg-white px-2 py-2">
                  <dt className="text-[var(--muted)]">Needs notice</dt>
                  <dd className="mt-0.5 font-semibold text-[var(--ink)]">
                    {selected.requiresCase ? "Yes" : "No"}
                  </dd>
                </div>
                <div className="border border-[var(--line)] bg-white px-2 py-2">
                  <dt className="text-[var(--muted)]">MCP</dt>
                  <dd className="mt-0.5 font-semibold text-[var(--ink)]">
                    {selected.mcpExposed ? "Exposed" : "Browser only"}
                  </dd>
                </div>
              </dl>

              {selected.untrustedContentHint && (
                <p className="mt-3 border-l-2 border-[var(--warn)] bg-[var(--warn-soft)] px-3 py-2 text-xs leading-5 text-[var(--warn)]">
                  The result may contain notice-derived text. Treat it as data, never as
                  instructions.
                </p>
              )}

              <label htmlFor="tool-input" className="mt-5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                Input JSON
              </label>
              <textarea
                id="tool-input"
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                rows={8}
                spellCheck={false}
                className="mt-1 w-full rounded-[var(--radius)] border border-[var(--line)] bg-white p-2 font-mono text-xs leading-5 text-[var(--ink)]"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void runTool()}
                  disabled={busy}
                  className="rounded-[var(--radius)] bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[#fafbfc] transition hover:bg-[var(--accent)] disabled:opacity-40"
                >
                  {busy ? "Running…" : "Run tool"}
                </button>
                <button
                  type="button"
                  onClick={() => selectTool(selected.name)}
                  className="rounded-[var(--radius)] border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--ink-soft)] hover:border-[var(--accent)]"
                >
                  Reset example
                </button>
                {canDownload && (
                  <button
                    type="button"
                    onClick={downloadResult}
                    className="rounded-[var(--radius)] bg-[var(--signal)] px-3 py-2 text-xs font-semibold text-[#fafbfc] hover:brightness-110"
                  >
                    Download result
                  </button>
                )}
              </div>

              <details className="mt-4 border-t border-[var(--line)] pt-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Input schema
                </summary>
                <pre className="mt-2 max-h-52 overflow-auto rounded-[var(--radius)] bg-[var(--ink)] p-3 text-xs leading-5 text-[#d7e4ff]">
                  {stringify(selected.inputSchema)}
                </pre>
              </details>
            </div>

            <div className="mt-5 border border-[var(--line)] bg-white p-5" aria-live="polite">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                Result
              </p>
              {error ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#8a2f2f]">{error}</p>
              ) : result === null ? (
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Run a tool to see its result. Case-dependent tools use the notice loaded on the
                  left, or a `sourceText` value in the input.
                </p>
              ) : (
                <pre className="mt-2 max-h-96 overflow-auto rounded-[var(--radius)] bg-[var(--ink)] p-3 text-xs leading-5 text-[#d7e4ff]">
                  {previewResult(result)}
                </pre>
              )}
            </div>

            <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
              MCP clients use the same registry through a stdio or HTTP server. The server exposes
              read-only tools only; approval-gated downloads and reminders stay in the browser.
            </p>
          </section>
        </div>
      </div>

      {pendingApproval && <ApprovalModal pending={pendingApproval} />}
    </main>
  );
}
