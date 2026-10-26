import { VERIFIED_PORTALS } from "@/data/official-portals";
import { checkRateLimit, clientIpFrom } from "@/lib/ratelimit";
import {
  MAX_KEYS_PER_REQUEST,
  probePortals,
  summarizePortalHealth,
} from "@/lib/portal-health";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// The dashboard sends four small batches in parallel. Keeping each request
// bounded avoids a 15–25 second function for the full 39-portal registry.
const IP_LIMIT = { capacity: 20, refillPerMinute: 60 };

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawKeys = url.searchParams.get("keys");
  const rawTimeout = url.searchParams.get("timeoutMs");

  let portals = VERIFIED_PORTALS;
  if (rawKeys) {
    const keys = rawKeys
      .split(",")
      .map((key) => key.trim())
      .filter(Boolean);
    if (keys.length === 0 || keys.length > MAX_KEYS_PER_REQUEST) {
      return badRequest(`Pass between 1 and ${MAX_KEYS_PER_REQUEST} portal keys per request.`);
    }
    const wanted = new Set(keys);
    portals = VERIFIED_PORTALS.filter((portal) => wanted.has(portal.key));
    if (portals.length !== wanted.size) {
      return badRequest("One or more portal keys are not in the reviewed registry.");
    }
  } else if (VERIFIED_PORTALS.length > MAX_KEYS_PER_REQUEST) {
    return badRequest(
      `Pass up to ${MAX_KEYS_PER_REQUEST} comma-separated registry keys. The dashboard batches the full registry.`,
    );
  }

  const verdict = checkRateLimit(`health:ip:${clientIpFrom(request)}`, IP_LIMIT);
  if (!verdict.allowed) {
    return NextResponse.json(
      { error: "Too many health checks. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(verdict.retryAfterSeconds) },
      },
    );
  }

  const timeoutMs = rawTimeout ? Number(rawTimeout) : undefined;
  const checkedAt = new Date().toISOString();
  const results = await probePortals(portals, {
    checkedAt,
    timeoutMs:
      timeoutMs && Number.isFinite(timeoutMs) && timeoutMs >= 1_000 && timeoutMs <= 10_000
        ? timeoutMs
        : undefined,
  });

  return NextResponse.json(
    {
      checkedAt,
      summary: summarizePortalHealth(results),
      results,
    },
    {
      headers: {
        // A short edge cache keeps a busy dashboard from probing on every
        // refresh. The stale copy stays available while a fresh check runs.
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    },
  );
}
