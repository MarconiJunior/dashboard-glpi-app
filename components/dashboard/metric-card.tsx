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

const accentMap: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  primary: "bg-primary/15 text-primary",
  blue: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  red: "bg-red-500/15 text-red-600 dark:text-red-400",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
};

export function MetricCard({ label, value, hint, icon: Icon, accent = "primary", loading, onClick, active }: MetricCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/60 transition-all hover:shadow-md",
        onClick && "cursor-pointer select-none",
        active && "ring-2 ring-primary/60",
      )}
      onClick={onClick}
    >
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          )}
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
