"use client";

import Link from "next/link";
import { useState } from "react";
import { LANGUAGE_LABELS, isLanguage, type Language } from "@/lib/languages";
import type { Playbook } from "@/lib/playbooks/schema";
import type { OfficialPortal } from "@/lib/types";

type PlaybookDetailProps = {
  playbook: Playbook;
  portals: OfficialPortal[];
};

const GUIDANCE_COPY: Record<"en" | "hi" | "mr", string> = {
  en: "Guidance only. This page never asks for, stores, or verifies an Aadhaar number. Do not enter one here.",
  hi: "केवल मार्गदर्शन। यह पृष्ठ आधार संख्या कभी नहीं माँगता, संग्रहीत या सत्यापित नहीं करता। यहाँ आधार संख्या न लिखें।",
  mr: "केवळ मार्गदर्शन. हे पान आधार क्रमांक कधीही मागत नाही, साठवत नाही किंवा पडताळत नाही. येथे आधार क्रमांक लिहू नका.",
};

function pick(text: Partial<Record<Language, string>>, language: Language) {
  const value = text[language] ?? text.en ?? "";
  return { value, fallback: language !== "en" && !text[language] };
}

export default function PlaybookDetail({ playbook, portals }: PlaybookDetailProps) {
  const available = Object.keys(playbook.title).filter(isLanguage);
  const [language, setLanguage] = useState<Language>("en");

  const title = pick(playbook.title, language);
  const summary = pick(playbook.summary, language);
  const fee = pick(playbook.feeNote, language);
  const timeline = pick(playbook.timelineNote, language);
  const detailFields = [
    ...playbook.steps.flatMap((step) => [step.title, step.detail]),
    ...playbook.documents,
    ...playbook.rejectionReasons,
  ];
  const fullDetail = detailFields.every((field) => Boolean(field[language]));

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-8 md:px-8 md:pt-12">
        <nav aria-label="Breadcrumb" className="text-sm">
          <Link
            href="/playbooks"
            className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
          >
            ← All process playbooks
          </Link>
        </nav>

        <header className="anim-rise mt-6 border-b border-[var(--line)] pb-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="border border-[var(--line)] bg-[var(--wash)] px-2 py-0.5 font-semibold uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                  Playbook v{playbook.version}
                </span>
                <span className="font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
                  {playbook.category}
                </span>
                <span className="text-[var(--muted)]">Reviewed {playbook.lastReviewed}</span>
              </div>
              <h1 className="font-display mt-3 text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1] tracking-[-0.03em] text-[var(--ink)]">
                {title.value}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">
                {summary.value}
              </p>
            </div>

            <div className="shrink-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Read in
              </p>
              <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label="Playbook language">
                {available.map((code) => (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={language === code}
                    onClick={() => setLanguage(code)}
                    className={`border px-3 py-1.5 text-xs font-semibold transition ${
                      language === code
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink-soft)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {LANGUAGE_LABELS[code].native}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {playbook.guidanceOnly ? (
            <div className="mt-5 border border-[var(--warn)] bg-[var(--warn-soft)] px-4 py-3 text-sm leading-6 text-[var(--warn)]">
              {GUIDANCE_COPY[language === "hi" || language === "mr" ? language : "en"]}
            </div>
          ) : null}

          {!fullDetail ? (
            <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
              The overview, fee, and timeline are available in{" "}
              {available.map((code) => LANGUAGE_LABELS[code].native).join(", ")}. Step details,
              documents, and rejection reasons are English-only for now and fall back to English.
            </p>
          ) : null}
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.55fr_0.9fr]">
          <div>
            <section aria-labelledby="steps-title">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="steps-title" className="font-display text-2xl font-semibold tracking-tight">
                  Steps
                </h2>
                <p className="text-xs text-[var(--muted)]">{playbook.steps.length} stages</p>
              </div>
              <ol className="mt-4 space-y-4">
                {playbook.steps.map((step, index) => {
                  const stepTitle = pick(step.title, language);
                  const stepDetail = pick(step.detail, language);
                  const portal = step.portalKey
                    ? portals.find((entry) => entry.key === step.portalKey)
                    : undefined;
                  return (
                    <li
                      key={`${playbook.slug}-step-${index}`}
                      className="border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] font-mono text-xs font-semibold text-white"
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold leading-6 text-[var(--ink)]">
                            {stepTitle.value}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">
                            {stepDetail.value}
                          </p>
                          {portal ? (
                            <a
                              href={portal.portalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-block text-sm font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
                            >
                              Open {portal.departmentName} →
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section aria-labelledby="rejections-title" className="mt-8">
              <h2
                id="rejections-title"
                className="font-display text-2xl font-semibold tracking-tight"
              >
                Common rejection reasons
              </h2>
              <ul className="mt-3 space-y-2">
                {playbook.rejectionReasons.map((reason, index) => (
                  <li
                    key={`${playbook.slug}-rejection-${index}`}
                    className="border-l-2 border-[var(--warn)] bg-[var(--warn-soft)] px-4 py-2 text-sm leading-6 text-[var(--warn)]"
                  >
                    {pick(reason, language).value}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="space-y-4">
            <section
              aria-labelledby="glance-title"
              className="border border-[var(--line)] bg-[var(--panel)] p-5"
            >
              <h2 id="glance-title" className="font-display text-xl font-semibold tracking-tight">
                At a glance
              </h2>
              <dl className="mt-4 space-y-4 text-sm leading-6">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    Fee
                  </dt>
                  <dd className="mt-1 text-[var(--ink-soft)]">{fee.value}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    Typical timeline
                  </dt>
                  <dd className="mt-1 text-[var(--ink-soft)]">{timeline.value}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    Helplines
                  </dt>
                  <dd className="mt-1 space-y-1 text-[var(--ink-soft)]">
                    {playbook.helplines.map((helpline) => (
                      <p key={helpline}>{helpline}</p>
                    ))}
                  </dd>
                </div>
              </dl>
            </section>

            <section
              aria-labelledby="documents-title"
              className="border border-[var(--line)] bg-[var(--panel)] p-5"
            >
              <h2 id="documents-title" className="font-display text-xl font-semibold tracking-tight">
                Keep these documents
              </h2>
              <ul className="mt-3 space-y-2">
                {playbook.documents.map((document, index) => (
                  <li
                    key={`${playbook.slug}-document-${index}`}
                    className="flex gap-2 text-sm leading-6 text-[var(--ink-soft)]"
                  >
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--accent)]" />
                    <span>{pick(document, language).value}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="portals-title"
              className="border border-[var(--line)] bg-[var(--panel)] p-5"
            >
              <h2 id="portals-title" className="font-display text-xl font-semibold tracking-tight">
                Official portals
              </h2>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                Human-reviewed registry entries. Open them yourself; this app never logs in, pays,
                or submits.
              </p>
              <ul className="mt-3 space-y-3">
                {portals.map((portal) => (
                  <li key={portal.key} className="border-t border-[var(--line)] pt-3 first:border-0 first:pt-0">
                    <a
                      href={portal.portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
                    >
                      {portal.departmentName} ↗
                    </a>
                    <p className="mt-1 font-mono text-xs text-[var(--muted)]">{portal.verifiedDomain}</p>
                  </li>
                ))}
              </ul>
            </section>

            <p className="border border-[var(--line)] bg-[var(--wash)] px-4 py-3 text-xs leading-5 text-[var(--ink-soft)]">
              This is guidance, not an official government decision. Confirm fees, forms, and
              deadlines on the linked portal or at the office before acting.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
