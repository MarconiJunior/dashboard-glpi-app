import { NextResponse } from "next/server"
import { ticketsRepository } from "@/lib/glpi/repository"

export async function GET() {
  const [metrics, statusDist, categoryDist, monthly] = await Promise.all([
    ticketsRepository.getDashboardMetrics(),
    ticketsRepository.getStatusDistribution(),
    ticketsRepository.getCategoryDistribution(),
    ticketsRepository.getMonthlyEvolution(),
  ])
  return NextResponse.json({ metrics, statusDist, categoryDist, monthly })
}
