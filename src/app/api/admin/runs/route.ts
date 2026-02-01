import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const runs = await prisma.datasetRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 20,
      include: { source: true },
    });

    return NextResponse.json({ runs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    const status = message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
