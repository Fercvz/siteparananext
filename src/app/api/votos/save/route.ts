import { NextResponse } from "next/server";
import { writeJsonFile } from "@/lib/json-store";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const payload = await request.json();
    const votos = payload.votos && typeof payload.votos === "object"
      ? payload.votos
      : {};

    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.vote.deleteMany();

      const rows: { cityId: string; year: number; votes: number }[] = [];
      Object.entries(votos).forEach(([cityId, entries]) => {
        const entryList = Array.isArray(entries) ? entries : [];
        entryList.forEach((entry: { ano: number; votos: number }) => {
          rows.push({
            cityId,
            year: Number(entry.ano),
            votes: Number(entry.votos),
          });
        });
      });

      if (rows.length) {
        await prisma.vote.createMany({ data: rows });
      }

      await prisma.campaignAggregate.deleteMany();

      return NextResponse.json({ success: true, count: rows.length });
    } catch (dbError) {
      console.warn("Fallback Votos Save: erro ao acessar o banco.", dbError);
    }

    await writeJsonFile(votos, "data", "votos_data.json");
    await writeJsonFile({}, "data", "campaign_data.json");

    return NextResponse.json({ success: true, count: Object.keys(votos).length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    const status = message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
