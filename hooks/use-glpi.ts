"use client"

import useSWR from "swr"
import type { GlpiTicket } from "@/lib/glpi/types"
import type { DashboardMetrics } from "@/lib/glpi/repository"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useDashboard() {
  return useSWR<{
    metrics: DashboardMetrics
    statusDist: { status: string; count: number }[]
    categoryDist: { category: string; count: number }[]
    monthly: { month: string; abertos: number; resolvidos: number; tempoMedio: number }[]
  }>("/api/dashboard", fetcher, { refreshInterval: 30000 })
}

export interface TicketsQuery {
  scope?: "mine" | "new"
  search?: string
  status?: string[]
  priority?: number[]
  categoryId?: number[]
  slaOverdue?: boolean
  dateFrom?: string
  dateTo?: string
}

export function useTickets(query: TicketsQuery = {}) {
  const params = new URLSearchParams()
  if (query.scope) params.set("scope", query.scope)
  if (query.search) params.set("search", query.search)
  query.status?.forEach((s) => params.append("status", s))
  query.priority?.forEach((p) => params.append("priority", String(p)))
  query.categoryId?.forEach((c) => params.append("categoryId", String(c)))
  if (query.slaOverdue) params.set("slaOverdue", "true")
  if (query.dateFrom) params.set("dateFrom", query.dateFrom)
  if (query.dateTo) params.set("dateTo", query.dateTo)
  return useSWR<{ tickets: GlpiTicket[] }>(`/api/tickets?${params.toString()}`, fetcher, {
    refreshInterval: query.scope === "new" ? 15000 : 30000,
    keepPreviousData: true,
  })
}

export function useSatisfaction() {
  return useSWR("/api/satisfaction", fetcher, { refreshInterval: 60000 })
}

export function useCategories() {
  return useSWR<{ categories: { id: number; name: string }[] }>("/api/categories", fetcher)
}
