import { NextResponse } from "next/server"
import { getCategories } from "@/src/application/use-cases/categories.use-case"

export async function GET() {
  return NextResponse.json({ categories: await getCategories() })
}
