import { VERIFIED_PORTALS } from "@/data/official-portals";

// Live official-portal discovery for Nagrik Saathi (SerpApi India Hackathon).
// Rule preserved from the project: a search result is only ever presented as
// official when its hostname matches a reviewed portal's allowedHostnames
// (or its verifiedDomain). Everything else is reported as dropped, by count,
// never as a link the user should trust.

export interface DiscoveredPortal {
  title: string;
  url: string;
  snippet: string;
  portalKey: string;
  departmentName: string;
  verifiedDomain: string;
  reviewedOn: string;
}

export interface DiscoveryResult {
  query: string;
  verified: DiscoveredPortal[];
  droppedCount: number;
  cached: boolean;
  note: string;
}

interface SerpApiOrganicResult {
  title?: string;
  link?: string;
  snippet?: string;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; result: DiscoveryResult }>();

// Key resolution for live discovery: a visitor-supplied key (BYOK, sent
// per request) wins over the server's own SERPAPI_API_KEY. Public
// deployments can therefore run with no server key at all — no shared
// key to abuse and no search charges for the operator.
export function resolveSerpApiKey(headerKey: string | null, envKey: string | undefined): string | null {
  const fromHeader = headerKey?.trim();
  if (fromHeader) return fromHeader;
  const fromEnv = envKey?.trim();
  if (fromEnv) return fromEnv;
  return null;
}

export function matchVerifiedPortal(rawUrl: string) {
  let hostname: string;
  try {
    hostname = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
  return (
    VERIFIED_PORTALS.find((portal) => {
      const allowed = [portal.verifiedDomain, ...portal.allowedHostnames].map((h) =>
        h.toLowerCase().replace(/^www\./, ""),
      );
      return allowed.some((h) => hostname === h || hostname.endsWith(`.${h}`));
    }) ?? null
  );
}

export function filterSerpResults(
  query: string,
  organic: SerpApiOrganicResult[],
): DiscoveryResult {
  const verified: DiscoveredPortal[] = [];
  let droppedCount = 0;

  for (const item of organic) {
    if (!item.link) {
      droppedCount += 1;
      continue;
    }
    const portal = matchVerifiedPortal(item.link);
    if (!portal) {
      droppedCount += 1;
      continue;
    }
    verified.push({
      title: item.title ?? portal.departmentName,
      url: item.link,
      snippet: item.snippet ?? "",
      portalKey: portal.key,
      departmentName: portal.departmentName,
      verifiedDomain: portal.verifiedDomain,
      reviewedOn: portal.lastReviewed,
    });
  }

  return {
    query,
    verified,
    droppedCount,
    cached: false,
    note:
      verified.length > 0
        ? "Only results on reviewed official domains are shown."
        : "No live result matched a reviewed official portal. Use the printed helpline or visit the department office.",
  };
}

export async function discoverOfficialPortals(
  query: string,
  apiKey: string,
  fetcher: typeof fetch = fetch,
): Promise<DiscoveryResult> {
  const cacheKey = query.trim().toLowerCase();
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return { ...hit.result, cached: true };
  }

  const params = new URLSearchParams({
    engine: "google",
    q: query,
    location: "India",
    gl: "in",
    hl: "en",
    num: "10",
    api_key: apiKey,
  });
  const response = await fetcher(`https://serpapi.com/search.json?${params}`);
  if (!response.ok) {
    throw new Error(`SerpApi request failed with status ${response.status}`);
  }
  const data = (await response.json()) as { organic_results?: SerpApiOrganicResult[] };
  const result = filterSerpResults(query, data.organic_results ?? []);
  cache.set(cacheKey, { at: Date.now(), result });
  return result;
}
