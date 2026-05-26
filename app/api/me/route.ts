import { NextResponse } from "next/server";
import { getServerSession } from "@/src/infrastructure/auth/session";

export async function GET() {
  const session = await getServerSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(session.user);
}
