import { z } from "zod";

export const languageSchema = z.object({
  language: z.enum(["en", "hi", "mr"]).default("en"),
});

export const portalSchema = z.object({
  department: z.string().trim().min(1).max(80),
  service: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(40),
});

export const analyzeSchema = z.object({
  sourceText: z.string().trim().min(1).max(50_000),
  language: z.enum(["en", "hi", "mr"]).default("en"),
});

export const reminderSchema = z.object({
  title: z.string().trim().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const letterSchema = z.object({
  tone: z.enum(["formal", "simple"]).default("formal"),
  language: z.enum(["en", "hi", "mr"]).default("en"),
});

export const jsonSchemas = {
  language: {
    type: "object",
    properties: { language: { type: "string", enum: ["en", "hi", "mr"], default: "en" } },
    additionalProperties: false,
  },
  portal: {
    type: "object",
    properties: {
      department: { type: "string", minLength: 1, maxLength: 80 },
      service: { type: "string", minLength: 1, maxLength: 80 },
      state: { type: "string", minLength: 1, maxLength: 40 },
    },
    required: ["department", "service", "state"],
    additionalProperties: false,
  },
  analyze: {
    type: "object",
    properties: {
      sourceText: { type: "string", minLength: 1, maxLength: 50000, description: "Notice text to analyze." },
      language: { type: "string", enum: ["en", "hi", "mr"], default: "en" },
    },
    required: ["sourceText"],
    additionalProperties: false,
  },
  reminder: {
    type: "object",
    properties: {
      title: { type: "string", minLength: 1, maxLength: 120 },
      date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    },
    required: ["title", "date"],
    additionalProperties: false,
  },
  letter: {
    type: "object",
    properties: {
      tone: { type: "string", enum: ["formal", "simple"], default: "formal" },
      language: { type: "string", enum: ["en", "hi", "mr"], default: "en" },
    },
    additionalProperties: false,
  },
} as const;
