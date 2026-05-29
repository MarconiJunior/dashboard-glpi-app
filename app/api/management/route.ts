import { NextRequest, NextResponse } from "next/server";
import { getManagementData } from "@/src/application/use-cases/management.use-case";
import { getServerSession } from "@/src/infrastructure/auth/session";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "supervisor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;

  const managed = session.user.managedEntities ?? session.user.entities;
  if (!managed.length) {
    return NextResponse.json({ error: "Nenhuma entidade gerenciada." }, { status: 403 });
  }

  return NextResponse.json(
    await getManagementData(managed, { dateFrom, dateTo }),
  );
}
