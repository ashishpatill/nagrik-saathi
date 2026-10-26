import { describe, expect, it } from "vitest";
import { checkRateLimit, clientIpFrom, digestForBucket } from "@/lib/ratelimit";

// Manual clock: time only moves when advance() says so, so refills never
// quietly offset consumption between calls.
function clock(start = 0) {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

describe("discover rate limit", () => {
  it("allows a burst up to capacity, then refuses with a retry hint", () => {
    const time = clock();
    for (let i = 0; i < 5; i += 1) {
      expect(checkRateLimit("ip:a", { capacity: 5, refillPerMinute: 6, now: time.now }).allowed).toBe(true);
    }
    const verdict = checkRateLimit("ip:a", { capacity: 5, refillPerMinute: 6, now: time.now });
    expect(verdict.allowed).toBe(false);
    expect(verdict.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("refills tokens over time", () => {
    const time = clock();
    for (let i = 0; i < 3; i += 1) {
      checkRateLimit("ip:b", { capacity: 3, refillPerMinute: 6, now: time.now });
    }
    expect(checkRateLimit("ip:b", { capacity: 3, refillPerMinute: 6, now: time.now }).allowed).toBe(false);
    // 6/min refills ~12 tokens over two minutes: the bucket recovers.
    time.advance(120_000);
    expect(checkRateLimit("ip:b", { capacity: 3, refillPerMinute: 6, now: time.now }).allowed).toBe(true);
  });

  it("keeps buckets independent", () => {
    const time = clock();
    for (let i = 0; i < 3; i += 1) {
      checkRateLimit("ip:c", { capacity: 3, refillPerMinute: 6, now: time.now });
    }
    expect(checkRateLimit("ip:c", { capacity: 3, refillPerMinute: 6, now: time.now }).allowed).toBe(false);
    expect(checkRateLimit("ip:d", { capacity: 3, refillPerMinute: 6, now: time.now }).allowed).toBe(true);
  });

  it("derives one stable, non-reversible bucket digest per key", () => {
    expect(digestForBucket("secret-key")).toBe(digestForBucket("secret-key"));
    expect(digestForBucket("secret-key")).not.toBe(digestForBucket("secret-key-2"));
    expect(digestForBucket("secret-key")).toMatch(/^[0-9a-f]{8}$/);
  });

  it("bounds the bucket map and evicts the oldest key", () => {
    const time = clock();
    for (let i = 0; i < 1005; i += 1) {
      expect(
        checkRateLimit(`cap:${i}`, { capacity: 1, refillPerMinute: 0, now: time.now }).allowed,
      ).toBe(true);
    }
    // `cap:0` was evicted to keep the map bounded, so its bucket is fresh again.
    expect(
      checkRateLimit("cap:0", { capacity: 1, refillPerMinute: 0, now: time.now }).allowed,
    ).toBe(true);
  });

  it("reads the client IP from proxy headers", () => {
    const request = new Request("https://example.com/api/discover", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(clientIpFrom(request)).toBe("203.0.113.7");
    expect(clientIpFrom(new Request("https://example.com/api/discover"))).toBe("unknown");
  });
});
