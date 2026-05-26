"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const config = {
  tempoMedio: { label: "Horas", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function ResolutionTimeChart({ data }: { data: { month: string; tempoMedio: number }[] }) {
  return (
    <ChartContainer config={config} className="h-72 w-full">
      <LineChart data={data} margin={{ left: 8, right: 16, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} fontSize={11} unit="h" />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Line
          dataKey="tempoMedio"
          type="monotone"
          stroke="var(--color-tempoMedio)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "var(--color-tempoMedio)" }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
