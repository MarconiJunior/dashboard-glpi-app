// Interface do repositório de satisfação.

import type { GlpiSatisfaction } from "../entities/ticket"

export interface SatisfactionStats {
  total: number
  avg: number
  positivePct: number
  negativePct: number
}

export interface ISatisfactionRepository {
  list(): Promise<GlpiSatisfaction[]>
  getStats(): Promise<SatisfactionStats>
  getMonthlyTrend(): Promise<{ month: string; media: number; avaliacoes: number }[]>
  getDistribution(): Promise<{ nota: string; total: number }[]>
}
