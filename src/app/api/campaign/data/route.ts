import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const revalidate = 60;
export const runtime = "nodejs";

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

  const fallbackPath = path.join(process.cwd(), "data", "campaign_data.json");
  const raw = await readFile(fallbackPath, "utf-8");
  return NextResponse.json(JSON.parse(raw), {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
