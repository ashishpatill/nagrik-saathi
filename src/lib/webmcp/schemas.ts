import { z } from "zod";
import { LANGUAGES } from "@/lib/languages";

// Zod probes whether eval is allowed by calling Function(""). That probe is
// blocked by our CSP (script-src has no 'unsafe-eval'), so it logs a DevTools
// issue on every page. JIT-less mode avoids the probe and keeps the strict CSP;
// these schemas are small enough that the performance difference is negligible.
z.config({ jitless: true });

const languageEnum = z.enum(LANGUAGES);

/**
 * Notice text supplied by an agent. Optional so browser tools can fall back to
 * the current workspace case. MCP clients should send it on every call because
 * the remote server is stateless.
 */
const sourceText = z
  .string()
  .trim()
  .min(1)
  .max(50_000)
  .describe("Notice text. Omit to use the current analyzed notice in the browser workspace.");

export const languageSchema = z.strictObject({
  language: languageEnum.default("en"),
  sourceText: sourceText.optional(),
});

export const portalSchema = z.strictObject({
  department: z.string().trim().min(1).max(80),
  service: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(40),
});

export const analyzeSchema = z.strictObject({
  sourceText: z.string().trim().min(1).max(50_000),
  language: languageEnum.default("en"),
});

export const reminderSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    }, "Use a real calendar date."),
});

export const letterSchema = z.strictObject({
  tone: z.enum(["formal", "simple"]).default("formal"),
  language: languageEnum.default("en"),
  sourceText: sourceText.optional(),
});

export const verifyUrlSchema = z.strictObject({
  url: z.string().trim().min(1).max(2048).describe("URL to check against the reviewed portal registry."),
});

export const redactSchema = z.strictObject({
  text: z.string().min(1).max(50_000).describe("Text that may contain Aadhaar, PAN, card, or account numbers."),
});

/**
 * Generate a JSON Schema from the same Zod object the tool body parses.
 * Dropping `$schema` keeps the descriptor small; WebMCP does not need a
 * meta-schema reference. `z.strictObject` emits `additionalProperties: false`.
 */
export function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { io: "input" }) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

export const jsonSchemas = {
  language: toJsonSchema(languageSchema),
  portal: toJsonSchema(portalSchema),
  analyze: toJsonSchema(analyzeSchema),
  reminder: toJsonSchema(reminderSchema),
  letter: toJsonSchema(letterSchema),
  verifyUrl: toJsonSchema(verifyUrlSchema),
  redact: toJsonSchema(redactSchema),
} as const;
