import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const payload = await request.json();
    const items = Array.isArray(payload.items) ? payload.items : [];

    if (!items.length) {
      return NextResponse.json(
        { error: "items obrigatório" },
        { status: 400 }
      );
    }

    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.$transaction(
        items.map((item: { city_slug: string; votes?: number; money?: number }) =>
          prisma.campaignAggregate.upsert({
            where: { cityId: item.city_slug },
            update: {
              votes: Number(item.votes || 0),
              money: Number(item.money || 0),
            },
            create: {
              cityId: item.city_slug,
              votes: Number(item.votes || 0),
              money: Number(item.money || 0),
            },
          })
        )
      );

      return NextResponse.json({ success: true, updates: items.length });
    } catch (dbError) {
      console.warn("Fallback Campaign Bulk: erro ao acessar o banco.", dbError);
    }

    const fallbackPath = path.join(process.cwd(), "data", "campaign_data.json");
    const raw = await readFile(fallbackPath, "utf-8");
    const data = JSON.parse(raw);
    items.forEach((item: { city_slug: string; votes?: number; money?: number }) => {
      data[item.city_slug] = {
        votes: Number(item.votes || 0),
        money: Number(item.money || 0),
      };
    });
    await writeFile(fallbackPath, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, updates: items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    const status = message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
