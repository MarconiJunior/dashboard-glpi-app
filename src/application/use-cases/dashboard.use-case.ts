import { ticketsRepository } from "@/src/infrastructure/repositories/tickets.repository";
import type { UserContext } from "@/src/domain/repositories/UserContext";
import type { TicketFilters } from "@/src/domain/repositories/ITicketsRepository";

export type DashboardDateFilters = Pick<TicketFilters, "dateFrom" | "dateTo">;

export async function getDashboardData(ctx: UserContext, filters: DashboardDateFilters = {}) {
  const [metrics, statusDist, categoryDist, monthly] = await Promise.all([
    ticketsRepository.getDashboardMetrics(ctx, filters),
    ticketsRepository.getStatusDistribution(ctx, filters),
    ticketsRepository.getCategoryDistribution(ctx, filters),
    ticketsRepository.getMonthlyEvolution(ctx),
  ]);
  return { metrics, statusDist, categoryDist, monthly };
}
