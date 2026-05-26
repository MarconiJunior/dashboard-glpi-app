import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/src/application/use-cases/dashboard.use-case";
import { getServerSession } from "@/src/infrastructure/auth/session";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;

  const ctx = { technicianId: session.user.id, allowedEntities: session.user.entities };
  return NextResponse.json(await getDashboardData(ctx, { dateFrom, dateTo }));
}
