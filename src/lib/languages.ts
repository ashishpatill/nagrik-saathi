export const LANGUAGES = ["en", "hi", "mr", "ta", "kn", "gu", "te", "bn"] as const;

export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, { native: string; english: string }> = {
  en: { native: "English", english: "English" },
  hi: { native: "हिन्दी", english: "Hindi" },
  mr: { native: "मराठी", english: "Marathi" },
  ta: { native: "தமிழ்", english: "Tamil" },
  kn: { native: "ಕನ್ನಡ", english: "Kannada" },
  gu: { native: "ગુજરાતી", english: "Gujarati" },
  te: { native: "తెలుగు", english: "Telugu" },
  bn: { native: "বাংলা", english: "Bengali" },
};

export function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}

export function languageOptionLabel(code: Language): string {
  const meta = LANGUAGE_LABELS[code];
  return code === "en" ? meta.english : `${meta.native} · ${meta.english}`;
}
