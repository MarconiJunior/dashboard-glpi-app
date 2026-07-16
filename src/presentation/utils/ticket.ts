import type { GlpiTicket, GlpiUser, TicketPriority, TicketStatus } from "@/src/domain/entities/ticket";


export function getRequesterName(u: GlpiUser): string {
  if (!u) {
    return "Sem solicitante";
  }

  if (u.firstname || u.realname) {
    return `${u.firstname ?? ""} ${u.realname ?? ""}`.trim();
  }

  return u.name;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function isSlaOverdue(t: GlpiTicket): boolean {
  if (!t.time_to_resolve) return false;
  if (t.status === "solved" || t.status === "closed") return false;
  return new Date(t.time_to_resolve).getTime() < Date.now();
}

export function slaRemainingHours(t: GlpiTicket): number | null {
  if (!t.time_to_resolve) return null;
  return (new Date(t.time_to_resolve).getTime() - Date.now()) / 3_600_000;
}

export function statusColor(status: TicketStatus): string {
  switch (status) {
    case "new":
      return "bg-signal-info/12 text-signal-info border-signal-info/30";
    case "assigned":
      return "bg-signal-progress/12 text-signal-progress border-signal-progress/30";
    case "planned":
      return "bg-signal-planned/12 text-signal-planned border-signal-planned/30";
    case "pending":
      return "bg-signal-warn/12 text-signal-warn border-signal-warn/30";
    case "solved":
      return "bg-signal-ok/12 text-signal-ok border-signal-ok/30";
    case "closed":
      return "bg-muted text-muted-foreground border-border";
  }
}

export function priorityColor(p: TicketPriority): string {
  if (p >= 5) return "bg-signal-crit/15 text-signal-crit border-signal-crit/35";
  if (p >= 4) return "bg-signal-warn/15 text-signal-warn border-signal-warn/35";
  if (p >= 3) return "bg-signal-warn/10 text-signal-warn border-signal-warn/25";
  if (p >= 2) return "bg-signal-info/10 text-signal-info border-signal-info/25";
  return "bg-muted text-muted-foreground border-border";
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", ...opts });
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}m atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d atrás`;
  return formatDate(iso);
}

export function exportToCSV(rows: Record<string, unknown>[], filename = "export.csv") {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(";"), ...rows.map((r) => headers.map((h) => escape(r[h])).join(";"))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
