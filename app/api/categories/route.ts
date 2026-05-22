import { NextResponse } from "next/server"
import { categoriesRepository } from "@/lib/glpi/repository"

export async function GET() {
  const categories = await categoriesRepository.list()
  return NextResponse.json({ categories })
}
