// Caso de uso: dados do dashboard.
// Orquestra chamadas ao repositório e retorna um único objeto pronto para serializar.

import { ticketsRepository } from "@/src/infrastructure/repositories/tickets.repository"

export async function getDashboardData() {
  const [metrics, statusDist, categoryDist, monthly] = await Promise.all([
    ticketsRepository.getDashboardMetrics(),
    ticketsRepository.getStatusDistribution(),
    ticketsRepository.getCategoryDistribution(),
    ticketsRepository.getMonthlyEvolution(),
  ])
  return { metrics, statusDist, categoryDist, monthly }
}
