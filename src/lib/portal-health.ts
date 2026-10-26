import type { OfficialPortal } from "@/lib/types";

/**
 * Portal health is a single polite request from our server to a reviewed
 * registry URL. It is not a browser test: a portal can return 403 to an
 * automated client and still work normally for a citizen. Every result is
 * reported as measured, never as an official availability guarantee.
 */
export type PortalHealthState = "up" | "restricted" | "down";

export type PortalHealthResult = {
  key: string;
  departmentName: string;
  state: PortalHealthState;
  region: string;
  portalUrl: string;
  helpline: string;
  lastReviewed: string;
  httpStatus: number | null;
  latencyMs: number;
  note: string;
  checkedAt: string;
};

export type PortalHealthSummary = {
  total: number;
  up: number;
  restricted: number;
  down: number;
};

export type PortalHealthResponse = {
  checkedAt: string;
  summary: PortalHealthSummary;
  results: PortalHealthResult[];
};

export type ProbeOptions = {
  timeoutMs?: number;
  concurrency?: number;
  checkedAt?: string;
  fetchImpl?: typeof fetch;
};

export const DEFAULT_HEALTH_TIMEOUT_MS = 4_000;
export const DEFAULT_HEALTH_CONCURRENCY = 10;
export const MAX_KEYS_PER_REQUEST = 12;

const USER_AGENT =
  "NagrikSaathiHealth/1.0 (+https://nagrik-saathi.vercel.app; reviewed-portal availability check)";

export function classifyHttpStatus(status: number): PortalHealthState {
  if (status >= 200 && status < 400) return "up";
  if (status === 401 || status === 403 || status === 405 || status === 429) {
    return "restricted";
  }
  if (status >= 400 && status < 500) return "down";
  return "down";
}

function noteForStatus(status: number): string {
  if (status >= 200 && status < 400) return "Responded successfully.";
  if (status === 401 || status === 403) {
    return `Responded with HTTP ${status}. The portal is reachable but blocked an automated check.`;
  }
  if (status === 405) {
    return "Responded but does not allow this request method. The portal is reachable.";
  }
  if (status === 429) {
    return "Responded with HTTP 429. The portal is rate-limiting automated checks right now.";
  }
  if (status === 404 || status === 410) {
    return `The reviewed URL returned HTTP ${status}. The portal may have moved; check the helpline.`;
  }
  if (status >= 500) {
    return `The portal returned HTTP ${status}. Try again later or use the helpline.`;
  }
  return `The portal returned HTTP ${status}. Try again later or use the helpline.`;
}

export function summarizePortalHealth(
  results: readonly PortalHealthResult[],
): PortalHealthSummary {
  return results.reduce<PortalHealthSummary>(
    (summary, result) => {
      summary.total += 1;
      summary[result.state] += 1;
      return summary;
    },
    { total: 0, up: 0, restricted: 0, down: 0 },
  );
}

export async function probePortal(
  portal: OfficialPortal,
  options: ProbeOptions = {},
): Promise<PortalHealthResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_HEALTH_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? fetch;
  const checkedAt = options.checkedAt ?? new Date().toISOString();
  const started = Date.now();

  const base = {
    key: portal.key,
    departmentName: portal.departmentName,
    region: portal.state,
    portalUrl: portal.portalUrl,
    helpline: portal.helpline,
    lastReviewed: portal.lastReviewed,
    checkedAt,
  };

  try {
    const response = await fetchImpl(portal.portalUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const latencyMs = Date.now() - started;
    // The status and TLS handshake are what we measure. Do not download the
    // page body: some portals serve large pages and this check is not a crawl.
    await response.body?.cancel().catch(() => undefined);

    return {
      ...base,
      state: classifyHttpStatus(response.status),
      httpStatus: response.status,
      latencyMs,
      note: noteForStatus(response.status),
    };
  } catch (error) {
    const latencyMs = Date.now() - started;
    const name = error instanceof Error ? error.name : "";
    const timedOut = name === "TimeoutError" || name === "AbortError";
    return {
      ...base,
      state: "down",
      httpStatus: null,
      latencyMs,
      note: timedOut
        ? `No response within ${Math.round(timeoutMs / 1_000)} seconds. The portal may be slow or unreachable from this checker.`
        : "Could not reach the portal from this checker. It may still work in your browser.",
    };
  }
}

/**
 * Probe with a small worker pool so one status page load does not open every
 * connection at once. Results keep the registry order.
 */
export async function probePortals(
  portals: readonly OfficialPortal[],
  options: ProbeOptions = {},
): Promise<PortalHealthResult[]> {
  const concurrency = Math.max(
    1,
    Math.min(options.concurrency ?? DEFAULT_HEALTH_CONCURRENCY, portals.length || 1),
  );
  const results: PortalHealthResult[] = new Array(portals.length);
  let next = 0;

  async function worker() {
    while (next < portals.length) {
      const index = next;
      next += 1;
      results[index] = await probePortal(portals[index] as OfficialPortal, options);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}
