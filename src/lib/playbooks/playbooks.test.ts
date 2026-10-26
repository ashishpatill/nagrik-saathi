import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { VERIFIED_PORTALS } from "@/data/official-portals";
import generated from "@/data/playbooks.generated.json";
import { isLanguage } from "@/lib/languages";
import {
  availableLanguages,
  getPlaybook,
  listPlaybooks,
  listPlaybooksByCategory,
  localized,
  resolvePlaybookPortals,
} from "@/lib/playbooks/registry";
import {
  EXPECTED_PLAYBOOK_SLUGS,
  GUIDANCE_ONLY_SLUG,
  playbookSchema,
  REQUIRED_WORKFLOW_SLUGS,
  type Playbook,
} from "@/lib/playbooks/schema";

const sourceDir = path.join(process.cwd(), "content", "playbooks");
const sourceFiles = readdirSync(sourceDir).filter(
  (file) => file.endsWith(".yaml") || file.endsWith(".yml"),
);

const sourcePlaybooks = sourceFiles.map((file) => {
  const parsed = playbookSchema.safeParse(parse(readFileSync(path.join(sourceDir, file), "utf8")));
  if (!parsed.success) {
    throw new Error(`${file} is invalid: ${parsed.error.message}`);
  }
  return { file, playbook: parsed.data };
});

describe("process playbook sources", () => {
  it("has the 15 planned workflows plus the Aadhaar guidance-only page", () => {
    const slugs = sourcePlaybooks.map(({ playbook }) => playbook.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of EXPECTED_PLAYBOOK_SLUGS) {
      expect(slugs).toContain(slug);
    }
    expect(slugs).toHaveLength(EXPECTED_PLAYBOOK_SLUGS.length);
    expect(slugs.filter((slug) => slug === GUIDANCE_ONLY_SLUG)).toEqual([GUIDANCE_ONLY_SLUG]);
  });

  it("matches the generated JSON registry", () => {
    const sorted = [...sourcePlaybooks]
      .map(({ playbook }) => playbook)
      .sort((left, right) => left.order - right.order);
    expect(generated).toEqual(sorted);
  });

  it("uses unique order values and non-empty localized overviews", () => {
    const orders = sourcePlaybooks.map(({ playbook }) => playbook.order);
    expect(new Set(orders).size).toBe(orders.length);

    for (const { playbook } of sourcePlaybooks) {
      for (const field of [
        playbook.title,
        playbook.summary,
        playbook.feeNote,
        playbook.timelineNote,
      ]) {
        expect(field.en.trim().length).toBeGreaterThan(0);
        expect(field.hi?.trim().length).toBeGreaterThan(0);
        expect(field.mr?.trim().length).toBeGreaterThan(0);
        for (const key of Object.keys(field)) {
          expect(isLanguage(key)).toBe(true);
        }
      }
    }
  });

  it("references only reviewed portal registry keys", () => {
    const known = new Set(VERIFIED_PORTALS.map((portal) => portal.key));
    for (const { playbook } of sourcePlaybooks) {
      for (const key of playbook.portalKeys) {
        expect(known.has(key), `${playbook.slug} -> ${key}`).toBe(true);
      }
      for (const step of playbook.steps) {
        if (step.portalKey) {
          expect(playbook.portalKeys).toContain(step.portalKey);
        }
      }
    }
  });

  it("keeps Aadhaar guidance-only and every other workflow normal", () => {
    for (const { playbook } of sourcePlaybooks) {
      expect(playbook.guidanceOnly).toBe(playbook.slug === GUIDANCE_ONLY_SLUG);
    }
    expect(REQUIRED_WORKFLOW_SLUGS).not.toContain(GUIDANCE_ONLY_SLUG);
  });

  it("has a complete, ordered process for every playbook", () => {
    for (const { playbook } of sourcePlaybooks) {
      expect(playbook.steps.length).toBeGreaterThanOrEqual(3);
      expect(playbook.documents.length).toBeGreaterThanOrEqual(1);
      expect(playbook.rejectionReasons.length).toBeGreaterThanOrEqual(1);
      expect(playbook.helplines.length).toBeGreaterThanOrEqual(1);
      expect(playbook.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("precaches every playbook and the offline core", () => {
    const precache = JSON.parse(
      readFileSync(path.join(process.cwd(), "public", "precache-manifest.json"), "utf8"),
    ) as { version: string; urls: string[] };
    const serviceWorker = readFileSync(
      path.join(process.cwd(), "public", "sw.js"),
      "utf8",
    );

    expect(precache.version).toMatch(/^nagrik-[a-f0-9]{10}$/);
    expect(new Set(precache.urls).size).toBe(precache.urls.length);
    for (const { playbook } of sourcePlaybooks) {
      expect(precache.urls).toContain(`/playbooks/${playbook.slug}`);
    }
    expect(precache.urls).toEqual(
      expect.arrayContaining([
        "/",
        "/offline",
        "/playbooks",
        "/playground",
        "/scams",
        "/status",
        "/privacy",
        "/manifest.webmanifest",
      ]),
    );
    const hash = precache.version.replace(/^nagrik-/, "");
    expect(serviceWorker).toContain(`const BUILD_HASH = "${hash}"`);
    expect(serviceWorker).toContain("const CACHE_PREFIX = \"nagrik-static-\"");
    expect(serviceWorker).toContain("const CACHE_NAME = `${CACHE_PREFIX}${BUILD_HASH}`");
    expect(serviceWorker).toContain("/precache-manifest.json");
    expect(serviceWorker).toContain("response.status >= 500");
    expect(serviceWorker).toContain('cache.match("/offline")');
    expect(serviceWorker).not.toContain("__BUILD_HASH__");
  });
});

describe("playbook registry", () => {
  it("lists playbooks in editorial order", () => {
    const listed = listPlaybooks();
    expect(listed.map((playbook) => playbook.order)).toEqual(
      [...listed.map((playbook) => playbook.order)].sort((left, right) => left - right),
    );
    expect(getPlaybook("passport")?.title.en).toContain("passport");
    expect(getPlaybook("missing")).toBeUndefined();
  });

  it("groups every playbook under a category", () => {
    const groups = listPlaybooksByCategory();
    expect(groups.flatMap((group) => group.playbooks)).toHaveLength(listPlaybooks().length);
    expect(groups.every((group) => group.label.length > 0)).toBe(true);
  });

  it("resolves portals only from the registry", () => {
    const playbook = getPlaybook("electricity-connection") as Playbook;
    const portals = resolvePlaybookPortals(playbook);
    expect(portals).toHaveLength(playbook.portalKeys.length);
    expect(portals[0]?.portalUrl).toBe("https://wss.mahadiscom.in/wss/wss");
  });

  it("reports available translations and falls back to English", () => {
    const playbook = getPlaybook("passport") as Playbook;
    expect(availableLanguages(playbook)).toEqual(["en", "hi", "mr"]);
    expect(localized(playbook.title, "hi")).toMatchObject({ fallback: false });
    expect(localized({ en: "Only English" }, "ta")).toEqual({
      value: "Only English",
      fallback: true,
    });
  });
});
