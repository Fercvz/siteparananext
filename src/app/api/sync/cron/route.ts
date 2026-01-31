import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = process.env.INTERNAL_CRON_SECRET;
  const provided =
    request.headers.get("x-cron-secret") ||
    new URL(request.url).searchParams.get("secret");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.SCRAPER_SERVICE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: "SCRAPER_SERVICE_URL nao configurado" },
      { status: 500 }
    );
  }

  const response = await fetch(`${baseUrl}/run/all`, { method: "POST" });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
