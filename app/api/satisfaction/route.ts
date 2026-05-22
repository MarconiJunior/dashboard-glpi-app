import { NextResponse } from "next/server"
import { satisfactionRepository } from "@/lib/glpi/repository"

export async function GET() {
  const [list, stats, monthly, distribution] = await Promise.all([
    satisfactionRepository.list(),
    satisfactionRepository.getStats(),
    satisfactionRepository.getMonthlyTrend(),
    satisfactionRepository.getDistribution(),
  ])
  return NextResponse.json({ list, stats, monthly, distribution })
}
