// Caso de uso: dados de satisfação do técnico.

import { satisfactionRepository } from "@/src/infrastructure/repositories/satisfaction.repository"

export async function getSatisfactionData() {
  const [list, stats, monthly, distribution] = await Promise.all([
    satisfactionRepository.list(),
    satisfactionRepository.getStats(),
    satisfactionRepository.getMonthlyTrend(),
    satisfactionRepository.getDistribution(),
  ])
  return { list, stats, monthly, distribution }
}
