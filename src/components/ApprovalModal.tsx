"use client";

import { useEffect, useRef } from "react";

type PendingApproval = { action: string; payload: unknown; resolve: (value: boolean) => void };

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  ta: "Tamil",
  kn: "Kannada",
  gu: "Gujarati",
  te: "Telugu",
  bn: "Bengali",
};

function humanPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Review this request before continuing.";
  }
  const data = payload as Record<string, unknown>;
  if (typeof data.title === "string" && typeof data.date === "string") {
    return `Reminder “${data.title}” for ${data.date}.`;
  }
  if (typeof data.language === "string") {
    return `Family brief in ${LANGUAGE_LABELS[data.language] ?? data.language}, with sensitive numbers redacted.`;
  }
  return "Review this request before continuing.";
}

export default function ApprovalModal({ pending }: { pending: PendingApproval }) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    function focusable(): HTMLElement[] {
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      return nodes ? Array.from(nodes) : [];
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        pending.resolve(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [pending]);

  return (
    <div
      className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-[var(--ink)]/40 p-4 sm:items-center"
      onClick={() => pending.resolve(false)}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-title"
        aria-describedby="approval-copy"
        className="anim-rise w-full max-w-md border border-[var(--line)] bg-[var(--panel)] p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Your approval</p>
        <h2 id="approval-title" className="font-display mt-2 text-2xl font-semibold tracking-tight text-[var(--ink)]">
          {pending.action}
        </h2>
        <p id="approval-copy" className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Deny cancels. Approve only prepares a file on this device—nothing is sent. Press Escape to deny.
        </p>
        <p className="mt-4 border-l-2 border-[var(--accent)] bg-[var(--wash)] px-3 py-2 text-sm leading-6 text-[var(--ink-soft)]">
          {humanPayload(pending.payload)}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={() => pending.resolve(false)}
            className="min-h-11 rounded-[var(--radius)] border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--wash)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Deny
          </button>
          <button
            type="button"
            onClick={() => pending.resolve(true)}
            className="min-h-11 rounded-[var(--radius)] bg-[var(--signal)] px-4 py-2 text-sm font-semibold text-[#fafbfc] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
