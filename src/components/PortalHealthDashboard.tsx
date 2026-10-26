"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { VERIFIED_PORTALS } from "@/data/official-portals";
import {
  MAX_KEYS_PER_REQUEST,
  summarizePortalHealth,
  type PortalHealthResponse,
  type PortalHealthResult,
  type PortalHealthState,
} from "@/lib/portal-health";

const CACHE_KEY = "nagrik-saathi-portal-health-v1";
const BATCH_SIZE = MAX_KEYS_PER_REQUEST;

type DashboardState = {
  checkedAt: string | null;
  results: PortalHealthResult[];
  stale: boolean;
};

const STATE_COPY: Record<PortalHealthState, { label: string; className: string }> = {
  up: {
    label: "Responding",
    className: "border-[var(--signal)] bg-[var(--signal-soft)] text-[var(--signal)]",
  },
  restricted: {
    label: "Blocked auto-check",
    className: "border-[var(--warn)] bg-[var(--warn-soft)] text-[var(--warn)]",
  },
  down: {
    label: "Not responding",
    className: "border-[#8a2f2f] bg-[#f8e9e9] text-[#8a2f2f]",
  },
};

function readCache(): DashboardState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PortalHealthResponse>;
    if (!Array.isArray(parsed.results) || parsed.results.length === 0) return null;
    return {
      checkedAt: typeof parsed.checkedAt === "string" ? parsed.checkedAt : null,
      results: parsed.results,
      stale: true,
    };
  } catch {
    return null;
  }
}

function writeCache(payload: PortalHealthResponse) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Private mode or quota failure: the live result still renders.
  }
}

