import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const investments = await prisma.investment.findMany();
    const payload = investments.map((inv: {
      id: string;
      cityId: string;
      cityName: string;
      year: number;
      value: number;
      area: string | null;
      type: string | null;
      description: string | null;
    }) => ({
      id: inv.id,
      cityId: inv.cityId,
      cityName: inv.cityName,
      ano: inv.year,
      valor: inv.value,
      area: inv.area,
      tipo: inv.type,
      descricao: inv.description,
    }));
    return NextResponse.json({ investments: payload, count: payload.length });
  } catch (error) {
    console.warn("Fallback Investments: erro ao acessar o banco.", error);
  }

  const fallbackPath = path.join(process.cwd(), "data", "investments_data.json");
  const raw = await readFile(fallbackPath, "utf-8");
  const investments = JSON.parse(raw);
  return NextResponse.json({ investments, count: investments.length });
}
