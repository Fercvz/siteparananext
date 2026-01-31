import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const revalidate = 60;
export const runtime = "nodejs";

export async function GET() {
  try {
    const { getLatestDatasetPayload } = await import("@/lib/datasets");
    const record = await getLatestDatasetPayload("TSE");

    if (record?.payloadJson) {
      return NextResponse.json(record.payloadJson, {
        headers: { "Cache-Control": "private, max-age=60" },
      });
    }
  } catch (error) {
    console.warn("Fallback TSE: erro ao acessar o banco.", error);
  }

  const fallbackPaths = [
    path.join(process.cwd(), "data", "dados_eleitorais.json"),
    path.join(process.cwd(), "public", "dados_eleitorais.json"),
  ];

  for (const fallbackPath of fallbackPaths) {
    try {
      const raw = await readFile(fallbackPath, "utf-8");
      return NextResponse.json(JSON.parse(raw), {
        headers: { "Cache-Control": "private, max-age=60" },
      });
    } catch (error) {
      console.warn("Fallback TSE: erro ao ler arquivo.", fallbackPath, error);
    }
  }

  return NextResponse.json({ error: "Dados eleitorais indisponiveis" }, { status: 500 });
}
