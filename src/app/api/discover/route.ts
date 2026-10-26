import { NextResponse } from "next/server";

import { discoverOfficialPortals, resolveSerpApiKey } from "@/lib/discovery";
import { checkRateLimit, clientIpFrom, digestForBucket } from "@/lib/ratelimit";
import { z } from "zod";

const querySchema = z.object({
  q: z.string().trim().min(3).max(120),
});

// Polite-crawler limits: burst capacity, then a steady per-minute refill.
// Two buckets per request — one per client IP, one per SerpApi key (hashed,
// never stored raw) — so a shared BYOK key or one busy office IP cannot
// burn the discovery quota for everyone else.
const IP_LIMIT = { capacity: 10, refillPerMinute: 20 };
const KEY_LIMIT = { capacity: 15, refillPerMinute: 30 };

function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many discovery requests. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid discovery query." }, { status: 400 });
  }

  const ipVerdict = checkRateLimit(`discover:ip:${clientIpFrom(request)}`, IP_LIMIT);
  if (!ipVerdict.allowed) return tooManyRequests(ipVerdict.retryAfterSeconds);

  const apiKey = resolveSerpApiKey(request.headers.get("x-serpapi-key"), process.env.SERPAPI_API_KEY);
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Live discovery needs a SerpApi key. Add your own free key in the field above (it stays in your browser), or configure SERPAPI_API_KEY on the server.",
      },
      { status: 503 },
    );
  }

  const keyVerdict = checkRateLimit(`discover:key:${digestForBucket(apiKey)}`, KEY_LIMIT);
  if (!keyVerdict.allowed) return tooManyRequests(keyVerdict.retryAfterSeconds);

  try {
    const result = await discoverOfficialPortals(parsed.data.q, apiKey);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Live discovery failed. Try the reviewed portal directory instead." },
      { status: 502 },
    );
  }
}
