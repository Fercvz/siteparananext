import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ role: "GUEST" }, { status: 401 });
  }

  return NextResponse.json({ role: user.role });
}
