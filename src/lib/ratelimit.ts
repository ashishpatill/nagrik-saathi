// In-memory token-bucket rate limiter for /api/discover.
//
// Scope note: this protects a single deployment region / long-lived Node
// process. If the app ever fans out across regions, replace the Map with a
// shared store (Upstash, Vercel KV) — the interface stays the same.
//
// Bucket keys never contain the raw SerpApi key: callers pass an FNV-1a
// digest so a leaked log or dump cannot expose secrets.

export type RateLimitOptions = {
  capacity: number;
  refillPerMinute: number;
  now?: () => number;
};

export type RateLimitVerdict = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const buckets = new Map<string, { tokens: number; updatedAt: number }>();
const MAX_BUCKETS = 1000;
const STALE_MS = 10 * 60 * 1000;

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (now - bucket.updatedAt > STALE_MS) buckets.delete(key);
  }
}

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitVerdict {
  const now = (options.now ?? Date.now)();
  if (buckets.size >= MAX_BUCKETS) {
    sweep(now);
    // Stale eviction alone does not bound a high-cardinality attack. Drop the
    // oldest bucket so the map can never grow past MAX_BUCKETS.
    while (buckets.size >= MAX_BUCKETS) {
      const oldest = buckets.keys().next().value;
      if (oldest === undefined) break;
      buckets.delete(oldest);
    }
  }

  const refillPerMs = options.refillPerMinute / 60_000;
  const bucket = buckets.get(key) ?? { tokens: options.capacity, updatedAt: now };
  bucket.tokens = Math.min(options.capacity, bucket.tokens + (now - bucket.updatedAt) * refillPerMs);
  bucket.updatedAt = now;

  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((1 - bucket.tokens) / refillPerMs / 1000)),
    };
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return { allowed: true, remaining: Math.floor(bucket.tokens), retryAfterSeconds: 0 };
}

export function clientIpFrom(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

// FNV-1a 32-bit: cheap, non-cryptographic, stable. Used only to build a
// rate-limit bucket key that does not retain the BYOK secret itself.
export function digestForBucket(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
