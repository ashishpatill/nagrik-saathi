import type { Metadata } from "next";
import Link from "next/link";
import {
  SCAM_LIBRARY_REVIEWED,
  SCAM_LIBRARY_VERSION,
  SCAM_PATTERNS,
  type ScamCategory,
} from "@/data/scam-patterns";
import { getPortalByKey } from "@/lib/portals";
import { reviewedPortalsForPattern } from "@/lib/scams";

export const metadata: Metadata = {
  title: "Scam pattern library | Nagrik Saathi",
  description:
    "Reviewed patterns for OTP requests, personal UPI handles, shortened links, digital arrest calls, disconnection threats, and other notice scams. A signal library, not a fraud verdict.",
};

const CATEGORY_LABELS: Record<ScamCategory, string> = {
  credentials: "Credentials",
  payment: "Payment",
  link: "Link",
  pressure: "Pressure",
  identity: "Identity",
};

const SEVERITY_LABELS = {
  high: "Strong signal",
  medium: "Review signal",
} as const;

export default function ScamsPage() {
  const cyberCrime = getPortalByKey("cybercrime");

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8 md:pt-12">
        <header className="anim-rise border-b border-[var(--line)] pb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                Scam library · reviewed {SCAM_LIBRARY_REVIEWED}
              </p>
              <h1 className="font-display mt-3 text-[clamp(2.1rem,5vw,3.6rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-[var(--ink)]">
                Know the pattern before you pay
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">
                A government notice scam usually asks for one of a few things: a
                code, a payment to a person, a click, or a document. This library
                names those patterns, explains why they work, and gives the safe
                next step.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)]"
              >
                Check a notice
              </Link>
              <Link
                href="/playbooks"
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)]"
              >
                Process playbooks
              </Link>
              <Link
                href="/status"
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)]"
              >
                Portal status
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-8 border border-[var(--warn)] bg-[var(--warn-soft)] p-5">
          <h2 className="font-display text-xl font-semibold text-[var(--warn)]">
            This is a signal library, not a fraud verdict.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--warn)]">
            A match means the notice uses a pattern that scammers also use. It
            does not prove the notice is fake. A notice with no match can still be
            fraudulent. Check the issuer, the reference number, and the
            destination before you send money or documents.
          </p>
        </section>

        <section aria-labelledby="patterns-heading" className="mt-10">
          <h2
            id="patterns-heading"
            className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)]"
          >
            {SCAM_PATTERNS.length} patterns to check before you pay
          </h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {SCAM_PATTERNS.map((pattern) => {
              const portals = reviewedPortalsForPattern(pattern);
              const severityClass =
                pattern.severity === "high" ? "text-[var(--warn)]" : "text-[var(--accent)]";
              return (
                <article
                  key={pattern.id}
                  id={pattern.id}
                  className="border border-[var(--line)] bg-[var(--panel)] p-5"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
                    <span className={severityClass}>{SEVERITY_LABELS[pattern.severity]}</span>
                    <span className="text-[var(--muted)]">{CATEGORY_LABELS[pattern.category]}</span>
                  </div>
                  <h3 className="font-display mt-2 text-xl font-semibold text-[var(--ink)]">
                    {pattern.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{pattern.summary}</p>

                  <div className="mt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                      What it looks like
                    </h4>
                    <ul className="mt-2 space-y-1 text-sm leading-6 text-[var(--ink-soft)]">
                      {pattern.signals.map((signal) => (
                        <li key={signal}>• {signal}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                      Why it matters
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                      {pattern.whyItMatters}
                    </p>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                      What to do
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                      {pattern.safeAction}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{pattern.verifyHint}</p>
                  </div>

                  {portals.length > 0 ? (
                    <div className="mt-4 border-t border-[var(--line)] pt-3">
                      <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                        Verify or report
                      </h4>
                      <ul className="mt-2 space-y-1 text-sm leading-6">
                        {portals.map((portal) => (
                          <li key={portal.key}>
                            <a
                              href={portal.portalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
                            >
                              {portal.departmentName}
                            </a>
                            <span className="text-[var(--muted)]"> · Helpline {portal.helpline}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
                    Source: {pattern.sourceNote} Reviewed {pattern.lastReviewed}.
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="review-heading" className="mt-10 grid gap-6 lg:grid-cols-2">
          <div>
            <h2
              id="review-heading"
              className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)]"
            >
              How this library is reviewed
            </h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--ink-soft)]">
              <li>
                Every pattern has at least one rule with a positive example and a
                counterexample. The test suite runs both, so a rule that flags a
                legitimate notice fails CI.
              </li>
              <li>
                A pattern is added only with a source note, a review date, and a
                safe action. Portal links come from the reviewed registry by key,
                never from a free-form URL.
              </li>
              <li>
                The library is English-only for now. The workspace explains a
                notice in eight languages, and the playbooks carry English, Hindi,
                and Marathi overviews.
              </li>
              <li>
                Version {SCAM_LIBRARY_VERSION}, last reviewed {SCAM_LIBRARY_REVIEWED}.
                A correction should name the pattern id and include the notice text
                with personal details removed.
              </li>
            </ul>
          </div>
          <div className="border border-[var(--warn)] bg-[var(--warn-soft)] p-5">
            <h2 className="font-display text-xl font-semibold text-[var(--warn)]">
              If you have already paid
            </h2>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-[var(--warn)]">
              <li>Call your bank or wallet provider and ask it to freeze or reverse the transaction.</li>
              <li>
                Report at the national Cyber Crime Portal
                {cyberCrime ? (
                  <>
                    {" "}
                    (
                    <a
                      href={cyberCrime.portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold underline underline-offset-4"
                    >
                      {cyberCrime.departmentName}
                    </a>
                    , helpline {cyberCrime.helpline})
                  </>
                ) : null}
                . Do this quickly; early reporting improves the chance of a freeze.
              </li>
              <li>Keep the message, the transaction ID, and screenshots. Do not pay more to recover the first payment.</li>
              <li>
                Change the password or PIN only from the official app or portal, not
                from a link in the message.
              </li>
            </ol>
          </div>
        </section>

        <section aria-labelledby="limits-heading" className="mt-10">
          <h2
            id="limits-heading"
            className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)]"
          >
            What this page does not do
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">
            It does not upload or analyze a notice. It does not call a number,
            message an official, pay, file, or report on your behalf. It does not
            replace the Cyber Crime Portal, your bank, or legal advice. Use the
            workspace to check a notice locally, then act through the reviewed
            portal or the printed helpline.
          </p>
        </section>
      </div>
    </main>
  );
}
