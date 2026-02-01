import { NextResponse } from "next/server";
import { readJsonFile } from "@/lib/json-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.vote.findMany();
    const votos = rows.reduce(
      (
        acc: Record<string, { ano: number; votos: number }[]>,
        row: { cityId: string; year: number; votes: number }
      ) => {
        if (!acc[row.cityId]) {
          acc[row.cityId] = [];
        }
        acc[row.cityId].push({ ano: row.year, votos: row.votes });
        return acc;
      },
      {} as Record<string, { ano: number; votos: number }[]>
    );

    return NextResponse.json({ votos, count: Object.keys(votos).length });
  } catch (error) {
    console.warn("Fallback Votos: erro ao acessar o banco.", error);
  }

  const votos = await readJsonFile<Record<string, { ano: number; votos: number }[]>>(
    "data",
    "votos_data.json"
  );
  return NextResponse.json({ votos, count: Object.keys(votos).length });
}