function formatCheckedAt(value: string | null): string {
  if (!value) return "not yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

async function fetchBatch(
  keys: string[],
  signal?: AbortSignal,
): Promise<PortalHealthResponse> {
  const response = await fetch(
    `/api/portal-health?keys=${encodeURIComponent(keys.join(","))}`,
    { cache: "no-store", signal },
  );
  if (!response.ok) {
    throw new Error(`Health check failed with HTTP ${response.status}.`);
  }
  return (await response.json()) as PortalHealthResponse;
}

async function fetchHealth(signal?: AbortSignal): Promise<PortalHealthResponse> {
  const batches: string[][] = [];
  for (let index = 0; index < VERIFIED_PORTALS.length; index += BATCH_SIZE) {
    batches.push(
      VERIFIED_PORTALS.slice(index, index + BATCH_SIZE).map((portal) => portal.key),
    );
  }

  const payloads = await Promise.all(
    batches.map((keys) => fetchBatch(keys, signal)),
  );
  const results = payloads
    .flatMap((payload) => payload.results)
    .sort((left, right) => left.departmentName.localeCompare(right.departmentName));
  const checkedAt =
    payloads
      .map((payload) => payload.checkedAt)
      .sort()
      .at(-1) ?? new Date().toISOString();

  return {
    checkedAt,
    summary: summarizePortalHealth(results),
    results,
  };
}

export default function PortalHealthDashboard() {
  const [dashboard, setDashboard] = useState<DashboardState>({
    checkedAt: null,
    results: [],
    stale: false,
  });
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const commit = useCallback((payload: PortalHealthResponse) => {
    writeCache(payload);
    setDashboard({
      checkedAt: payload.checkedAt,
      results: payload.results,
      stale: false,
    });
    setError(null);
  }, []);

  const showFallback = useCallback(() => {
    const cached = readCache();
    setError(
      cached
        ? "The live check failed. Showing the last successful result stored in this browser."
        : "The live check failed and there is no saved result in this browser yet. Try again, or use the helpline on the portal card.",
    );
    if (cached) setDashboard(cached);
  }, []);

  const refresh = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      commit(await fetchHealth());
    } catch {
      showFallback();
    } finally {
      setChecking(false);
    }
  }, [commit, showFallback]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    // The cache read and the live result land in promise callbacks, not in the
    // effect body. That keeps the first render a pure snapshot and satisfies
    // react-hooks/set-state-in-effect without disabling the rule.
    Promise.resolve()
      .then(() => {
        if (cancelled) return;
        const cached = readCache();
        if (cached) setDashboard(cached);
      })
      .then(() => fetchHealth(controller.signal))
      .then((payload) => {
        if (!cancelled) commit(payload);
      })
      .catch(() => {
        if (!cancelled && !controller.signal.aborted) showFallback();
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [commit, showFallback]);

  const summary = useMemo(
    () => summarizePortalHealth(dashboard.results),
    [dashboard.results],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return dashboard.results;
    return dashboard.results.filter((result) =>
      `${result.departmentName} ${result.region} ${result.key} ${result.portalUrl}`
        .toLowerCase()
        .includes(needle),
    );
  }, [dashboard.results, query]);

  return (
    <section aria-labelledby="health-heading" className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-3">
        <div>
          <h2
            id="health-heading"
            className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)]"
          >
            Reviewed portal reachability
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Last successful check: <span className="font-semibold text-[var(--ink-soft)]">{formatCheckedAt(dashboard.checkedAt)}</span>
            {dashboard.stale ? " (saved in this browser)" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="portal-search">
            Filter portals
          </label>
          <input
            id="portal-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter portals"
            className="w-44 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--muted)]"
          />
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={checking}
            className="rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-wait disabled:opacity-60"
          >
            {checking ? "Checking…" : "Recheck now"}
          </button>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 border border-[var(--warn)] bg-[var(--warn-soft)] px-4 py-3 text-sm leading-6 text-[var(--warn)]"
        >
          {error}
        </p>
      ) : null}

      {dashboard.results.length > 0 ? (
        <>
          <dl className="mt-4 flex flex-wrap gap-3 text-sm">
            <div className="border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Responding
              </dt>
              <dd className="font-display text-xl font-semibold text-[var(--signal)]">
                {summary.up}
              </dd>
            </div>
            <div className="border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Blocked auto-check
              </dt>
              <dd className="font-display text-xl font-semibold text-[var(--warn)]">
                {summary.restricted}
              </dd>
            </div>
            <div className="border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Not responding
              </dt>
              <dd className="font-display text-xl font-semibold text-[#8a2f2f]">
                {summary.down}
              </dd>
            </div>
            <div className="border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Checked
              </dt>
              <dd className="font-display text-xl font-semibold text-[var(--ink)]">
                {summary.total}
              </dd>
            </div>
          </dl>

          <div className="mt-4 overflow-x-auto border border-[var(--line)] bg-[var(--panel)]">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Reachability of every portal in the reviewed registry, measured by one
                server request per portal.
              </caption>
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--wash)] text-xs uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Portal
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Result
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-semibold sm:table-cell">
                    HTTP
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-semibold sm:table-cell">
                    Latency
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Helpline
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((result) => {
                  const copy = STATE_COPY[result.state];
                  return (
                    <tr
                      key={result.key}
                      className="border-b border-[var(--line)] last:border-0"
                    >
                      <td className="px-4 py-3 align-top">
                        <a
                          href={result.portalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
                        >
                          {result.departmentName} ↗
                        </a>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {result.region} · reviewed {result.lastReviewed}
                        </p>
                        <p className="mt-1 max-w-xl text-xs leading-5 text-[var(--muted)]">
                          {result.note}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-block border px-2 py-1 text-xs font-semibold ${copy.className}`}
                        >
                          {copy.label}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 align-top font-mono text-xs text-[var(--ink-soft)] sm:table-cell">
                        {result.httpStatus ?? "—"}
                      </td>
                      <td className="hidden px-4 py-3 align-top font-mono text-xs text-[var(--ink-soft)] sm:table-cell">
                        {result.latencyMs} ms
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-[var(--ink-soft)]">
                        {result.helpline}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted)]">
              No portal matches “{query}”.{" "}
              <Link href="/playbooks" className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline">
                Browse the process playbooks
              </Link>{" "}
              instead.
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-6 border border-[var(--line)] bg-[var(--panel)] px-4 py-6 text-sm text-[var(--muted)]">
          {checking
            ? "Checking the reviewed registry now. This can take a few seconds."
            : "No health result is available yet. Try the check again."}
        </p>
      )}

      <div className="mt-4 border border-[var(--line)] bg-[var(--wash)] px-4 py-3 text-xs leading-5 text-[var(--ink-soft)]">
        <p>
          <strong className="font-semibold">What this measures.</strong> One HTTPS request
          per portal from the status checker, with a four-second timeout. A 401, 403, 405,
          or 429 is reported as <em>blocked auto-check</em> because the portal answered but
          refused an automated client; it may still work normally in your browser. A
          non-response is not proof that the portal is down for everyone.
        </p>
        <p className="mt-1">
          This is not an official uptime guarantee and it is not a government status page.
          For a time-sensitive task, use the portal helpline as well.
        </p>
      </div>
    </section>
  );
}
