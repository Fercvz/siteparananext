import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE() {
  try {
    await requireAdmin();
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.vote.deleteMany();
      await prisma.campaignAggregate.deleteMany();
      return NextResponse.json({
        success: true,
        message: "Votos deletados com sucesso",
      });
    } catch (dbError) {
      console.warn("Fallback Votos Delete: erro ao acessar o banco.", dbError);
    }

    const votosPath = path.join(process.cwd(), "data", "votos_data.json");
    await writeFile(votosPath, JSON.stringify({}, null, 2));

    const campaignPath = path.join(process.cwd(), "data", "campaign_data.json");
    await writeFile(campaignPath, JSON.stringify({}, null, 2));

    return NextResponse.json({
      success: true,
      message: "Votos deletados com sucesso",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    const status = message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
