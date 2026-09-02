import { VERIFIED_PORTALS } from "@/data/official-portals";
import { validateOfficialPortal } from "@/lib/safety";
import type { OfficialPortal } from "@/lib/types";

export function getPortalByKey(key: string): OfficialPortal | null {
  return VERIFIED_PORTALS.find((entry) => entry.key === key) ?? null;
}

export function findOfficialPortal(department: string, service: string, state: string) {
  const normalized = (value: string) => value.trim().toLowerCase();
  const needle = normalized(department);
  const portal =
    VERIFIED_PORTALS.find(
      (entry) => normalized(entry.state) === normalized(state) && normalized(entry.key) === needle,
    ) ??
    VERIFIED_PORTALS.find(
      (entry) =>
        normalized(entry.state) === normalized(state) &&
        (normalized(entry.key).includes(needle) ||
          normalized(entry.departmentName).includes(needle) ||
          needle.includes(normalized(entry.key))),
    );

  const serviceMatch = portal?.allowedServices.some((item) => normalized(item) === normalized(service));
  if (!portal || !serviceMatch || !validateOfficialPortal(portal)) {
    return {
      verified: false,
      reason: "No reviewed portal matched that department, service, and state.",
      nextStep: "Use the printed helpline or visit the department office.",
    };
  }

  return {
    verified: true,
    department: portal.departmentName,
    officialUrl: portal.portalUrl,
    domain: portal.verifiedDomain,
    helpline: portal.helpline,
    reviewedOn: portal.lastReviewed,
    warning: "Open this URL yourself. Nagrik Saathi does not log in, pay, or submit.",
  };
}
