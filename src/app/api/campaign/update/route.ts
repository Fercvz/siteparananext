import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const payload = await request.json();

    const cityId = payload.city_slug;
    const votes = Number(payload.votes || 0);
    const money = Number(payload.money || 0);

    if (!cityId) {
      return NextResponse.json(
        { error: "city_slug obrigatório" },
        { status: 400 }
      );
    }

    try {
      const { prisma } = await import("@/lib/prisma");
      const record = await prisma.campaignAggregate.upsert({
        where: { cityId },
        update: { votes, money },
        create: { cityId, votes, money },
      });

      return NextResponse.json({ success: true, data: record });
    } catch (dbError) {
      console.warn("Fallback Campaign Update: erro ao acessar o banco.", dbError);
    }

    const fallbackPath = path.join(process.cwd(), "data", "campaign_data.json");
    const raw = await readFile(fallbackPath, "utf-8");
    const data = JSON.parse(raw);
    data[cityId] = { votes, money };
    await writeFile(fallbackPath, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, data: data[cityId] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    const status = message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
