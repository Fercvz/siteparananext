import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST() {
  try {
    const user = await requireAdmin();
    const rate = rateLimit(`sync:ibge:${user.id}`, 3, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Rate limit" }, { status: 429 });
    }

    const baseUrl = process.env.SCRAPER_SERVICE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: "SCRAPER_SERVICE_URL nao configurado" },
        { status: 500 }
      );
    }

    const response = await fetch(`${baseUrl}/run/ibge`, { method: "POST" });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    const status = message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
