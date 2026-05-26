import { satisfactionRepository } from "@/src/infrastructure/repositories/satisfaction.repository";
import type { UserContext } from "@/src/domain/repositories/UserContext";

export async function getSatisfactionData(ctx: UserContext) {
  const [list, stats, monthly, distribution] = await Promise.all([
    satisfactionRepository.list(ctx),
    satisfactionRepository.getStats(ctx),
    satisfactionRepository.getMonthlyTrend(ctx),
    satisfactionRepository.getDistribution(ctx),
  ]);
  return { list, stats, monthly, distribution };
}
