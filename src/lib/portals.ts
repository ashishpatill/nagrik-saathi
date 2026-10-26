import { VERIFIED_PORTALS } from "@/data/official-portals";
import { validateOfficialPortal } from "@/lib/safety";
import type { OfficialPortal } from "@/lib/types";

export function getPortalByKey(key: string): OfficialPortal | null {
  return VERIFIED_PORTALS.find((entry) => entry.key === key) ?? null;
}

export type PortalUrlCheck =
  | {
      verified: true;
      match: "registered_path" | "official_domain";
      department: string;
      officialUrl: string;
      domain: string;
      matchedHost: string;
      helpline: string;
      reviewedOn: string;
      warning: string;
    }
  | {
      verified: false;
      reason: string;
      warning: string;
    };

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, "");
}

function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
}

/**
 * Check a model- or user-supplied URL against the human-reviewed registry.
 *
 * This never returns the supplied URL as an official destination. A hostname
 * match is enough to call the domain official, but a path outside the reviewed
 * portal path is labelled `official_domain` rather than `registered_path` so a
 * caller cannot mistake an unreviewed page for a reviewed one.
 */
export function verifyPortalUrl(raw: string): PortalUrlCheck {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return {
      verified: false,
      reason: "That is not a valid absolute URL.",
      warning: "Open the department's reviewed portal from the registry instead.",
    };
  }

  if (url.protocol !== "https:") {
    return {
      verified: false,
      reason: "Only HTTPS portal URLs are accepted.",
      warning: "Never enter personal details on an HTTP page.",
    };
  }
  if (url.username || url.password) {
    return {
      verified: false,
      reason: "URLs containing credentials are rejected.",
      warning: "A real portal does not put a username or password in the URL.",
    };
  }
  if (url.port && url.port !== "443") {
    return {
      verified: false,
      reason: "Non-standard ports are rejected for official portal checks.",
      warning: "Use the plain HTTPS URL from the reviewed registry.",
    };
  }

  const hostname = normalizeHost(url.hostname);
  const portal = VERIFIED_PORTALS.find((entry) =>
    entry.allowedHostnames.some((allowed) => {
      const allowedHost = normalizeHost(allowed);
      return hostname === allowedHost || hostname.endsWith(`.${allowedHost}`);
    }),
  );

  if (!portal || !validateOfficialPortal(portal)) {
    return {
      verified: false,
      reason: "That hostname is not in the reviewed portal registry.",
      warning: "Do not enter personal details. Use the printed helpline or a reviewed registry portal.",
    };
  }

  const registered = new URL(portal.portalUrl);
  const registeredPath = normalizePath(registered.pathname);
  const candidatePath = normalizePath(url.pathname);
  const pathReviewed =
    candidatePath === registeredPath ||
    (registeredPath !== "/" && candidatePath.startsWith(`${registeredPath}/`));

  return {
    verified: true,
    match: pathReviewed ? "registered_path" : "official_domain",
    department: portal.departmentName,
    officialUrl: portal.portalUrl,
    domain: portal.verifiedDomain,
    matchedHost: hostname,
    helpline: portal.helpline,
    reviewedOn: portal.lastReviewed,
    warning:
      pathReviewed
        ? "This host and path are in the reviewed registry. Nagrik Saathi still does not log in, pay, or submit for you."
        : "The domain is official, but this exact page path was not reviewed. Open the registry URL if you need a reviewed starting point.",
  };
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
