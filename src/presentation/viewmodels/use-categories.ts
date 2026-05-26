"use client"

import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useCategories() {
  return useSWR<{ categories: { id: number; name: string }[] }>("/api/categories", fetcher)
}
