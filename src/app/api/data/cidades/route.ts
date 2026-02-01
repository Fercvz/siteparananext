import { NextResponse } from "next/server";
import { readFirstJson } from "@/lib/json-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { getLatestDatasetPayload } = await import("@/lib/datasets");
    const record = await getLatestDatasetPayload("IBGE");

    if (record?.payloadJson) {
      return NextResponse.json(record.payloadJson, {
        headers: { "Cache-Control": "private, max-age=60" },
      });
    }
  } catch (error) {
    console.warn("Fallback IBGE: erro ao acessar o banco.", error);
  }

  const payload = await readFirstJson<Record<string, unknown>>([
    ["data", "cidades_pr.json"],
    ["public", "cidades_pr.json"],
  ]);

  if (payload) {
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  }

  return NextResponse.json({ error: "Dados de cidades indisponiveis" }, { status: 500 });
}
