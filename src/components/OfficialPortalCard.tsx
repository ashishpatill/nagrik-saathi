import { getPortalByKey } from "@/lib/portals";
import { validateOfficialPortal } from "@/lib/safety";

export default function OfficialPortalCard({
  departmentKey,
  highlightUrl = null,
}: {
  departmentKey: string;
  highlightUrl?: string | null;
}) {
  const portal = getPortalByKey(departmentKey);
  if (!portal || !validateOfficialPortal(portal)) {
    return (
      <div className="border-t border-[var(--line)] pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--warn)]">Official channel</p>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
          No reviewed portal matched this notice. Use the printed helpline or visit the department office.
        </p>
      </div>
    );
  }

  const emphasized = Boolean(highlightUrl && highlightUrl === portal.portalUrl);

  return (
    <div
      className={`border-t border-[var(--line)] pt-5 ${emphasized ? "rounded-[var(--radius)] bg-[var(--accent-soft)] px-4 pb-4" : ""}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--signal)]">Reviewed official channel</p>
      <h3 className="mt-2 text-base font-semibold text-[var(--ink)]">{portal.departmentName}</h3>
      <p className="mt-1 font-mono text-xs text-[var(--muted)]">{portal.verifiedDomain}</p>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--ink-soft)]">
        Helpline <strong>{portal.helpline}</strong>. You open, log in, and act on the official site yourself.
      </p>
      <a
        href={portal.portalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex rounded-[calc(var(--radius)-2px)] bg-[var(--ink)] px-3.5 py-2 text-xs font-semibold text-[#fafbfc] hover:bg-[var(--accent)] hover:text-[#fafbfc]"
      >
        Open official portal
      </a>
    </div>
  );
}
