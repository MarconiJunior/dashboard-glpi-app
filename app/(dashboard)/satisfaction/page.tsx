"use client";

import { MessageSquare, Star, ThumbsDown, ThumbsUp, TrendingUp, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, XAxis, YAxis } from "recharts";

import { DateRangeFilter, type DateRange } from "@/components/filters/date-range-filter";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { GlpiSatisfaction } from "@/src/domain/entities/ticket";
import { formatDate, getInitials, getRequesterName } from "@/src/presentation/utils/ticket";
import { useSatisfaction } from "@/src/presentation/viewmodels/use-satisfaction";

// ---------------------------------------------------------------------------
// Configurações de gráfico
// ---------------------------------------------------------------------------

const trendConfig = {
  media: { label: "Média", color: "var(--chart-1)" },
} satisfies ChartConfig;

const distConfig = {
  total: { label: "Avaliações", color: "var(--chart-2)" },
} satisfies ChartConfig;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-3.5 w-3.5",
            n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}

// Extrai mês-chave (ex: "jun") de uma data ISO
function monthKeyFromIso(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { month: "short" });
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function SatisfactionPage() {
  const { data, isLoading } = useSatisfaction();

  // Filtros
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<"positive" | "negative" | null>(null);

  const stats = data?.stats;
  const rawList = data?.list ?? [];
  const monthly = data?.monthly ?? [];
  const distribution = data?.distribution ?? [];

  // ---------------------------------------------------------------------------
  // Lista filtrada (client-side)
  // ---------------------------------------------------------------------------

  const filteredList = useMemo(() => {
    let items = rawList;

    if (dateRange.from) {
      const from = new Date(dateRange.from);
      items = items.filter((s) => new Date(s.date_answered) >= from);
    }
    if (dateRange.to) {
      const to = new Date(dateRange.to);
      to.setHours(23, 59, 59, 999);
      items = items.filter((s) => new Date(s.date_answered) <= to);
    }
    if (starFilter !== null) {
      items = items.filter((s) => s.satisfaction === starFilter);
    }
    if (sentimentFilter === "positive") {
      items = items.filter((s) => s.satisfaction >= 4);
    } else if (sentimentFilter === "negative") {
      items = items.filter((s) => s.satisfaction <= 2);
    }
    if (monthFilter !== null) {
      items = items.filter((s) => monthKeyFromIso(s.date_answered) === monthFilter);
    }

    return items;
  }, [rawList, dateRange, starFilter, sentimentFilter, monthFilter]);

  const hasFilter = Boolean(dateRange.from || dateRange.to || starFilter !== null || sentimentFilter !== null || monthFilter !== null);

  const clearChartFilters = () => {
    setStarFilter(null);
    setMonthFilter(null);
    setSentimentFilter(null);
  };

  const toggleSentiment = (s: "positive" | "negative") => {
    setSentimentFilter((prev) => (prev === s ? null : s));
    setStarFilter(null);
  };

  // ---------------------------------------------------------------------------
  // Handlers de clique nos gráficos
  // ---------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBarClick = (entry: any) => {
    if (!entry || !entry.activePayload) return;
    const nota = entry.activePayload[0]?.payload?.nota as string | undefined;
    if (!nota) return;
    const n = parseInt(nota, 10);
    setStarFilter((prev) => (prev === n ? null : n));
    setMonthFilter(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLineClick = (entry: any) => {
    if (!entry || !entry.activePayload) return;
    const month = entry.activePayload[0]?.payload?.month as string | undefined;
    if (!month) return;
    setMonthFilter((prev) => (prev === month ? null : month));
    setStarFilter(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Satisfação dos usuários</h1>
          <p className="text-sm text-muted-foreground">
            Avaliações dos chamados onde você foi o técnico responsável.
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={(r) => { setDateRange(r); setMonthFilter(null); setStarFilter(null); }} />
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Média geral"
          value={stats ? `${stats.avg.toFixed(2)} ★` : "—"}
          hint="Todas as avaliações"
          icon={Star}
          accent="amber"
          loading={isLoading}
        />
        <MetricCard
          label="Avaliações"
          value={stats?.total ?? 0}
          hint="Total recebidas"
          icon={MessageSquare}
          accent="primary"
          loading={isLoading}
        />
        <MetricCard
          label="Positivas"
          value={stats ? `${stats.positivePct.toFixed(0)}%` : "—"}
          hint="≥ 4 estrelas · clique para filtrar"
          icon={ThumbsUp}
          accent="emerald"
          loading={isLoading}
          onClick={() => toggleSentiment("positive")}
          active={sentimentFilter === "positive"}
        />
        <MetricCard
          label="Negativas"
          value={stats ? `${stats.negativePct.toFixed(0)}%` : "—"}
          hint="≤ 2 estrelas · clique para filtrar"
          icon={ThumbsDown}
          accent="red"
          loading={isLoading}
          onClick={() => toggleSentiment("negative")}
          active={sentimentFilter === "negative"}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Evolução mensal — clicável */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" /> Evolução mensal
            </CardTitle>
            <CardDescription>
              Média mensal das avaliações · clique em um ponto para filtrar a lista
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <ChartContainer config={trendConfig} className="h-72 w-full">
                <LineChart
                  data={monthly}
                  margin={{ left: 8, right: 16, top: 8 }}
                  onClick={handleLineClick}
                  style={{ cursor: "pointer" }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis domain={[0, 5]} tickLine={false} axisLine={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    dataKey="media"
                    type="monotone"
                    stroke="var(--color-media)"
                    strokeWidth={2.5}
                    dot={(props) => {
                      const { cx, cy, payload, index } = props;
                      const active = monthFilter === payload.month;
                      return (
                        <circle
                          key={`dot-${index}-${payload.month}`}
                          cx={cx}
                          cy={cy}
                          r={active ? 7 : 4}
                          fill="var(--color-media)"
                          stroke={active ? "var(--background)" : "none"}
                          strokeWidth={active ? 2 : 0}
                        />
                      );
                    }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de notas — clicável */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Distribuição de notas</CardTitle>
            <CardDescription>
              Quantidade de avaliações por nota · clique em uma barra para filtrar
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <ChartContainer config={distConfig} className="h-72 w-full">
                <BarChart
                  data={distribution}
                  margin={{ left: 8, right: 16, top: 8 }}
                  onClick={handleBarClick}
                  style={{ cursor: "pointer" }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="nota" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} />
                  <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {distribution.map((entry) => {
                      const n = parseInt(entry.nota, 10);
                      const active = starFilter === n;
                      return (
                        <Cell
                          key={`cell-${entry.nota}`}
                          fill={active ? "var(--chart-1)" : "var(--color-total)"}
                          opacity={starFilter !== null && !active ? 0.35 : 1}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Lista de avaliações com chips de filtro ativo */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Avaliações recentes</CardTitle>
              <CardDescription>Comentários e notas dos usuários</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {sentimentFilter === "positive" && (
                <Badge
                  variant="secondary"
                  className="flex cursor-pointer items-center gap-1 border-emerald-500/40 bg-emerald-500/10 pr-1 text-emerald-700 dark:text-emerald-400"
                  onClick={() => setSentimentFilter(null)}
                >
                  ≥ 4 ★ Positivas
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {sentimentFilter === "negative" && (
                <Badge
                  variant="secondary"
                  className="flex cursor-pointer items-center gap-1 border-red-500/40 bg-red-500/10 pr-1 text-red-700 dark:text-red-400"
                  onClick={() => setSentimentFilter(null)}
                >
                  ≤ 2 ★ Negativas
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {starFilter !== null && (
                <Badge
                  variant="secondary"
                  className="flex cursor-pointer items-center gap-1 pr-1"
                  onClick={() => setStarFilter(null)}
                >
                  {starFilter} ★
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {monthFilter !== null && (
                <Badge
                  variant="secondary"
                  className="flex cursor-pointer items-center gap-1 pr-1"
                  onClick={() => setMonthFilter(null)}
                >
                  {monthFilter}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {(starFilter !== null || monthFilter !== null) && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearChartFilters}>
                  Limpar filtros
                </Button>
              )}
              {filteredList.length !== rawList.length && (
                <span className="text-xs text-muted-foreground">
                  {filteredList.length} de {rawList.length}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <Star className="h-8 w-8 opacity-20" />
              <p>{hasFilter ? "Nenhuma avaliação para os filtros selecionados." : "Nenhuma avaliação encontrada."}</p>
              {hasFilter && (
                <Button variant="outline" size="sm" onClick={() => { setDateRange({ from: "", to: "" }); clearChartFilters(); }}>
                  Limpar todos os filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredList.map((s: GlpiSatisfaction) => (
                <div
                  key={s.id}
                  className="flex gap-3 rounded-lg border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/15 text-xs text-primary">
                      {getInitials(getRequesterName(s.user))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{getRequesterName(s.user)}</span>
                      <StarRating value={s.satisfaction} />
                      <span className="ml-auto text-xs text-muted-foreground">{formatDate(s.date_answered)}</span>
                    </div>
                    {s.comment && <p className="text-sm leading-relaxed text-muted-foreground">{s.comment}</p>}
                    <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                      <span className="font-mono">#{s.ticket_id}</span>
                      <span>·</span>
                      <span className="line-clamp-1">{s.ticket_name}</span>
                      <span className="ml-auto rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px]">
                        {s.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
