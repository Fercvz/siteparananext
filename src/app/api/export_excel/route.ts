import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const payload = await request.json();
    const items = Array.isArray(payload.items) ? payload.items : [];

    if (!items.length) {
      return NextResponse.json(
        { error: "Nenhum item para exportar" },
        { status: 400 }
      );
    }

    const worksheet = XLSX.utils.json_to_sheet(items);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resumo Campanha");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          "attachment; filename=Resumo_Campanha_Parana.xlsx",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    const status = message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
