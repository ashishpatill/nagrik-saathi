"use client";

type PendingApproval = { action: string; payload: unknown; resolve: (value: boolean) => void };

export default function ApprovalModal({ pending }: { pending: PendingApproval }) {
  return (
    <div className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-[var(--ink)]/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-title"
        className="anim-rise w-full max-w-md border border-[var(--line)] bg-[var(--panel)] p-6"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Your approval</p>
        <h2 id="approval-title" className="font-display mt-2 text-2xl font-semibold tracking-tight text-[var(--ink)]">
          {pending.action}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Deny cancels the agent action. Approve only prepares a download.
        </p>
        <pre className="mt-4 max-h-32 overflow-auto bg-[var(--wash)] p-3 text-xs text-[var(--ink-soft)]">
          {JSON.stringify(pending.payload, null, 2)}
        </pre>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={() => pending.resolve(false)}
            className="rounded-[var(--radius)] border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--wash)]"
          >
            Deny
          </button>
          <button
            type="button"
            onClick={() => pending.resolve(true)}
            className="rounded-[var(--radius)] bg-[var(--signal)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
