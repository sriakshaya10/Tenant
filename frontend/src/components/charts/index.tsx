import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts'

export const CHART_COLORS = ['#b05f4d', '#5b6f8f', '#c99a4e', '#7d6f9c', '#6f8f7f', '#7a717c']

const AXIS = { fontSize: 11, fill: '#7a717c', fontFamily: '"IBM Plex Sans", sans-serif' }

export interface Series {
  key: string
  label: string
  color?: string
}

type Formatter = (value: number) => string

function ChartTooltip({ active, payload, label, format }: TooltipProps<number, string> & { format?: Formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-line bg-white px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-medium text-ink">{label}</p>
      {payload.map(item => (
        <div key={item.dataKey as string} className="flex items-center gap-2 text-ink-soft">
          <span className="size-2 rounded-sm" style={{ background: item.color }} />
          <span>{item.name}</span>
          <span className="tabular ml-auto pl-4 font-mono text-ink">
            {format ? format(Number(item.value)) : Number(item.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ChartLegend({ series }: { series: Series[] }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-ink-muted">
      {series.map((s, i) => (
        <span key={s.key} className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm" style={{ background: s.color ?? CHART_COLORS[i % CHART_COLORS.length] }} />
          {s.label}
        </span>
      ))}
    </div>
  )
}

interface BarChartProps {
  data: Record<string, unknown>[]
  xKey: string
  series: Series[]
  height?: number
  format?: Formatter
  /** Lay bars out horizontally, which reads better for long category names. */
  horizontal?: boolean
  domain?: [number, number]
  /** Per-bar colours for single-series charts. */
  colorFor?: (row: Record<string, unknown>) => string
}

export function BarChartView({ data, xKey, series, height = 260, format, horizontal, domain, colorFor }: BarChartProps) {
  const categoryAxis = horizontal ? (
    <YAxis type="category" dataKey={xKey} tick={AXIS} width={150} axisLine={false} tickLine={false} />
  ) : (
    <XAxis dataKey={xKey} tick={AXIS} axisLine={{ stroke: '#ebe1dd' }} tickLine={false} interval="preserveStartEnd" minTickGap={8} />
  )
  const valueAxis = horizontal ? (
    <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} domain={domain} tickFormatter={format} />
  ) : (
    <YAxis tick={AXIS} axisLine={false} tickLine={false} width={44} domain={domain} tickFormatter={format} />
  )

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 4, right: 12, left: horizontal ? 0 : -8, bottom: 0 }}
        barCategoryGap={horizontal ? 6 : '24%'}
      >
        <CartesianGrid stroke="#efe6e2" vertical={horizontal} horizontal={!horizontal} />
        {categoryAxis}
        {valueAxis}
        <Tooltip cursor={{ fill: 'rgba(37,34,43,0.04)' }} content={<ChartTooltip format={format} />} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            radius={horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0]}
            maxBarSize={horizontal ? 18 : 36}
          >
            {colorFor && series.length === 1 && data.map((row, idx) => <Cell key={idx} fill={colorFor(row)} />)}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
