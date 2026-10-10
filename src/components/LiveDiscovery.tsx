"use client";

import { useRef, useState } from "react";
import type { DiscoveryResult } from "@/lib/discovery";

const KEY_STORAGE = "nagrik-serpapi-key";

export default function LiveDiscovery() {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const keyRef = useRef<HTMLInputElement | null>(null);

  async function runDiscovery() {
    const q = query.trim();
    if (q.length < 3 || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const ownKey = keyRef.current?.value.trim();
      const response = await fetch(`/api/discover?q=${encodeURIComponent(q)}`, {
        headers: ownKey ? { "x-serpapi-key": ownKey } : undefined,
      });
      const data = (await response.json()) as DiscoveryResult & { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Live discovery failed. Try the reviewed portal directory instead.");
        return;
      }
      setResult(data);
    } catch {
      setError("Live discovery failed. Try the reviewed portal directory instead.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-[var(--line)] pt-8">
      <h2 className="text-sm font-semibold text-[var(--ink)]">Find the official page, live</h2>
      <p className="mt-1 max-w-xl text-xs leading-5 text-[var(--muted)]">
        Search the live web through SerpApi. Only results on reviewed official domains are shown — everything else
        is counted and dropped, never presented as a link.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void runDiscovery();
          }}
          placeholder="e.g. Maharashtra traffic e-challan payment"
          className="min-w-64 flex-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
        />
        <button
          type="button"
          onClick={() => void runDiscovery()}
          disabled={query.trim().length < 3 || busy}
          className="rounded-[var(--radius)] bg-[var(--ink)] px-4 py-2.5 text-sm font-semibold text-[#fafbfc] transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Searching…" : "Find the official page"}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={(el) => {
            keyRef.current = el;
            if (el && !el.value) {
              el.value = window.localStorage.getItem(KEY_STORAGE) ?? "";
            }
          }}
          onChange={(event) => window.localStorage.setItem(KEY_STORAGE, event.target.value)}
          type="password"
          autoComplete="off"
          placeholder="Your SerpApi key (optional — the public site carries no key)"
          className="min-w-64 flex-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
        />
        <p className="text-xs leading-5 text-[var(--muted)]">
          Bring your own key: stored only in this browser, used only for your searches. Free at serpapi.com
          (250 searches/month). Deployments can instead set a server key.
        </p>
      </div>

      {error && (
        <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--warn)]" aria-live="polite">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-6" aria-live="polite">
          {result.verified.length > 0 ? (
            <ul className="space-y-6">
              {result.verified.map((item) => (
                <li key={item.url} className="border-t border-[var(--line)] pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--signal)]">
                    Verified official result
                  </p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-base font-semibold text-[var(--ink)] hover:text-[var(--accent)]"
                  >
                    {item.title}
                  </a>
                  <p className="mt-1 font-mono text-xs text-[var(--muted)]">{item.verifiedDomain}</p>
                  {item.snippet && (
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--ink-soft)]">{item.snippet}</p>
                  )}
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {item.departmentName} · registry reviewed {item.reviewedOn}
                    {result.cached ? " · cached result" : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="max-w-xl text-sm leading-6 text-[var(--ink-soft)]">{result.note}</p>
          )}
          {result.droppedCount > 0 && (
            <p className="mt-5 text-sm font-medium leading-6 text-[var(--warn)]">
              {result.droppedCount} non-official result{result.droppedCount === 1 ? " was" : "s were"} filtered out
            </p>
          )}
          {result.verified.length > 0 && (
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{result.note}</p>
          )}
        </div>
      )}
    </div>
  );
}
