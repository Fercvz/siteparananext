import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        role: true,
        createdAt: true,
      },
    });

    const payload = users.map((user: {
      id: string;
      userId: string;
      role: "ADMIN" | "USER";
      createdAt: Date;
    }) => ({
      id: user.id,
      userId: user.userId,
      role: user.role,
      createdAt: user.createdAt,
    }));

    return NextResponse.json({ users: payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    const status = message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const payload = await request.json();
    const userId = payload.userId;
    const role = payload.role;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId e role obrigatorios" },
        { status: 400 }
      );
    }

    if (role !== "ADMIN" && role !== "USER") {
      return NextResponse.json({ error: "Role invalida" }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { userId },
      update: { role },
      create: { userId, role },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    const status = message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
