function sanitizeText(value: string): string {
  return value
    .replace(/[\r\n]+/g, " ")
    .replace(/[\\;,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactDate(date: string): string {
  return date.replace(/[^0-9]/g, "");
}

/** All-day ICS events use an exclusive DTEND, so the end is the next day. */
function nextDay(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return compactDate(date);
  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed.toISOString().slice(0, 10).replaceAll("-", "");
}

function eventUid(date: string): string {
  const random = globalThis.crypto?.randomUUID?.();
  return random ? `${random}@nagrik-saathi` : `nagrik-${compactDate(date)}-${Date.now()}@nagrik-saathi`;
}

export function buildIcs(title: string, date: string): string {
  const safeTitle = sanitizeText(title);
  const start = compactDate(date);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nagrik Saathi//EN",
    "BEGIN:VEVENT",
    `UID:${eventUid(date)}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${nextDay(date)}`,
    `SUMMARY:${safeTitle}`,
    "DESCRIPTION:Review this deadline. Nagrik Saathi does not make payments or submissions.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function icsDataUrl(ics: string): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

export function calendarDataUrl(title: string, date: string): string {
  return icsDataUrl(buildIcs(title, date));
}
