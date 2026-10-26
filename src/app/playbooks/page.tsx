import type { Metadata } from "next";
import Link from "next/link";
import { listPlaybooksByCategory, listPlaybooks } from "@/lib/playbooks/registry";

export const metadata: Metadata = {
  title: "Process playbooks | Nagrik Saathi",
  description:
    "Fifteen reviewed Indian government workflows plus Aadhaar guidance: steps, documents, fees, timelines, common rejection reasons, and official portal links.",
};

export default function PlaybooksPage() {
  const groups = listPlaybooksByCategory();
  const playbooks = listPlaybooks();
  const workflowCount = playbooks.filter((playbook) => !playbook.guidanceOnly).length;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8 md:pt-12">
        <header className="anim-rise border-b border-[var(--line)] pb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                Process guidance · public playbooks
              </p>
              <h1 className="font-display mt-3 text-[clamp(2.1rem,5vw,3.6rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-[var(--ink)]">
                Know the steps before you open the portal
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">
                {workflowCount} reviewed workflows, plus one Aadhaar guidance page. Each playbook
                lists the likely steps, documents, fees, timelines, and rejection reasons, and links
                only to the human-reviewed portal registry.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)]"
            >
              Back to workspace
            </Link>
            <Link
              href="/status"
              className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)]"
            >
              Portal status
            </Link>
            <Link
              href="/privacy"
              className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)]"
            >
              Your data
            </Link>
          </div>

          <div className="mt-6 border border-[var(--line)] bg-[var(--warn-soft)] px-4 py-3 text-xs leading-5 text-[var(--warn)]">
            <span className="font-semibold uppercase tracking-[0.12em]">Guidance, not a filing service</span>
            <p className="mt-1">
              These pages explain a process. Nagrik Saathi does not log in, pay, submit, or send
              anything for you. Fees and timelines change; confirm the current rule on the official
              portal before acting.
            </p>
          </div>
        </header>

        <div className="mt-8 space-y-10">
          {groups.map((group) => (
            <section key={group.category} aria-labelledby={`category-${group.category}`}>
              <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] pb-2">
                <h2
                  id={`category-${group.category}`}
                  className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)]"
                >
                  {group.label}
                </h2>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  {group.playbooks.length} {group.playbooks.length === 1 ? "playbook" : "playbooks"}
                </p>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {group.playbooks.map((playbook) => (
                  <Link
                    key={playbook.slug}
                    href={`/playbooks/${playbook.slug}`}
                    className="group flex h-full flex-col border border-[var(--line)] bg-[var(--panel)] p-5 transition hover:border-[var(--accent)]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="border border-[var(--line)] bg-[var(--wash)] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                        v{playbook.version}
                      </span>
                      {playbook.guidanceOnly ? (
                        <span className="border border-[var(--warn)] bg-[var(--warn-soft)] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--warn)]">
                          Guidance only
                        </span>
                      ) : null}
                      <span className="text-xs text-[var(--muted)]">
                        Reviewed {playbook.lastReviewed}
                      </span>
                    </div>
                    <h3 className="font-display mt-3 text-xl font-semibold leading-tight text-[var(--ink)] group-hover:text-[var(--accent)]">
                      {playbook.title.en}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--ink-soft)]">
                      {playbook.summary.en}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-xs text-[var(--muted)]">
                      <span>{playbook.steps.length} steps</span>
                      <span>{playbook.documents.length} documents</span>
                      <span>{Object.keys(playbook.title).length} languages</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-12 border-t border-[var(--line)] pt-5 text-sm leading-6 text-[var(--muted)]">
          <p>
            Playbooks are versioned YAML in the repository. To correct one, open the contribution
            guide in{" "}
            <a
              href="https://github.com/ashishpatill/nagrik-saathi/blob/master/docs/PLAYBOOKS.md"
              className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
            >
              docs/PLAYBOOKS.md
            </a>{" "}
            and include an official source with the proposed change.
          </p>
        </footer>
      </div>
    </main>
  );
}
