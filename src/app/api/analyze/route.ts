import { NextResponse } from "next/server";
import { analyzeSchema } from "@/lib/webmcp/schemas";
import { analyzeText } from "@/lib/extract";

// One Zod schema shared with the WebMCP surface: same validation, same
// language coverage (all eight LANGUAGES), one source of truth.
export async function POST(request: Request) {
  try {
    const body = analyzeSchema.parse(await request.json());
    return NextResponse.json({ analysis: analyzeText(body.sourceText, body.language) });
  } catch {
    return NextResponse.json({ error: "Notice text is invalid or too large." }, { status: 400 });
  }
}
