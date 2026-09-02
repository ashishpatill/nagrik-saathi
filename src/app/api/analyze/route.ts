import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeText } from "@/lib/extract";

const requestSchema = z.object({
  sourceText: z.string().trim().min(1).max(50_000),
  language: z.enum(["en", "hi", "mr"]).default("en"),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    return NextResponse.json({ analysis: analyzeText(body.sourceText, body.language) });
  } catch {
    return NextResponse.json({ error: "Notice text is invalid or too large." }, { status: 400 });
  }
}
