"use client";

import useSWR from "swr";
import type { DateRange } from "@/components/filters/date-range-filter";
import type { ManagementOverview, TechnicianStats } from "@/src/domain/repositories/IManagementRepository";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface ManagementViewModel {
  overview: ManagementOverview
  technicians: TechnicianStats[]
  statusDist: { status: string; count: number }[]
  categoryDist: { category: string; count: number }[]
  monthly: { month: string; abertos: number; resolvidos: number }[]
}

const meFetcher = (url: string) => fetch(url).then((r) => r.json());

export function useManagedEntitiesCount() {
  const { data } = useSWR<{ managedEntities?: number[] }>("/api/me", meFetcher, {
    revalidateOnFocus: false,
  });
  return data?.managedEntities?.length ?? 0;
}

export function useManagement(dateRange?: DateRange) {
  const params = new URLSearchParams();
  if (dateRange?.from) params.set("dateFrom", dateRange.from);
  if (dateRange?.to) params.set("dateTo", dateRange.to);

  const query = params.toString();
  const url = query ? `/api/management?${query}` : "/api/management";

  return useSWR<ManagementViewModel>(url, fetcher, {
    refreshInterval: 60_000,
    keepPreviousData: true,
  });
}
