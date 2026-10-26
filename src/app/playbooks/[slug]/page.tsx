import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PlaybookDetail from "@/components/PlaybookDetail";
import {
  getPlaybook,
  listPlaybooks,
  resolvePlaybookPortals,
} from "@/lib/playbooks/registry";

type PlaybookPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listPlaybooks().map((playbook) => ({ slug: playbook.slug }));
}

export async function generateMetadata({ params }: PlaybookPageProps): Promise<Metadata> {
  const { slug } = await params;
  const playbook = getPlaybook(slug);
  if (!playbook) return { title: "Playbook not found | Nagrik Saathi" };

  const description = playbook.summary.en.replace(/\s+/g, " ").slice(0, 155);
  return {
    title: `${playbook.title.en} | Nagrik Saathi`,
    description,
    openGraph: {
      title: playbook.title.en,
      description,
      type: "article",
    },
  };
}

export default async function PlaybookPage({ params }: PlaybookPageProps) {
  const { slug } = await params;
  const playbook = getPlaybook(slug);
  if (!playbook) notFound();

  return <PlaybookDetail playbook={playbook} portals={resolvePlaybookPortals(playbook)} />;
}
