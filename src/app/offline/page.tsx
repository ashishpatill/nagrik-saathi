import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline | Nagrik Saathi",
  description: "This page is not available offline yet.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-16 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
          Offline
        </p>
        <h1 className="font-display mt-3 text-[clamp(2.1rem,6vw,3.6rem)] font-semibold leading-[1] tracking-[-0.03em] text-[var(--ink)]">
          This page is not cached yet
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--ink-soft)]">
          The pages you visited before going offline are still available, including the
          playbooks, the reviewed portal registry, and your saved case. Open a page you
          used earlier, or reconnect and try again.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/playbooks"
            className="rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Cached playbooks
          </Link>
          <Link
            href="/"
            className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)]"
          >
            Back to workspace
          </Link>
        </div>
        <p className="mt-6 border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
          Nagrik Saathi never uploads the notice you paste or photograph. Offline simply
          means the network is unavailable, not that anything was sent.
        </p>
      </div>
    </main>
  );
}
