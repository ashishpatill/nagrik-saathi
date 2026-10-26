import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import { VERIFIED_PORTALS } from "../src/data/official-portals";
import {
  EXPECTED_PLAYBOOK_SLUGS,
  GUIDANCE_ONLY_SLUG,
  playbookSchema,
  REQUIRED_WORKFLOW_SLUGS,
  type Playbook,
} from "../src/lib/playbooks/schema";

const root = process.cwd();
const sourceDir = path.join(root, "content", "playbooks");
const outputPath = path.join(root, "src", "data", "playbooks.generated.json");
const precachePath = path.join(root, "public", "precache-manifest.json");
const swTemplatePath = path.join(root, "scripts", "sw-template.js");
const swPath = path.join(root, "public", "sw.js");
const checkOnly = process.argv.includes("--check");

function fail(message: string): never {
  console.error(`playbooks: ${message}`);
  process.exit(1);
}

async function readPlaybooks(): Promise<Playbook[]> {
  const files = (await readdir(sourceDir))
    .filter((file) => file.endsWith(".yaml") || file.endsWith(".yml"))
    .sort();

  if (files.length === 0) fail(`no YAML files found in ${sourceDir}`);

  const playbooks: Playbook[] = [];
  for (const file of files) {
    const raw = await readFile(path.join(sourceDir, file), "utf8");
    const parsed = playbookSchema.safeParse(parse(raw));
    if (!parsed.success) {
      fail(`${file} failed schema validation:\n${z.prettifyError(parsed.error)}`);
    }
    const playbook = parsed.data;
    const expectedFile = `${playbook.slug}.yaml`;
    if (file !== expectedFile && file !== `${playbook.slug}.yml`) {
      fail(`${file} declares slug "${playbook.slug}"; rename the file to ${expectedFile}`);
    }
    playbooks.push(playbook);
  }

  const slugs = new Set<string>();
  const orders = new Set<number>();
  for (const playbook of playbooks) {
    if (slugs.has(playbook.slug)) fail(`duplicate slug "${playbook.slug}"`);
    if (orders.has(playbook.order)) fail(`duplicate order ${playbook.order}`);
    slugs.add(playbook.slug);
    orders.add(playbook.order);
  }

  for (const slug of EXPECTED_PLAYBOOK_SLUGS) {
    if (!slugs.has(slug)) fail(`missing required playbook "${slug}"`);
  }

  const guidanceOnly = playbooks.filter((playbook) => playbook.guidanceOnly);
  if (guidanceOnly.length !== 1 || guidanceOnly[0]?.slug !== GUIDANCE_ONLY_SLUG) {
    fail(`only "${GUIDANCE_ONLY_SLUG}" may be guidance-only`);
  }

  const workflows = playbooks.filter((playbook) => !playbook.guidanceOnly);
  if (workflows.length < REQUIRED_WORKFLOW_SLUGS.length) {
    fail(`expected at least ${REQUIRED_WORKFLOW_SLUGS.length} workflows, found ${workflows.length}`);
  }

  const knownPortals = new Set(VERIFIED_PORTALS.map((portal) => portal.key));
  for (const playbook of playbooks) {
    for (const key of playbook.portalKeys) {
      if (!knownPortals.has(key)) {
        fail(`${playbook.slug} references unknown portal key "${key}"`);
      }
    }
  }

  return playbooks.sort((left, right) => left.order - right.order);
}

function buildHash(
  playbooks: Playbook[],
  template: string,
  urls: readonly string[],
): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        playbooks: playbooks.map((playbook) => ({
          slug: playbook.slug,
          version: playbook.version,
          lastReviewed: playbook.lastReviewed,
        })),
        worker: template,
        urls,
      }),
    )
    .digest("hex")
    .slice(0, 10);
}

const CORE_PRECACHE_URLS = [
  "/",
  "/offline",
  "/playbooks",
  "/playground",
  "/status",
  "/llms.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
] as const;

function precacheUrls(playbooks: Playbook[]): string[] {
  return [
    ...CORE_PRECACHE_URLS,
    ...playbooks.map((playbook) => `/playbooks/${playbook.slug}`),
  ];
}

function serializePrecache(urls: readonly string[], hash: string): string {
  return `${JSON.stringify({ version: `nagrik-${hash}`, urls }, null, 2)}\n`;
}

function serializeServiceWorker(template: string, hash: string): string {
  return template.replaceAll("__BUILD_HASH__", hash);
}

async function main() {
  const playbooks = await readPlaybooks();
  const swTemplate = await readFile(swTemplatePath, "utf8");
  const urls = precacheUrls(playbooks);
  const hash = buildHash(playbooks, swTemplate, urls);
  const serialized = `${JSON.stringify(playbooks, null, 2)}\n`;
  const precache = serializePrecache(urls, hash);
  const serviceWorker = serializeServiceWorker(swTemplate, hash);

  if (checkOnly) {
    const current = await readFile(outputPath, "utf8").catch(() => "");
    const currentPrecache = await readFile(precachePath, "utf8").catch(() => "");
    const currentServiceWorker = await readFile(swPath, "utf8").catch(() => "");
    if (current !== serialized) {
      fail(
        "src/data/playbooks.generated.json is stale. Run `pnpm playbooks:build` and commit the result.",
      );
    }
    if (currentPrecache !== precache) {
      fail(
        "public/precache-manifest.json is stale. Run `pnpm playbooks:build` and commit the result.",
      );
    }
    if (currentServiceWorker !== serviceWorker) {
      fail(
        "public/sw.js is stale. Run `pnpm playbooks:build` and commit the result.",
      );
    }
    console.log(
      `playbooks: ${playbooks.length} valid, generated registry, precache manifest, and service worker are current`,
    );
  } else {
    await writeFile(outputPath, serialized, "utf8");
    await writeFile(precachePath, precache, "utf8");
    await writeFile(swPath, serviceWorker, "utf8");
    console.log(
      `playbooks: wrote ${playbooks.length} playbooks, the precache manifest, and the service worker (${hash})`,
    );
  }
}

void main();
