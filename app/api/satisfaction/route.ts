import { NextResponse } from "next/server";
import { getSatisfactionData } from "@/src/application/use-cases/satisfaction.use-case";
import { getServerSession } from "@/src/infrastructure/auth/session";

export async function GET() {
  const session = await getServerSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = { technicianId: session.user.id, allowedEntities: session.user.entities };
  return NextResponse.json(await getSatisfactionData(ctx));
}
