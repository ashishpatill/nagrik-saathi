import type { Metadata } from "next";
import Link from "next/link";
import PortalHealthDashboard from "@/components/PortalHealthDashboard";
import { VERIFIED_PORTALS } from "@/data/official-portals";

export const metadata: Metadata = {
  title: "Portal status | Nagrik Saathi",
  description:
    "A live reachability check for every portal in the reviewed registry, with the measured HTTP status, latency, helpline, and an honest note on what the check can and cannot prove.",
};

export default function StatusPage() {
  const portalCount = VERIFIED_PORTALS.length;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8 md:pt-12">
        <header className="anim-rise border-b border-[var(--line)] pb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                Resilience · portal health
              </p>
              <h1 className="font-display mt-3 text-[clamp(2.1rem,5vw,3.6rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-[var(--ink)]">
                Check the portal before you need it
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">
                {portalCount} reviewed portals, checked one request at a time. If a
                government site is slow or blocked, the page shows what was measured, the
                official helpline, and a last-known-good result from this browser instead
                of a blank failure.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/playbooks"
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)]"
              >
                Process playbooks
              </Link>
              <Link
                href="/"
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)]"
              >
                Back to workspace
              </Link>
            </div>
          </div>
        </header>

        <PortalHealthDashboard />

        <section aria-labelledby="failure-heading" className="mt-10">
          <h2
            id="failure-heading"
            className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)]"
          >
            When a portal is down
          </h2>
          <ol className="mt-3 grid gap-3 md:grid-cols-3">
            <li className="border border-[var(--line)] bg-[var(--panel)] p-4 text-sm leading-6 text-[var(--ink-soft)]">
              <span className="font-display block text-lg font-semibold text-[var(--ink)]">
                1. Retry later
              </span>
              Government portals often recover within minutes. Use the reviewed link, not
              a search result, so a lookalike site cannot intercept the retry.
            </li>
            <li className="border border-[var(--line)] bg-[var(--panel)] p-4 text-sm leading-6 text-[var(--ink-soft)]">
              <span className="font-display block text-lg font-semibold text-[var(--ink)]">
                2. Use the helpline
              </span>
              Every row carries the reviewed helpline. For a deadline today, call the
              department and note the time, the number, and what you were told.
            </li>
            <li className="border border-[var(--line)] bg-[var(--panel)] p-4 text-sm leading-6 text-[var(--ink-soft)]">
              <span className="font-display block text-lg font-semibold text-[var(--ink)]">
                3. Open the playbook
              </span>
              The{" "}
              <Link
                href="/playbooks"
                className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
              >
                process playbooks
              </Link>{" "}
              explain the official steps and what to carry, so a retry is not a guess.
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}
