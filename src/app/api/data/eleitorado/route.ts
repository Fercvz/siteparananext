import { NextResponse } from "next/server";
import { readFirstJson } from "@/lib/json-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const payload = await readFirstJson<Record<string, unknown>>([
    ["data", "dados_eleitorais.json"],
    ["public", "dados_eleitorais.json"],
  ]);

  if (payload) {
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  }

  return NextResponse.json({ error: "Dados eleitorais indisponiveis" }, { status: 500 });
}
