"use client"

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
} from "recharts"

export interface MarketPositionPoint {
  name: string
  x: number
  y: number
  z: number
  isSubject?: boolean
}

// Fallback data used only when no API data is passed (e.g. Storybook / static preview)
const DEFAULT_DATA: MarketPositionPoint[] = [
  { name: "FlowAI", x: 35, y: 90, z: 400, isSubject: true },
  { name: "Zapier", x: 80, y: 45, z: 350 },
  { name: "Make", x: 55, y: 65, z: 300 },
  { name: "UiPath", x: 90, y: 55, z: 350 },
  { name: "n8n", x: 30, y: 70, z: 250 },
]

const colors = [
  "var(--color-primary)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

function CustomTooltipContent({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { name: string; x: number; y: number } }>
}) {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
        <p className="text-sm font-semibold text-card-foreground">{d.name}</p>
        <p className="text-xs text-muted-foreground">
          Sophistication: {d.x} &middot; Innovation: {d.y}
        </p>
      </div>
    )
  }
  return null
}

export function MarketPositionChart({
  data = DEFAULT_DATA,
}: {
  data?: MarketPositionPoint[]
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            type="number"
            dataKey="x"
            name="Market Sophistication"
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            className="text-xs fill-muted-foreground"
            label={{
              value: "Market Sophistication",
              position: "insideBottom",
              offset: -5,
              className: "fill-muted-foreground text-xs",
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Innovation Level"
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            className="text-xs fill-muted-foreground"
            label={{
              value: "Innovation Level",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              className: "fill-muted-foreground text-xs",
            }}
          />
          <RechartsTooltip content={<CustomTooltipContent />} />
          <Scatter data={data} name="Companies">
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={colors[index % colors.length]}
                r={entry.isSubject ? 12 : 8}
                stroke={entry.isSubject ? "var(--color-primary)" : "transparent"}
                strokeWidth={entry.isSubject ? 3 : 0}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-4">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-xs text-muted-foreground">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
