"use client";

import { useMemo, useState } from "react";
import { VERIFIED_PORTALS } from "@/data/official-portals";
import { validateOfficialPortal } from "@/lib/safety";

export default function ReviewedPortalDirectory({ activeKey = "" }: { activeKey?: string }) {
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<"all" | "Maharashtra" | "India">("all");

  const portals = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return VERIFIED_PORTALS.filter((portal) => {
      if (!validateOfficialPortal(portal)) return false;
      if (stateFilter !== "all" && portal.state !== stateFilter) return false;
      if (!needle) return true;
      return (
        portal.departmentName.toLowerCase().includes(needle) ||
        portal.verifiedDomain.toLowerCase().includes(needle) ||
        portal.allowedServices.some((service) => service.toLowerCase().includes(needle))
      );
    });
  }, [query, stateFilter]);

  return (
    <div className="border-t border-[var(--line)] pt-8">
      <h3 className="text-sm font-semibold text-[var(--ink)]">Browse reviewed channels</h3>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
        {VERIFIED_PORTALS.length} curated HTTPS portals. The card above is the best match for this notice; use this
        list if you need another reviewed department.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search department or domain"
          className="min-w-[12rem] flex-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        <select
          value={stateFilter}
          onChange={(event) => setStateFilter(event.target.value as "all" | "Maharashtra" | "India")}
          className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-2 py-2 text-xs"
        >
          <option value="all">All states</option>
          <option value="Maharashtra">Maharashtra</option>
          <option value="India">India-wide</option>
        </select>
      </div>
      <ul className="mt-4 max-h-72 divide-y divide-[var(--line)] overflow-y-auto border-y border-[var(--line)]">
        {portals.map((portal) => {
          const active = portal.key === activeKey;
          return (
            <li key={portal.key} className={`py-3 ${active ? "bg-[var(--accent-soft)]" : ""}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--ink)]">
                    {portal.departmentName}
                    {active ? <span className="ml-2 text-[11px] font-semibold text-[var(--signal)]">Matched</span> : null}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-[var(--muted)]">{portal.verifiedDomain}</p>
                </div>
                <a
                  href={portal.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
                >
                  Open
                </a>
              </div>
            </li>
          );
        })}
        {portals.length === 0 && (
          <li className="py-4 text-sm text-[var(--muted)]">No reviewed portal matched that search.</li>
        )}
      </ul>
    </div>
  );
}
