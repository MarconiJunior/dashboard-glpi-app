"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  accent?: "primary" | "blue" | "amber" | "emerald" | "red" | "violet"
  loading?: boolean
  onClick?: () => void
  active?: boolean
}

const accentVar: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  primary: "var(--primary)",
  blue: "var(--signal-info)",
  amber: "var(--signal-warn)",
  emerald: "var(--signal-ok)",
  red: "var(--signal-crit)",
  violet: "var(--signal-progress)",
};

export function MetricCard({ label, value, hint, icon: Icon, accent = "primary", loading, onClick, active }: MetricCardProps) {
  const dot = accentVar[accent];
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/60 py-0 transition-colors hover:border-border",
        onClick && "cursor-pointer select-none",
        active && "ring-2 ring-primary/50",
      )}
      onClick={onClick}
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: dot }} aria-hidden />
      <CardContent className="flex items-start justify-between gap-3 py-4 pr-4 pl-5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p className="font-display text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          )}
          {hint && <p className="text-xs text-muted-foreground/75">{hint}</p>}
        </div>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      </CardContent>
    </Card>
  );
}
