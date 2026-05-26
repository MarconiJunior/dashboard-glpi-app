import { NextResponse } from "next/server"
import { getSatisfactionData } from "@/src/application/use-cases/satisfaction.use-case"

export async function GET() {
  return NextResponse.json(await getSatisfactionData())
}
