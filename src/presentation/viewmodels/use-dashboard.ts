"use client"

import useSWR from "swr"
import type { DashboardMetrics } from "@/src/domain/repositories/ITicketsRepository"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export interface DashboardViewModel {
  metrics: DashboardMetrics
  statusDist: { status: string; count: number }[]
  categoryDist: { category: string; count: number }[]
  monthly: { month: string; abertos: number; resolvidos: number; tempoMedio: number }[]
}

export function useDashboard() {
  return useSWR<DashboardViewModel>("/api/dashboard", fetcher, {
    refreshInterval: 30_000,
  })
}
