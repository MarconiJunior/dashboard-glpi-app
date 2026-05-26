import { NextResponse } from "next/server"
import { getDashboardData } from "@/src/application/use-cases/dashboard.use-case"

export async function GET() {
  return NextResponse.json(await getDashboardData())
}
