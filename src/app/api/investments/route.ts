import { NextResponse } from "next/server";
import { writeJsonFile } from "@/lib/json-store";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE() {
  try {
    await requireAdmin();
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.investment.deleteMany();
      await prisma.campaignAggregate.deleteMany();
      return NextResponse.json({
        success: true,
        message: "Investimentos deletados com sucesso",
      });
    } catch (dbError) {
      console.warn("Fallback Investments Delete: erro ao acessar o banco.", dbError);
    }

    await writeJsonFile([], "data", "investments_data.json");
    await writeJsonFile({}, "data", "campaign_data.json");

    return NextResponse.json({
      success: true,
      message: "Investimentos deletados com sucesso",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    const status = message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
