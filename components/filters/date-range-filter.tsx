"use client";

import { CalendarDays, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface DateRange {
  from: string; // "YYYY-MM-DD" ou vazio
  to: string;   // "YYYY-MM-DD" ou vazio
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Atalhos rápidos
// ---------------------------------------------------------------------------

interface Preset {
  label: string;
  days: number; // -1 = sem filtro (tudo)
}

const PRESETS: Preset[] = [
  { label: "Hoje", days: 0 },
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "3 meses", days: 90 },
  { label: "Tudo", days: -1 },
];

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function DateRangeFilter({ value, onChange, className }: Props) {
  const hasRange = Boolean(value.from || value.to);

  const applyPreset = (days: number) => {
    if (days === -1) {
      onChange({ from: "", to: "" });
      return;
    }
    const to = new Date();
    const from = new Date();
    if (days > 0) from.setDate(from.getDate() - days);
    onChange({ from: toIsoDate(from), to: toIsoDate(to) });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />

      {/* Inputs de data */}
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="h-8 w-[160px] text-xs"
          aria-label="Data de início"
        />
        <span className="text-xs text-muted-foreground">até</span>
        <Input
          type="date"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="h-8 w-[160px] text-xs"
          aria-label="Data de fim"
        />
      </div>

      {/* Atalhos */}
      <div className="flex flex-wrap items-center gap-1">
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => applyPreset(p.days)}
          >
            {p.label}
          </Button>
        ))}

        {hasRange && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onChange({ from: "", to: "" })}
            aria-label="Limpar datas"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
