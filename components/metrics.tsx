'use client'

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'

type DataPoint = { time: string; usage: number }

type MetricsProps = {
  title: string
  value: string
  change?: string
  desc: string
  data: DataPoint[]
  unit?: string
}

const Metrics = ({
  title,
  value,
  change,
  desc,
  data,
  unit = '%',
}: MetricsProps) => {
  const id = title.replace(/[^a-zA-Z0-9]/g, '')
  const latest = data.at(-1)?.usage
  const previous = data.at(-2)?.usage
  const rising =
    latest !== undefined && previous !== undefined && latest > previous

  return (
    <div className="group min-w-0 overflow-hidden rounded-sm border border-neutral-200/30 bg-white p-5 shadow-sm ">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <h2 className="mt-2 truncate text-3xl font-semibold tracking-tight text-neutral-950">
            {value}
          </h2>
        </div>

        <span className="shrink-0 rounded-full border border-neutral-200/80 bg-neutral-50 px-5 py-0.5 text-[11px] font-medium text-neutral-500">
          24 hours
        </span>
      </div>

      {change && (
        <p className="mt-2 truncate text-xs text-neutral-500">{change}</p>
      )}

      <div className="mt-5 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 1, left: 1, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`fill${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#525252" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#525252" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <XAxis dataKey="time" hide />
            <Tooltip
              formatter={(v) => [`${v}${unit}`, title]}
              labelStyle={{ color: '#737373', fontSize: 11 }}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e5e5e5',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                fontSize: 12,
              }}
            />

            <Area
              type="monotone"
              dataKey="usage"
              stroke="#404040"
              strokeWidth={1.8}
              fill={`url(#fill${id})`}
              activeDot={{
                r: 3,
                fill: '#171717',
                stroke: '#fff',
                strokeWidth: 2,
              }}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
        <p className="truncate text-xs text-neutral-500">{desc}</p>
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            rising ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          title={rising ? 'Trending upward' : 'Stable or trending downward'}
        />
      </div>
    </div>
  )
}

export default Metrics
