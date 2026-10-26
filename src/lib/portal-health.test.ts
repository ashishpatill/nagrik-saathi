import { describe, expect, it, vi } from "vitest";
import { VERIFIED_PORTALS } from "@/data/official-portals";
import {
  classifyHttpStatus,
  probePortal,
  probePortals,
  summarizePortalHealth,
  type PortalHealthResult,
} from "@/lib/portal-health";
import type { OfficialPortal } from "@/lib/types";

const portal: OfficialPortal = {
  key: "test_portal",
  departmentName: "Test department",
  state: "India",
  verifiedDomain: "example.gov.in",
  allowedHostnames: ["example.gov.in"],
  portalUrl: "https://example.gov.in/",
  helpline: "0000",
  allowedServices: ["test"],
  lastReviewed: "2026-10-26",
};

function responseWith(status: number): Response {
  return {
    status,
    body: { cancel: async () => undefined },
  } as unknown as Response;
}

describe("portal health classification", () => {
  it("treats 2xx and 3xx as up", () => {
    expect(classifyHttpStatus(200)).toBe("up");
    expect(classifyHttpStatus(204)).toBe("up");
    expect(classifyHttpStatus(302)).toBe("up");
  });

  it("treats auth, method, and rate-limit responses as restricted", () => {
    expect(classifyHttpStatus(401)).toBe("restricted");
    expect(classifyHttpStatus(403)).toBe("restricted");
    expect(classifyHttpStatus(405)).toBe("restricted");
    expect(classifyHttpStatus(429)).toBe("restricted");
  });

  it("treats client and server errors as down", () => {
    expect(classifyHttpStatus(404)).toBe("down");
    expect(classifyHttpStatus(500)).toBe("down");
    expect(classifyHttpStatus(503)).toBe("down");
  });
});

describe("portal probing", () => {
  it("records the status, latency, and checked time", async () => {
    const result = await probePortal(portal, {
      checkedAt: "2026-10-26T10:00:00.000Z",
      fetchImpl: vi.fn(async () => responseWith(200)) as unknown as typeof fetch,
    });

    expect(result).toMatchObject({
      key: "test_portal",
      state: "up",
      httpStatus: 200,
      checkedAt: "2026-10-26T10:00:00.000Z",
    });
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.note).toContain("Responded successfully");
  });

  it("keeps a blocked automated check as restricted, not down", async () => {
    const result = await probePortal(portal, {
      fetchImpl: vi.fn(async () => responseWith(403)) as unknown as typeof fetch,
    });

    expect(result.state).toBe("restricted");
    expect(result.httpStatus).toBe(403);
    expect(result.note).toContain("blocked an automated check");
  });

  it("reports a timeout as down with the timeout in the note", async () => {
    const timeoutError = new Error("timed out");
    timeoutError.name = "TimeoutError";
    const result = await probePortal(portal, {
      timeoutMs: 2_500,
      fetchImpl: vi.fn(async () => {
        throw timeoutError;
      }) as unknown as typeof fetch,
    });

    expect(result.state).toBe("down");
    expect(result.httpStatus).toBeNull();
    expect(result.note).toContain("3 seconds");
  });

  it("probes in registry order with a bounded worker pool", async () => {
    let active = 0;
    let peak = 0;
    const fetchImpl = vi.fn(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return responseWith(200);
    }) as unknown as typeof fetch;

    const results = await probePortals(VERIFIED_PORTALS.slice(0, 8), {
      concurrency: 3,
      fetchImpl,
    });

    expect(results.map((result) => result.key)).toEqual(
      VERIFIED_PORTALS.slice(0, 8).map((entry) => entry.key),
    );
    expect(peak).toBeLessThanOrEqual(3);
    expect(results.every((result) => result.state === "up")).toBe(true);
  });
});

describe("portal health summary", () => {
  it("counts each state and the total", () => {
    const results = ["up", "up", "restricted", "down"].map(
      (state, index) =>
        ({
          state,
          key: `p${index}`,
        }) as PortalHealthResult,
    );
    expect(summarizePortalHealth(results)).toEqual({
      total: 4,
      up: 2,
      restricted: 1,
      down: 1,
    });
  });

  it("returns zeros for an empty set", () => {
    expect(summarizePortalHealth([])).toEqual({
      total: 0,
      up: 0,
      restricted: 0,
      down: 0,
    });
  });
});
