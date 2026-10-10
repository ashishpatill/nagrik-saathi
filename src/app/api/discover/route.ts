import { NextResponse } from "next/server";

import { discoverOfficialPortals } from "@/lib/discovery";
import { z } from "zod";

const querySchema = z.object({
  q: z.string().trim().min(3).max(120),
});

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid discovery query." }, { status: 400 });
  }

  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Live discovery is not configured on this server." },
      { status: 503 },
    );
  }

  try {
    const result = await discoverOfficialPortals(parsed.data.q, apiKey);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Live discovery failed. Try the reviewed portal directory instead." },
      { status: 502 },
    );
  }
}
