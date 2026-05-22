"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"

const config = {
  abertos: { label: "Abertos", color: "var(--chart-1)" },
  resolvidos: { label: "Resolvidos", color: "var(--chart-2)" },
} satisfies ChartConfig

export function MonthlyChart({ data }: { data: { month: string; abertos: number; resolvidos: number }[] }) {
  return (
    <ChartContainer config={config} className="h-72 w-full">
      <AreaChart data={data} margin={{ left: 8, right: 16, top: 8 }}>
        <defs>
          <linearGradient id="fillAbertos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-abertos)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--color-abertos)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="fillResolvidos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-resolvidos)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--color-resolvidos)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area dataKey="abertos" type="monotone" stroke="var(--color-abertos)" fill="url(#fillAbertos)" strokeWidth={2} />
        <Area dataKey="resolvidos" type="monotone" stroke="var(--color-resolvidos)" fill="url(#fillResolvidos)" strokeWidth={2} />
      </AreaChart>
    </ChartContainer>
  )
}
