import { ticketsRepository } from "@/src/infrastructure/repositories/tickets.repository"
import type { UserContext } from "@/src/domain/repositories/UserContext"

export async function getDashboardData(ctx: UserContext) {
  const [metrics, statusDist, categoryDist, monthly] = await Promise.all([
    ticketsRepository.getDashboardMetrics(ctx),
    ticketsRepository.getStatusDistribution(ctx),
    ticketsRepository.getCategoryDistribution(ctx),
    ticketsRepository.getMonthlyEvolution(ctx),
  ])
  return { metrics, statusDist, categoryDist, monthly }
}
