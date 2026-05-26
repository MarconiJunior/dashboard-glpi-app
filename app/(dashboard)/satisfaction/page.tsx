"use client"

import { MessageSquare, Star, ThumbsDown, ThumbsUp, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { MetricCard } from "@/components/dashboard/metric-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate, getInitials, getRequesterName } from "@/src/presentation/utils/ticket";
import { useSatisfaction } from "@/src/presentation/viewmodels/use-satisfaction";

const trendConfig = {
  media: { label: "Média", color: "var(--chart-1)" },
} satisfies ChartConfig

const distConfig = {
  total: { label: "Avaliações", color: "var(--chart-2)" },
} satisfies ChartConfig

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
  )
}

export default function SatisfactionPage() {
  const { data, isLoading } = useSatisfaction()
  const stats = data?.stats
  const list = data?.list ?? []
  const monthly = data?.monthly ?? []
  const distribution = data?.distribution ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Satisfação dos usuários</h1>
        <p className="text-sm text-muted-foreground">
          Avaliações dos chamados onde você foi o técnico responsável.
        </p>
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
          hint="≥ 4 estrelas"
          icon={ThumbsUp}
          accent="emerald"
          loading={isLoading}
        />
        <MetricCard
          label="Negativas"
          value={stats ? `${stats.negativePct.toFixed(0)}%` : "—"}
          hint="≤ 2 estrelas"
          icon={ThumbsDown}
          accent="red"
          loading={isLoading}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" /> Evolução mensal
            </CardTitle>
            <CardDescription>Média mensal das avaliações recebidas</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <ChartContainer config={trendConfig} className="h-72 w-full">
                <LineChart data={monthly} margin={{ left: 8, right: 16, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis domain={[0, 5]} tickLine={false} axisLine={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    dataKey="media"
                    type="monotone"
                    stroke="var(--color-media)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "var(--color-media)" }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Distribuição de notas</CardTitle>
            <CardDescription>Quantidade de avaliações por nota</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <ChartContainer config={distConfig} className="h-72 w-full">
                <BarChart data={distribution} margin={{ left: 8, right: 16, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="nota" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} />
                  <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Avaliações recentes</CardTitle>
          <CardDescription>Comentários e notas dos usuários</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((s: any) => (
                <div
                  key={s.id}
                  className="flex gap-3 rounded-lg border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/15 text-xs text-primary">
                      {getInitials(getRequesterName({ requester: s.user } as any))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{getRequesterName({ requester: s.user } as any)}</span>
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
  )
}
