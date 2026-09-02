export function buildIcs(title: string, date: string): string {
  const safeTitle = title.replace(/[\\;,]/g, " ");
  const safeDate = date.replace(/[^0-9-]/g, "");
  const day = safeDate.replaceAll("-", "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nagrik Saathi//EN",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${day}`,
    `SUMMARY:${safeTitle}`,
    "DESCRIPTION:Review this deadline. Nagrik Saathi does not make payments or submissions.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function calendarDataUrl(title: string, date: string): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(buildIcs(title, date))}`;
}
