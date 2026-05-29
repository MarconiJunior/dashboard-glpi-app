import { managementRepository } from "@/src/infrastructure/repositories/management.repository";
import type { DateFilters } from "@/src/domain/repositories/IManagementRepository";

export async function getManagementData(entities: number[], filters: DateFilters = {}) {
  const [overview, technicians, statusDist, categoryDist, monthly] = await Promise.all([
    managementRepository.getOverview(entities, filters),
    managementRepository.getTechnicianStats(entities, filters),
    managementRepository.getStatusDistribution(entities, filters),
    managementRepository.getCategoryDistribution(entities, filters),
    managementRepository.getMonthlyEvolution(entities),
  ]);
  return { overview, technicians, statusDist, categoryDist, monthly };
}
