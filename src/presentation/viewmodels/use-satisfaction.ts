"use client"

import useSWR from "swr"
import type { GlpiSatisfaction } from "@/src/domain/entities/ticket"
import type { SatisfactionStats } from "@/src/domain/repositories/ISatisfactionRepository"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export interface SatisfactionViewModel {
  list: GlpiSatisfaction[]
  stats: SatisfactionStats
  monthly: { month: string; media: number; avaliacoes: number }[]
  distribution: { nota: string; total: number }[]
}

export function useSatisfaction() {
  return useSWR<SatisfactionViewModel>("/api/satisfaction", fetcher, {
    refreshInterval: 60_000,
  })
}
