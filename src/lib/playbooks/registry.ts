import generated from "@/data/playbooks.generated.json";
import { VERIFIED_PORTALS } from "@/data/official-portals";
import { isLanguage, type Language } from "@/lib/languages";
import {
  PLAYBOOK_CATEGORIES,
  PLAYBOOK_CATEGORY_LABELS,
  type Playbook,
  type PlaybookCategory,
} from "@/lib/playbooks/schema";
import type { OfficialPortal } from "@/lib/types";

const PLAYBOOKS = generated as Playbook[];

export function listPlaybooks(): Playbook[] {
  return [...PLAYBOOKS].sort((left, right) => left.order - right.order);
}

export function getPlaybook(slug: string): Playbook | undefined {
  return PLAYBOOKS.find((playbook) => playbook.slug === slug);
}

export function listPlaybooksByCategory(): Array<{
  category: PlaybookCategory;
  label: string;
  playbooks: Playbook[];
}> {
  return PLAYBOOK_CATEGORIES.map((category) => ({
    category,
    label: PLAYBOOK_CATEGORY_LABELS[category],
    playbooks: PLAYBOOKS.filter((playbook) => playbook.category === category).sort(
      (left, right) => left.order - right.order,
    ),
  })).filter((group) => group.playbooks.length > 0);
}

export function getPortal(key: string): OfficialPortal | undefined {
  return VERIFIED_PORTALS.find((portal) => portal.key === key);
}

export function resolvePlaybookPortals(playbook: Playbook): OfficialPortal[] {
  return playbook.portalKeys
    .map((key) => getPortal(key))
    .filter((portal): portal is OfficialPortal => Boolean(portal));
}

export function availableLanguages(playbook: Playbook): Language[] {
  return Object.keys(playbook.title).filter(isLanguage);
}

export function localized(
  text: Partial<Record<Language, string>>,
  language: Language,
): { value: string; fallback: boolean } {
  const value = text[language] ?? text.en;
  return { value: value ?? "", fallback: language !== "en" && !text[language] };
}
