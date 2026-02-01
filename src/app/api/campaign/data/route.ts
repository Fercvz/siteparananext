import { NextResponse } from "next/server";
import { readJsonFile } from "@/lib/json-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { getCampaignData } = await import("@/lib/campaign");
    const data = await getCampaignData();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (error) {
    console.warn("Fallback Campaign: erro ao acessar o banco.", error);
  }

  const data = await readJsonFile<Record<string, { votes: number; money: number }>>(
    "data",
    "campaign_data.json"
  );
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
