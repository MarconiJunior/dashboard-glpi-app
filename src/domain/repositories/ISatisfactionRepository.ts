// Interface do repositório de satisfação.

import type { GlpiSatisfaction } from "../entities/ticket"
import type { UserContext } from "./UserContext"

export interface SatisfactionStats {
  total: number
  avg: number
  positivePct: number
  negativePct: number
}

export interface ISatisfactionRepository {
  list(ctx: UserContext): Promise<GlpiSatisfaction[]>
  getStats(ctx: UserContext): Promise<SatisfactionStats>
  getMonthlyTrend(ctx: UserContext): Promise<{ month: string; media: number; avaliacoes: number }[]>
  getDistribution(ctx: UserContext): Promise<{ nota: string; total: number }[]>
}
