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

async function main() {
  const playbooks = await readPlaybooks();
  const serialized = `${JSON.stringify(playbooks, null, 2)}\n`;

  if (checkOnly) {
    const current = await readFile(outputPath, "utf8").catch(() => "");
    if (current !== serialized) {
      fail(
        "src/data/playbooks.generated.json is stale. Run `pnpm playbooks:build` and commit the result.",
      );
    }
    console.log(`playbooks: ${playbooks.length} valid, generated file is current`);
  } else {
    await writeFile(outputPath, serialized, "utf8");
    console.log(`playbooks: wrote ${playbooks.length} playbooks to ${path.relative(root, outputPath)}`);
  }
}

void main();
