import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const payload = await request.json();
    const investments = Array.isArray(payload.investments)
      ? payload.investments
      : [];

    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.investment.deleteMany();

      if (investments.length) {
        await prisma.investment.createMany({
          data: investments.map((inv: {
            cityId: string;
            cityName: string;
            ano: number;
            valor: number;
            area?: string | null;
            tipo?: string | null;
            descricao?: string | null;
          }) => ({
            cityId: inv.cityId,
            cityName: inv.cityName,
            year: Number(inv.ano),
            value: Number(inv.valor),
            area: inv.area || null,
            type: inv.tipo || null,
            description: inv.descricao || null,
          })),
        });
      }

      await prisma.campaignAggregate.deleteMany();

      return NextResponse.json({ success: true, count: investments.length });
    } catch (dbError) {
      console.warn("Fallback Investments Save: erro ao acessar o banco.", dbError);
    }

    const investmentsPath = path.join(process.cwd(), "data", "investments_data.json");
    await writeFile(investmentsPath, JSON.stringify(investments, null, 2));

    const campaignPath = path.join(process.cwd(), "data", "campaign_data.json");
    await writeFile(campaignPath, JSON.stringify({}, null, 2));

    return NextResponse.json({ success: true, count: investments.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    const status = message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
