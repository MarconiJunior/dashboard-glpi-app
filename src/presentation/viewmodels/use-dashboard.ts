"use client";

import useSWR from "swr";
import type { DashboardMetrics } from "@/src/domain/repositories/ITicketsRepository";
import type { DateRange } from "@/components/filters/date-range-filter";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface DashboardViewModel {
  metrics: DashboardMetrics
  statusDist: { status: string; count: number }[]
  categoryDist: { category: string; count: number }[]
  monthly: { month: string; abertos: number; resolvidos: number; tempoMedio: number }[]
}

export function useDashboard(dateRange?: DateRange) {
  const params = new URLSearchParams();
  if (dateRange?.from) params.set("dateFrom", dateRange.from);
  if (dateRange?.to) params.set("dateTo", dateRange.to);

  const query = params.toString();
  const url = query ? `/api/dashboard?${query}` : "/api/dashboard";

  return useSWR<DashboardViewModel>(url, fetcher, {
    refreshInterval: 30_000,
    keepPreviousData: true,
  });
}
