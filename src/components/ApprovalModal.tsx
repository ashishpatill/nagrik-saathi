"use client";

import { useEffect } from "react";

type PendingApproval = { action: string; payload: unknown; resolve: (value: boolean) => void };

function humanPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Review this request before continuing.";
  }
  const data = payload as Record<string, unknown>;
  if (typeof data.title === "string" && typeof data.date === "string") {
    return `Reminder “${data.title}” for ${data.date}.`;
  }
  if (typeof data.language === "string") {
    const labels: Record<string, string> = { en: "English", hi: "Hindi", mr: "Marathi" };
    return `Family brief in ${labels[data.language] ?? data.language}, with sensitive numbers redacted.`;
  }
  return "Review this request before continuing.";
}

export default function ApprovalModal({ pending }: { pending: PendingApproval }) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        pending.resolve(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pending]);

  return (
    <div
      className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-[var(--ink)]/40 p-4 sm:items-center"
      onClick={() => pending.resolve(false)}
      role="presentation"
    >
      <div
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
            className="min-h-11 rounded-[var(--radius)] border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--wash)]"
          >
            Deny
          </button>
          <button
            type="button"
            onClick={() => pending.resolve(true)}
            className="min-h-11 rounded-[var(--radius)] bg-[var(--signal)] px-4 py-2 text-sm font-semibold text-[#fafbfc] hover:brightness-110"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
