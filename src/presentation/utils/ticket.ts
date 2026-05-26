import type { GlpiTicket, TicketPriority, TicketStatus } from "@/src/domain/entities/ticket"

export function getRequesterName(t: GlpiTicket): string {
  const u = t.requester
  if (u.firstname || u.realname) return `${u.firstname ?? ""} ${u.realname ?? ""}`.trim()
  return u.name
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("")
}

export function isSlaOverdue(t: GlpiTicket): boolean {
  if (!t.time_to_resolve) return false
  if (t.status === "solved" || t.status === "closed") return false
  return new Date(t.time_to_resolve).getTime() < Date.now()
}

export function slaRemainingHours(t: GlpiTicket): number | null {
  if (!t.time_to_resolve) return null
  return (new Date(t.time_to_resolve).getTime() - Date.now()) / 3_600_000
}

export function statusColor(status: TicketStatus): string {
  switch (status) {
    case "new":
      return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
    case "assigned":
      return "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30"
    case "planned":
      return "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30"
    case "pending":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
    case "solved":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
    case "closed":
      return "bg-muted text-muted-foreground border-border"
  }
}

export function priorityColor(p: TicketPriority): string {
  if (p >= 6) return "bg-red-600/20 text-red-600 dark:text-red-400 border-red-600/40"
  if (p >= 5) return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30"
  if (p >= 4) return "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30"
  if (p >= 3) return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
  if (p >= 2) return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30"
  return "bg-muted text-muted-foreground border-border"
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", ...opts })
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return "agora"
  if (min < 60) return `${min}m atrás`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h atrás`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d atrás`
  return formatDate(iso)
}

export function exportToCSV(rows: Record<string, unknown>[], filename = "export.csv") {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v)
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers.join(";"), ...rows.map((r) => headers.map((h) => escape(r[h])).join(";"))].join("\n")
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
