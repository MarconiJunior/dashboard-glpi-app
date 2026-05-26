import { NextResponse } from "next/server";
import { getServerSession } from "@/src/infrastructure/auth/session";

export async function POST() {
  const session = await getServerSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
