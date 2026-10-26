import { z } from "zod";
import { isLanguage, type Language } from "@/lib/languages";

export const PLAYBOOK_SCHEMA_VERSION = 1;

export const PLAYBOOK_CATEGORIES = [
  "travel",
  "identity",
  "tax",
  "transport",
  "civic",
  "welfare",
  "utilities",
  "consumer",
] as const;

export type PlaybookCategory = (typeof PLAYBOOK_CATEGORIES)[number];

export const PLAYBOOK_CATEGORY_LABELS: Record<PlaybookCategory, string> = {
  travel: "Travel",
  identity: "Identity",
  tax: "Tax",
  transport: "Transport",
  civic: "Civic records",
  welfare: "Welfare",
  utilities: "Utilities",
  consumer: "Consumer",
};

/**
 * Localized content. English is always present. Hindi and Marathi are required
 * for the overview fields so every playbook has a usable non-English summary;
 * process detail can fall back to English until a translation is contributed.
 */
export type LocalizedText = { en: string } & Partial<Record<Language, string>>;

const localizedCandidate = z.record(
  z.string(),
  z.string().trim().min(1).max(4_000),
);

function localizedText(required: readonly Language[]) {
  return localizedCandidate
    .superRefine((value, ctx) => {
      for (const key of Object.keys(value)) {
        if (!isLanguage(key)) {
          ctx.addIssue({
            code: "custom",
            message: `Unknown language "${key}".`,
            path: [key],
          });
        }
      }
      for (const code of required) {
        if (!value[code]) {
          ctx.addIssue({
            code: "custom",
            message: `Missing ${code} text.`,
            path: [code],
          });
        }
      }
    })
    .transform((value) => value as LocalizedText);
}

const overviewText = localizedText(["en", "hi", "mr"]);
const detailText = localizedText(["en"]);
const portalKey = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9_]+$/, "Use a registry key such as msedcl_power.");

export const playbookSchema = z
  .strictObject({
    schemaVersion: z.literal(PLAYBOOK_SCHEMA_VERSION),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(60)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
    version: z.number().int().positive(),
    order: z.number().int().positive(),
    lastReviewed: z.iso.date(),
    category: z.enum(PLAYBOOK_CATEGORIES),
    guidanceOnly: z.boolean(),
    title: overviewText,
    summary: overviewText,
    feeNote: overviewText,
    timelineNote: overviewText,
    portalKeys: z.array(portalKey).min(1).max(4),
    helplines: z.array(z.string().trim().min(1).max(160)).min(1).max(4),
    documents: z.array(detailText).min(1).max(10),
    steps: z
      .array(
        z.strictObject({
          title: detailText,
          detail: detailText,
          portalKey: portalKey.optional(),
        }),
      )
      .min(3)
      .max(10),
    rejectionReasons: z.array(detailText).min(1).max(8),
  })
  .superRefine((playbook, ctx) => {
    if (new Set(playbook.portalKeys).size !== playbook.portalKeys.length) {
      ctx.addIssue({
        code: "custom",
        message: "portalKeys must not contain duplicates.",
        path: ["portalKeys"],
      });
    }
    for (const [index, step] of playbook.steps.entries()) {
      if (step.portalKey && !playbook.portalKeys.includes(step.portalKey)) {
        ctx.addIssue({
          code: "custom",
          message: "A step portalKey must also appear in portalKeys.",
          path: ["steps", index, "portalKey"],
        });
      }
    }
    if (playbook.guidanceOnly !== (playbook.slug === "aadhaar-update")) {
      ctx.addIssue({
        code: "custom",
        message: "Only aadhaar-update is guidance-only.",
        path: ["guidanceOnly"],
      });
    }
  });

export type Playbook = z.infer<typeof playbookSchema>;

/** Fifteen workflows from the v2 plan, plus the Aadhaar guidance-only addition. */
export const REQUIRED_WORKFLOW_SLUGS = [
  "e-visa",
  "passport",
  "pan",
  "driving-licence",
  "gst-registration",
  "income-tax-filing",
  "rti",
  "labour-complaint",
  "property-registration",
  "birth-certificate",
  "death-certificate",
  "electricity-connection",
  "ration-card",
  "consumer-complaint",
  "municipal-grievance",
] as const;

export const GUIDANCE_ONLY_SLUG = "aadhaar-update";

export const EXPECTED_PLAYBOOK_SLUGS = [
  ...REQUIRED_WORKFLOW_SLUGS,
  GUIDANCE_ONLY_SLUG,
] as const;
