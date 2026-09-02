import { NextResponse } from "next/server";
import { findOfficialPortal } from "@/lib/portals";
import { z } from "zod";

const querySchema = z.object({
  department: z.string().trim().min(1).max(80),
  service: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(40),
});

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid portal query." }, { status: 400 });
  return NextResponse.json(findOfficialPortal(parsed.data.department, parsed.data.service, parsed.data.state));
}
